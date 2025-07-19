// Import chapter lookup data at the very top of the file
const { chapterLookup, getChapterData } = require('./chapter-records');

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
  
  // Get new access token using refresh token
  const tokenResponse = await fetch('https://oauth2.sky.blackbaud.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.BLACKBAUD_CLIENT_ID}:${process.env.BLACKBAUD_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.BLACKBAUD_REFRESH_TOKEN
    })
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Token refresh failed: ${tokenResponse.status} - ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  
  // Cache the new token
  tokenCache.accessToken = tokenData.access_token;
  tokenCache.expiresAt = new Date().getTime() + ((tokenData.expires_in - 300) * 1000); // Expire 5 minutes early
  
  // If a new refresh token was provided, you might want to log it for manual update
  if (tokenData.refresh_token && tokenData.refresh_token !== process.env.BLACKBAUD_REFRESH_TOKEN) {
    console.warn('NEW REFRESH TOKEN PROVIDED - Update your environment variable:', tokenData.refresh_token);
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
      // Execute ad-hoc query - trying different endpoint variations
      const queryRequest = req.body;
      
      console.log('Attempting query execution with request:', JSON.stringify(queryRequest, null, 2));
      
      // Try the endpoint as shown in Blackbaud documentation
      const queryUrl = 'https://api.sky.blackbaud.com/query/v1/jobs?product=RE&module=none';
      console.log('Query URL:', queryUrl);
      
      const queryResponse = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'bb-api-subscription-key': process.env.BLACKBAUD_SUBSCRIPTION_KEY, // Try lowercase too
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(queryRequest)
      });
      
      const responseText = await queryResponse.text();
      console.log('Query response status:', queryResponse.status);
      console.log('Query response headers:', queryResponse.headers);
      console.log('Query response body:', responseText);
      
      if (!queryResponse.ok) {
        // Log more details about the error
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
      // Check query job status using the correct endpoint from documentation
      // GET /query/v1/jobs/{id} with required parameters
      const statusResponse = await fetch(`https://api.sky.blackbaud.com/query/v1/jobs/${jobId}?product=RE&module=none`, {
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
      res.json(statusData);
      
    } else if (action === 'query-results' && req.query.url) {
      // Fetch query results from provided URL
      const resultsUrl = decodeURIComponent(req.query.url);
      
      const resultsResponse = await fetch(resultsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY
        }
      });
      
      if (!resultsResponse.ok) {
        throw new Error(`Failed to fetch query results: ${resultsResponse.status}`);
      }
      
      const resultsData = await resultsResponse.json();
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