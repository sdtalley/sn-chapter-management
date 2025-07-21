// Import chapter lookup data at the very top of the file
const { chapterLookup, getChapterData } = require('./chapter-records');
const { Redis } = require('@upstash/redis');

// Initialize Redis client (Vercel will auto-populate these env vars when you connect Upstash)
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Cache for access token
let tokenCache = {
  accessToken: null,
  expiresAt: null
};

// Helper function to get valid access token
async function getValidAccessToken() {
  // Check if we have a valid cached token
  if (tokenCache.accessToken && tokenCache.expiresAt && new Date().getTime() < tokenCache.expiresAt) {
    console.log('Using cached access token');
    return tokenCache.accessToken;
  }

  console.log('Getting new access token using refresh token');
  
  // Get current refresh token from Redis, fallback to env var
  let currentRefreshToken;
  try {
    currentRefreshToken = await redis.get('blackbaud_refresh_token');
    console.log('Got refresh token from Redis');
  } catch (error) {
    console.log('Redis error, using env var:', error.message);
  }
  
  // Fallback to environment variable if Redis doesn't have it
  if (!currentRefreshToken) {
    currentRefreshToken = process.env.BLACKBAUD_REFRESH_TOKEN;
    console.log('Using refresh token from environment variable');
    
    // Store it in Redis for next time
    try {
      await redis.set('blackbaud_refresh_token', currentRefreshToken);
      console.log('Stored env refresh token in Redis');
    } catch (error) {
      console.log('Failed to store in Redis:', error.message);
    }
  }
  
  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }
  
  // Get new access token using refresh token
  const tokenResponse = await fetch('https://oauth2.sky.blackbaud.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.BLACKBAUD_CLIENT_ID}:${process.env.BLACKBAUD_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentRefreshToken
    })
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token refresh failed:', errorText);
    throw new Error(`Token refresh failed: ${tokenResponse.status} - ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  
  // Cache the new access token
  tokenCache.accessToken = tokenData.access_token;
  tokenCache.expiresAt = new Date().getTime() + ((tokenData.expires_in - 300) * 1000); // Expire 5 minutes early
  
  // IMPORTANT: Update the refresh token if a new one was provided
  if (tokenData.refresh_token && tokenData.refresh_token !== currentRefreshToken) {
    console.log('New refresh token received - updating Redis');
    try {
      await redis.set('blackbaud_refresh_token', tokenData.refresh_token);
      console.log('Successfully updated refresh token in Redis');
    } catch (error) {
      console.error('Failed to update refresh token in Redis:', error);
      // Still log it so you can manually update if needed
      console.warn('===========================================');
      console.warn('FAILED TO SAVE - MANUAL UPDATE NEEDED:');
      console.warn(`BLACKBAUD_REFRESH_TOKEN=${tokenData.refresh_token}`);
      console.warn('===========================================');
    }
  }
  
  return tokenCache.accessToken;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const { action, endpoint, chapter, jobId } = req.query;
    
    // Handle chapter lookup
    if (action === 'chapter-lookup' && chapter) {
      const chapterInfo = getChapterData(chapter);
      if (chapterInfo) {
        res.json(chapterInfo);
      } else {
        res.status(404).json({ error: 'Chapter not found' });
      }
      return;
    }
    
    // For auth action, just return success since we're using refresh tokens
    if (action === 'auth') {
      // Get a fresh token to verify credentials work
      try {
        const accessToken = await getValidAccessToken();
        res.json({ 
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600,
          message: 'Using server-side refresh token authentication'
        });
      } catch (error) {
        res.status(401).json({ error: 'Authentication failed: ' + error.message });
      }
      return;
    }
    
    // Get valid access token for all API calls
    const accessToken = await getValidAccessToken();
    console.log('Access token obtained:', accessToken ? 'Yes' : 'No');
    console.log('Subscription key exists:', process.env.BLACKBAUD_SUBSCRIPTION_KEY ? 'Yes' : 'No');
    
    if (action === 'query-execute') {
      // Execute ad-hoc query using the correct endpoint
      const queryRequest = req.body;
      
      console.log('Attempting query execution with request:', JSON.stringify(queryRequest, null, 2));
      
      // POST /query/queries/execute with required parameters
      const queryUrl = 'https://api.sky.blackbaud.com/query/queries/execute?product=RE&module=None';
      console.log('Query URL:', queryUrl);
      
      const queryResponse = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(queryRequest)
      });
      
      const responseText = await queryResponse.text();
      console.log('Query response status:', queryResponse.status);
      console.log('Query response body:', responseText);
      
      if (!queryResponse.ok) {
        console.error('Query execution failed');
        console.error('Status:', queryResponse.status);
        console.error('Response:', responseText);
        throw new Error(`Query execution failed: ${queryResponse.status} - ${responseText}`);
      }
      
      try {
        const queryData = JSON.parse(responseText);
        res.json(queryData);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        res.json({ rawResponse: responseText });
      }
      
    } else if (action === 'query-status' && jobId) {
      // Check query job status using the correct endpoint
      // GET /query/jobs/{id} with required parameters including include_read_url
      const statusUrl = `https://api.sky.blackbaud.com/query/jobs/${jobId}?product=RE&module=None&include_read_url=OnceCompleted`;
      console.log('Status check URL:', statusUrl);
      
      const statusResponse = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY
        }
      });
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Query status error:', errorText);
        throw new Error(`Query status check failed: ${statusResponse.status} - ${errorText}`);
      }
      
      const statusData = await statusResponse.json();
      console.log('Status response:', JSON.stringify(statusData, null, 2));
      res.json(statusData);
      
    } else if (action === 'query-results' && req.query.url) {
      // Get the URL - it might be double-encoded
      let resultsUrl = req.query.url;
      
      console.log('Raw URL from query:', resultsUrl.substring(0, 100));
      
      // Decode until we get a stable URL (handles double-encoding)
      let previousUrl = '';
      while (resultsUrl !== previousUrl) {
        previousUrl = resultsUrl;
        try {
          resultsUrl = decodeURIComponent(resultsUrl);
        } catch (e) {
          // If decoding fails, we've decoded as much as we can
          break;
        }
      }
      
      console.log('Fetching results from SAS URI');
      console.log('Decoded URL length:', resultsUrl.length);
      console.log('First 100 chars:', resultsUrl.substring(0, 100));
      
      // SAS URIs are pre-signed, they don't need authentication headers
      const resultsResponse = await fetch(resultsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!resultsResponse.ok) {
        const errorText = await resultsResponse.text();
        console.error('Failed to fetch from SAS URI');
        console.error('Status:', resultsResponse.status);
        console.error('Response:', errorText);
        console.error('SAS URI (first 100 chars):', resultsUrl.substring(0, 100) + '...');
        throw new Error(`Failed to fetch query results: ${resultsResponse.status} - ${errorText}`);
      }
      
      const resultsData = await resultsResponse.json();
      console.log('Successfully fetched results, row count:', resultsData.length);
      res.json(resultsData);
      
    } else if (action === 'api' && endpoint) {
      // Make API call
      const apiResponse = await fetch(`https://api.sky.blackbaud.com${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!apiResponse.ok) {
        throw new Error(`API call failed: ${apiResponse.status}`);
      }
      
      const data = await apiResponse.json();
      res.json(data);
      
    } else {
      res.status(400).json({ error: 'Invalid action or missing parameters' });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}