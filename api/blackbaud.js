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

  console.log('Getting new access token...');
  
  // First, try to use refresh token
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
  }
  
  // Try refresh token flow first if we have a refresh token
  if (currentRefreshToken) {
    try {
      console.log('Attempting to use refresh token...');
      
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

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        
        // Cache the new access token
        tokenCache.accessToken = tokenData.access_token;
        tokenCache.expiresAt = new Date().getTime() + ((tokenData.expires_in - 300) * 1000); // Expire 5 minutes early
        
        // Update the refresh token if a new one was provided
        if (tokenData.refresh_token && tokenData.refresh_token !== currentRefreshToken) {
          console.log('New refresh token received - updating Redis');
          try {
            await redis.set('blackbaud_refresh_token', tokenData.refresh_token);
            console.log('Successfully updated refresh token in Redis');
          } catch (error) {
            console.error('Failed to update refresh token in Redis:', error);
          }
        }
        
        return tokenCache.accessToken;
      } else {
        const errorText = await tokenResponse.text();
        console.error('Refresh token failed:', tokenResponse.status, errorText);
        // Fall through to client credentials flow
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      // Fall through to client credentials flow
    }
  }
  
  // If refresh token failed or doesn't exist, use client credentials flow
  console.log('Refresh token invalid or missing, using client credentials flow...');
  
  if (!process.env.BLACKBAUD_CLIENT_ID || !process.env.BLACKBAUD_CLIENT_SECRET) {
    throw new Error('Blackbaud client credentials not configured in environment variables');
  }
  
  try {
    const tokenResponse = await fetch('https://oauth2.sky.blackbaud.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.BLACKBAUD_CLIENT_ID}:${process.env.BLACKBAUD_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Client credentials failed:', errorText);
      throw new Error(`Client credentials authentication failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    // Cache the new access token
    tokenCache.accessToken = tokenData.access_token;
    tokenCache.expiresAt = new Date().getTime() + ((tokenData.expires_in - 300) * 1000); // Expire 5 minutes early
    
    // If we got a refresh token, store it (some OAuth2 providers include it with client credentials)
    if (tokenData.refresh_token) {
      console.log('Got refresh token from client credentials - storing in Redis');
      try {
        await redis.set('blackbaud_refresh_token', tokenData.refresh_token);
        console.log('Successfully stored new refresh token in Redis');
      } catch (error) {
        console.error('Failed to store refresh token in Redis:', error);
        // Send alert to Azure Logic App
        try {
          const alertMessage = `===========================================
IMPORTANT: Add this to your environment variables:
BLACKBAUD_REFRESH_TOKEN=${tokenData.refresh_token}
===========================================`;
          
          await fetch('https://prod-189.westus.logic.azure.com:443/workflows/af7823ce7d31421aa671a4cff7371d72/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=b-TFEo2iNFYqsvEG9GsrjFy7bbaMyZMz_MshptYhgwE', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: alertMessage })
          });
          console.log('Alert sent to Azure Logic App');
        } catch (alertError) {
          console.error('Failed to send alert:', alertError);
        }
      }
    }
    
    return tokenCache.accessToken;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const { action, endpoint, chapter, jobId, constituentId, sid } = req.query;
    
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
    
    // Handle allowed skips actions
    if (action === 'get-allowed-skips') {
      try {
        // Get all allowed skips data from Redis
        const allowedSkips = await redis.get('allowed_skips') || {};
        res.json(allowedSkips);
      } catch (error) {
        console.error('Error getting allowed skips:', error);
        res.json({});
      }
      return;
    }
    
    if (action === 'set-allowed-skips' && req.method === 'POST') {
      try {
        const { chapter, allowSkips } = req.body;
        
        // Get current allowed skips data
        const allowedSkips = await redis.get('allowed_skips') || {};
        
        // Update the specific chapter
        allowedSkips[chapter] = allowSkips;
        
        // Save back to Redis
        await redis.set('allowed_skips', allowedSkips);
        
        res.json({ success: true, message: 'Allowed skips updated' });
      } catch (error) {
        console.error('Error setting allowed skips:', error);
        res.status(500).json({ error: 'Failed to update allowed skips' });
      }
      return;
    }
    
    //Get Chapters for chapter drop-down
    if (action === 'get-chapters') {
      // Return just the chapter names (no sensitive data)
      const chapterNames = Object.keys(chapterLookup).sort();
      res.json(chapterNames);
      return;
    }
    
    // NEW: Get advisor chapters for STS 4
    if (action === 'get-advisor-chapters') {
      if (!sid) {
        res.status(400).json({ error: 'SID parameter required' });
        return;
      }
      
      try {
        console.log('Fetching relationships for SID:', sid);
        const accessToken = await getValidAccessToken();
        
        // Get constituent relationships
        const relationshipsUrl = `https://api.sky.blackbaud.com/constituent/v1/constituents/${sid}/relationships`;
        const relationshipsResponse = await fetch(relationshipsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY
          }
        });
        
        if (!relationshipsResponse.ok) {
          const errorText = await relationshipsResponse.text();
          console.error('Failed to fetch relationships:', relationshipsResponse.status, errorText);
          throw new Error(`Failed to fetch relationships: ${relationshipsResponse.status}`);
        }
        
        const relationshipsData = await relationshipsResponse.json();
        console.log('Total relationships found:', relationshipsData.count);
        
        // Filter for Chapter Advisor and Co-Advisor relationships with no end date and type "Collegiate Chapter"
        const advisorChapters = [];
        
        if (relationshipsData.value && Array.isArray(relationshipsData.value)) {
          relationshipsData.value.forEach(relationship => {
            // Check if this is a Chapter Advisor or Co-Advisor relationship
            if ((relationship.reciprocal_type === 'Chapter Advisor' || 
                 relationship.reciprocal_type === 'Co-Advisor') &&
                relationship.type === 'Collegiate Chapter') {
              
              // Check if there's no end date
              if (!relationship.end) {
                // Add the chapter name to our list
                if (relationship.name && !advisorChapters.includes(relationship.name)) {
                  advisorChapters.push(relationship.name);
                  console.log(`Found advisor relationship for chapter: ${relationship.name} (type: ${relationship.type})`);
                }
              }
            }
          });
        }
        
        console.log('Advisor chapters found:', advisorChapters);
        
        // Sort the chapters alphabetically
        advisorChapters.sort();
        
        res.json(advisorChapters);
      } catch (error) {
        console.error('Error getting advisor chapters:', error);
        res.status(500).json({ error: 'Failed to get advisor chapters: ' + error.message });
      }
      return;
    }

    // For auth action, just return success since we're using automatic token management
    if (action === 'auth') {
      // Get a fresh token to verify credentials work
      try {
        const accessToken = await getValidAccessToken();
        res.json({ 
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600,
          message: 'Authentication successful'
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
      
    } else if (action === 'query-results') {
      // Handle both POST and GET methods
      let resultsUrl;
      
      if (req.method === 'POST' && req.body && req.body.url) {
        // POST method - URL comes in body, no encoding issues
        resultsUrl = req.body.url;
        console.log('Received SAS URI via POST');
      } else if (req.query.url) {
        // GET method fallback - decode properly
        resultsUrl = req.query.url;
        console.log('Received SAS URI via GET');
        
        // Decode until stable (handles multiple encoding)
        let previousUrl = '';
        while (resultsUrl !== previousUrl) {
          previousUrl = resultsUrl;
          try {
            resultsUrl = decodeURIComponent(resultsUrl);
          } catch (e) {
            break;
          }
        }
      } else {
        throw new Error('No SAS URI provided');
      }
      
      console.log('Fetching results from SAS URI');
      console.log('URL length:', resultsUrl.length);
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
        console.error('Full SAS URI:', resultsUrl);
        throw new Error(`Failed to fetch query results: ${resultsResponse.status} - ${errorText}`);
      }
      
      const resultsData = await resultsResponse.json();
      console.log('Successfully fetched results, row count:', resultsData.length);
      res.json(resultsData);
      
    } else if (action === 'delete-constituent-code' && endpoint) {
      // Delete constituent code
      const deleteUrl = `https://api.sky.blackbaud.com${endpoint}`;
      console.log('Deleting constituent code:', deleteUrl);
      
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY
        }
      });
      
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorText = await deleteResponse.text();
        throw new Error(`Delete failed: ${deleteResponse.status} - ${errorText}`);
      }
      
      res.json({ success: true, message: 'Code deleted successfully' });
      
    } else if (action === 'create-constituent-code' && req.method === 'POST') {
      // Create constituent code
      const codeData = req.body;
      console.log('Creating constituent code:', codeData);
      
      const createResponse = await fetch('https://api.sky.blackbaud.com/constituent/v1/constituentcodes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(codeData)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Create code failed: ${createResponse.status} - ${errorText}`);
      }
      
      const result = await createResponse.json();
      res.json(result);
      
    } else if (action === 'create-constituent-note' && req.method === 'POST') {
      // Create constituent note
      const noteData = req.body;
      console.log('Creating constituent note:', noteData);
      
      const createResponse = await fetch('https://api.sky.blackbaud.com/constituent/v1/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(noteData)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Create note failed: ${createResponse.status} - ${errorText}`);
      }
      
      const result = await createResponse.json();
      res.json(result);
      
    } else if (action === 'create-constituent-relationship' && req.method === 'POST') {
      // Create constituent relationship
      const relationshipData = req.body;
      console.log('Creating constituent relationship:', relationshipData);
      
      const createResponse = await fetch('https://api.sky.blackbaud.com/constituent/v1/relationships', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(relationshipData)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Create relationship failed: ${createResponse.status} - ${errorText}`);
      }
      
      const result = await createResponse.json();
      res.json(result);
      
    } else if (action === 'delete-relationship' && endpoint) {
      // Delete constituent relationship
      const deleteUrl = `https://api.sky.blackbaud.com${endpoint}`;
      console.log('Deleting relationship:', deleteUrl);
      
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY
        }
      });
      
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorText = await deleteResponse.text();
        throw new Error(`Delete relationship failed: ${deleteResponse.status} - ${errorText}`);
      }
      
      res.json({ success: true, message: 'Relationship deleted successfully' });
      
    } else if (action === 'create-custom-fields' && req.method === 'POST') {
      // Create custom field collection
      const { constituentId, fields } = req.body;
      const url = `https://api.sky.blackbaud.com/constituent/v1/constituents/${constituentId}/customfieldcollection`;
      
      console.log('Creating custom fields for constituent:', constituentId);
      console.log('Fields:', fields);
      
      const createResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fields)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Create custom fields failed: ${createResponse.status} - ${errorText}`);
      }
      
      const result = await createResponse.json();
      res.json(result);
      
    } else if (action === 'get-custom-fields' && constituentId) {
      // Get custom fields for a constituent
      const getUrl = `https://api.sky.blackbaud.com/constituent/v1/constituents/${constituentId}/customfields`;
      console.log('Getting custom fields:', getUrl);
      
      const getResponse = await fetch(getUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY
        }
      });
      
      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        throw new Error(`Get custom fields failed: ${getResponse.status} - ${errorText}`);
      }
      
      const result = await getResponse.json();
      res.json(result);
      
    } else if (action === 'patch-custom-field' && endpoint) {
      // Update custom field (handle both PATCH and POST with method parameter)
      const requestMethod = req.query.method || req.method;
      console.log('PATCH custom field - Request Method:', requestMethod);
      console.log('PATCH custom field - Body:', req.body);
      
      const patchData = req.body;
      const patchUrl = `https://api.sky.blackbaud.com${endpoint}`;
      console.log('Patching custom field:', patchUrl);
      console.log('Patch data to send:', JSON.stringify(patchData));
      
      const patchResponse = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patchData)
      });
      
      if (!patchResponse.ok) {
        const errorText = await patchResponse.text();
        console.error('PATCH response error:', errorText);
        throw new Error(`Patch custom field failed: ${patchResponse.status} - ${errorText}`);
      }
      
      // Check if response has content before trying to parse JSON
      const responseText = await patchResponse.text();
      console.log('PATCH response text:', responseText);
      
      if (responseText && responseText.trim()) {
        try {
          const result = JSON.parse(responseText);
          res.json(result);
        } catch (parseError) {
          console.log('Failed to parse response as JSON, returning success');
          res.json({ success: true, message: 'Custom field updated successfully' });
        }
      } else {
        // Empty response is OK for PATCH requests
        console.log('Empty response from PATCH, returning success');
        res.json({ success: true, message: 'Custom field updated successfully' });
      }
      
    } else if (action === 'create-membership' && constituentId && req.method === 'POST') {
      // Create membership
      const membershipData = req.body;
      const membershipUrl = `https://api.sky.blackbaud.com/membership/v1/constituents/${constituentId}/membership`;
      console.log('Creating membership:', membershipUrl);
      
      const createResponse = await fetch(membershipUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(membershipData)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Create membership failed: ${createResponse.status} - ${errorText}`);
      }
      
      const result = await createResponse.json();
      res.json(result);
      
    } else if (action === 'create-address' && req.method === 'POST') {
      // Create address
      const addressData = req.body;
      console.log('Creating address:', addressData);
      
      const createResponse = await fetch('https://api.sky.blackbaud.com/constituent/v1/addresses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressData)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Create address failed: ${createResponse.status} - ${errorText}`);
      }
      
      const result = await createResponse.json();
      res.json(result);
      
    } else if (action === 'create-phone' && req.method === 'POST') {
      // Create phone
      const phoneData = req.body;
      console.log('Creating phone:', phoneData);
      
      const createResponse = await fetch('https://api.sky.blackbaud.com/constituent/v1/phones', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(phoneData)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Create phone failed: ${createResponse.status} - ${errorText}`);
      }
      
      const result = await createResponse.json();
      res.json(result);
      
    } else if (action === 'create-email' && req.method === 'POST') {
      // Create email address
      const emailData = req.body;
      console.log('Creating email:', emailData);
      
      const createResponse = await fetch('https://api.sky.blackbaud.com/constituent/v1/emailaddresses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Create email failed: ${createResponse.status} - ${errorText}`);
      }
      
      const result = await createResponse.json();
      res.json(result);
      
    } else if (action === 'patch-address' && endpoint) {
      // Update address (handle PATCH)
      const requestMethod = req.query.method || req.method;
      console.log('PATCH address - Request Method:', requestMethod);
      console.log('PATCH address - Body:', req.body);
      
      const patchData = req.body;
      const patchUrl = `https://api.sky.blackbaud.com${endpoint}`;
      console.log('Patching address:', patchUrl);
      console.log('Patch data to send:', JSON.stringify(patchData));
      
      const patchResponse = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patchData)
      });
      
      if (!patchResponse.ok) {
        const errorText = await patchResponse.text();
        console.error('PATCH address error:', errorText);
        throw new Error(`Patch address failed: ${patchResponse.status} - ${errorText}`);
      }
      
      // Check if response has content before trying to parse JSON
      const responseText = await patchResponse.text();
      console.log('PATCH address response text:', responseText);
      
      if (responseText && responseText.trim()) {
        try {
          const result = JSON.parse(responseText);
          res.json(result);
        } catch (parseError) {
          console.log('Failed to parse response as JSON, returning success');
          res.json({ success: true, message: 'Address updated successfully' });
        }
      } else {
        // Empty response is OK for PATCH requests
        console.log('Empty response from PATCH, returning success');
        res.json({ success: true, message: 'Address updated successfully' });
      }
      
    } else if (action === 'patch-phone' && endpoint) {
      // Update phone (handle PATCH)
      const requestMethod = req.query.method || req.method;
      console.log('PATCH phone - Request Method:', requestMethod);
      console.log('PATCH phone - Body:', req.body);
      
      const patchData = req.body;
      const patchUrl = `https://api.sky.blackbaud.com${endpoint}`;
      console.log('Patching phone:', patchUrl);
      console.log('Patch data to send:', JSON.stringify(patchData));
      
      const patchResponse = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patchData)
      });
      
      if (!patchResponse.ok) {
        const errorText = await patchResponse.text();
        console.error('PATCH phone error:', errorText);
        throw new Error(`Patch phone failed: ${patchResponse.status} - ${errorText}`);
      }
      
      // Check if response has content before trying to parse JSON
      const responseText = await patchResponse.text();
      console.log('PATCH phone response text:', responseText);
      
      if (responseText && responseText.trim()) {
        try {
          const result = JSON.parse(responseText);
          res.json(result);
        } catch (parseError) {
          console.log('Failed to parse response as JSON, returning success');
          res.json({ success: true, message: 'Phone updated successfully' });
        }
      } else {
        // Empty response is OK for PATCH requests
        console.log('Empty response from PATCH, returning success');
        res.json({ success: true, message: 'Phone updated successfully' });
      }
      
    } else if (action === 'patch-email' && endpoint) {
      // Update email address (handle PATCH)
      const requestMethod = req.query.method || req.method;
      console.log('PATCH email - Request Method:', requestMethod);
      console.log('PATCH email - Body:', req.body);
      
      const patchData = req.body;
      const patchUrl = `https://api.sky.blackbaud.com${endpoint}`;
      console.log('Patching email:', patchUrl);
      console.log('Patch data to send:', JSON.stringify(patchData));
      
      const patchResponse = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patchData)
      });
      
      if (!patchResponse.ok) {
        const errorText = await patchResponse.text();
        console.error('PATCH email error:', errorText);
        throw new Error(`Patch email failed: ${patchResponse.status} - ${errorText}`);
      }
      
      // Check if response has content before trying to parse JSON
      const responseText = await patchResponse.text();
      console.log('PATCH email response text:', responseText);
      
      if (responseText && responseText.trim()) {
        try {
          const result = JSON.parse(responseText);
          res.json(result);
        } catch (parseError) {
          console.log('Failed to parse response as JSON, returning success');
          res.json({ success: true, message: 'Email updated successfully' });
        }
      } else {
        // Empty response is OK for PATCH requests
        console.log('Empty response from PATCH, returning success');
        res.json({ success: true, message: 'Email updated successfully' });
      }
      
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