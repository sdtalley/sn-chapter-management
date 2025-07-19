// Import chapter lookup data at the very top of the file
const { chapterLookup, getChapterData } = require('./chapter-records');

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
    
    if (action === 'auth') {
      // Get access token
      const tokenResponse = await fetch('https://oauth2.sky.blackbaud.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.BLACKBAUD_CLIENT_ID}:${process.env.BLACKBAUD_CLIENT_SECRET}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      });
      
      if (!tokenResponse.ok) {
        throw new Error(`Authentication failed: ${tokenResponse.status}`);
      }
      
      const tokenData = await tokenResponse.json();
      res.json(tokenData);
      
    } else if (action === 'query-execute') {
      // Execute ad-hoc query
      const { token } = req.query;
      const queryRequest = req.body;
      
      const queryResponse = await fetch('https://api.sky.blackbaud.com/query/v1/query-results', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryRequest)
      });
      
      if (!queryResponse.ok) {
        const errorText = await queryResponse.text();
        throw new Error(`Query execution failed: ${queryResponse.status} - ${errorText}`);
      }
      
      const queryData = await queryResponse.json();
      res.json(queryData);
      
    } else if (action === 'query-status' && jobId) {
      // Check query job status
      const { token } = req.query;
      
      const statusResponse = await fetch(`https://api.sky.blackbaud.com/query/v1/query-results/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Bb-Api-Subscription-Key': process.env.BLACKBAUD_SUBSCRIPTION_KEY
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Query status check failed: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      res.json(statusData);
      
    } else if (action === 'api' && endpoint) {
      // Make API call
      const { token } = req.query;
      
      const apiResponse = await fetch(`https://api.sky.blackbaud.com${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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