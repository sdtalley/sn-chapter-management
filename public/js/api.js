// API Communication Layer for SN Chapter Management
const API = (function() {
    'use strict';
    
    // Reference to global state
    const appState = window.appState;
    const CONFIG = window.CONFIG;
    
    // Rate limiting configuration
    const rateLimiter = {
        queue: [],
        processing: false,
        lastCallTime: 0,
        callsInCurrentWindow: [],
        maxCallsPerSecond: 10,
        windowSize: 1000 // 1 second window
    };
    
    // Process the rate-limited queue
    async function processQueue() {
        if (rateLimiter.processing || rateLimiter.queue.length === 0) {
            return;
        }
        
        rateLimiter.processing = true;
        
        while (rateLimiter.queue.length > 0) {
            const now = Date.now();
            
            // Remove calls older than 1 second from the window
            rateLimiter.callsInCurrentWindow = rateLimiter.callsInCurrentWindow.filter(
                time => now - time < rateLimiter.windowSize
            );
            
            // Check if we can make another call
            if (rateLimiter.callsInCurrentWindow.length < rateLimiter.maxCallsPerSecond) {
                // Process the next request
                const { request, resolve, reject } = rateLimiter.queue.shift();
                
                // Record this call
                rateLimiter.callsInCurrentWindow.push(now);
                
                try {
                    const result = await request();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            } else {
                // Wait until we can make the next call
                const oldestCall = Math.min(...rateLimiter.callsInCurrentWindow);
                const waitTime = rateLimiter.windowSize - (now - oldestCall) + 1;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        rateLimiter.processing = false;
    }
    
    // Wrapper to add requests to the rate-limited queue
    function rateLimitedRequest(requestFunction) {
        return new Promise((resolve, reject) => {
            rateLimiter.queue.push({ request: requestFunction, resolve, reject });
            processQueue();
        });
    }
    
    // Token management functions
    async function authenticate() {
        Utils.showStatus('Authenticating with server...', 'info');
        
        try {
            const response = await fetch('/api/blackbaud?action=auth', {
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status}`);
            }
            
            const tokenData = await response.json();
            
            // Store token information
            appState.accessToken = tokenData.access_token;
            appState.tokenType = tokenData.token_type || 'Bearer';
            appState.expiresAt = new Date().getTime() + (tokenData.expires_in * 1000);
            
            // Schedule token refresh
            scheduleTokenRefresh(tokenData.expires_in);
            
            updateTokenInfo();
            Utils.showStatus('Authentication successful!', 'success');
            
        } catch (error) {
            console.error('Authentication error:', error);
            Utils.showStatus(`Authentication failed: ${error.message}`, 'error');
        }
    }
    
    function scheduleTokenRefresh(expiresInSeconds) {
        // Clear existing timer
        if (appState.refreshTimer) {
            clearTimeout(appState.refreshTimer);
        }
        
        // Schedule refresh 5 minutes before expiration
        const refreshTime = (expiresInSeconds * 1000) - CONFIG.tokenRefreshBuffer;
        
        appState.refreshTimer = setTimeout(() => {
            refreshToken();
        }, refreshTime);
    }
    
    async function refreshToken() {
        if (!appState.clientId || !appState.clientSecret) {
            Utils.showStatus('Missing credentials for token refresh', 'error');
            return;
        }
        
        try {
            const response = await fetch(CONFIG.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${btoa(appState.clientId + ':' + appState.clientSecret)}`
                },
                body: 'grant_type=client_credentials'
            });
            
            if (!response.ok) {
                throw new Error(`Token refresh failed: ${response.status}`);
            }
            
            const tokenData = await response.json();
            
            appState.accessToken = tokenData.access_token;
            appState.expiresAt = new Date().getTime() + (tokenData.expires_in * 1000);
            
            scheduleTokenRefresh(tokenData.expires_in);
            updateTokenInfo();
            
            console.log('Token refreshed successfully');
            
        } catch (error) {
            console.error('Token refresh error:', error);
            Utils.showStatus('Token refresh failed. Please re-authenticate.', 'error');
        }
    }
    
    function updateTokenInfo() {
        window.updateTokenInfo();
    }
    
    function isTokenValid() {
        return window.isTokenValid();
    }
    
    // Generic API call function (rate-limited)
    async function makeApiCall(endpoint, resultElementId) {
        if (!isTokenValid()) {
            Utils.showStatus('No valid token. Please authenticate first.', 'error');
            return;
        }
        
        const responseArea = document.getElementById(resultElementId);
        if (responseArea) {
            responseArea.style.display = 'block';
            responseArea.textContent = 'Making API call...';
        }
        
        try {
            // Add SID and Chapter to endpoint if available
            let fullEndpoint = endpoint;
            if (appState.sid && endpoint.includes('{sid}')) {
                fullEndpoint = fullEndpoint.replace('{sid}', appState.sid);
            }
            if (appState.chapter && endpoint.includes('{chapter}')) {
                fullEndpoint = fullEndpoint.replace('{chapter}', appState.chapter);
            }
            
            const data = await rateLimitedRequest(async () => {
                const response = await fetch(`/api/blackbaud?action=api&endpoint=${encodeURIComponent(fullEndpoint)}&token=${appState.accessToken}`, {
                    method: 'GET'
                });
                
                if (!response.ok) {
                    throw new Error(`API call failed: ${response.status}`);
                }
                
                return response.json();
            });
            
            if (responseArea) {
                responseArea.textContent = JSON.stringify(data, null, 2);
            }
            Utils.showStatus('API call successful!', 'success');
            
        } catch (error) {
            console.error('API call error:', error);
            if (responseArea) {
                responseArea.textContent = `Error: ${error.message}`;
            }
            Utils.showStatus(`API call failed: ${error.message}`, 'error');
        }
    }
    
    // Test API call function (rate-limited)
    async function testApiCall() {
        if (!isTokenValid()) {
            Utils.showStatus('No valid token. Please authenticate first.', 'error');
            return;
        }
        
        const endpoint = document.getElementById('customEndpoint').value || 
                       document.getElementById('apiEndpoint').value;
        
        const responseArea = document.getElementById('apiResponse');
        if (responseArea) {
            responseArea.style.display = 'block';
            responseArea.textContent = 'Making API call...';
        }
        
        try {
            // Add SID and Chapter to endpoint if available
            let fullEndpoint = endpoint;
            if (appState.sid && endpoint.includes('{sid}')) {
                fullEndpoint = fullEndpoint.replace('{sid}', appState.sid);
            }
            if (appState.chapter && endpoint.includes('{chapter}')) {
                fullEndpoint = fullEndpoint.replace('{chapter}', appState.chapter);
            }
            
            const data = await rateLimitedRequest(async () => {
                const response = await fetch(`/api/blackbaud?action=api&endpoint=${encodeURIComponent(fullEndpoint)}&token=${appState.accessToken}`, {
                    method: 'GET'
                });
                
                if (!response.ok) {
                    throw new Error(`API call failed: ${response.status}`);
                }
                
                return response.json();
            });
            
            if (responseArea) {
                responseArea.textContent = JSON.stringify(data, null, 2);
            }
            Utils.showStatus('Test API call successful!', 'success');
            
        } catch (error) {
            console.error('API call error:', error);
            if (responseArea) {
                responseArea.textContent = `Error: ${error.message}`;
            }
            Utils.showStatus(`Test API call failed: ${error.message}`, 'error');
        }
    }
    
    // Query execution functionality (rate-limited)
    async function executeQuery(queryRequest, resultsFileName = 'query_results') {
        console.log('=== executeQuery() started ===');
        console.log('Results file name:', resultsFileName);

        // Ensure proper structure for the query request
        const fullQueryRequest = {
            ...queryRequest,
            "ux_mode": "Synchronous",
            "output_format": "Json",
            "formatting_mode": "UI",
            "results_file_name": resultsFileName,
            "time_zone_offset_in_minutes": 120
        };

        console.log('Query request built:', JSON.stringify(fullQueryRequest, null, 2));

        // Step 1: Execute the query (rate-limited)
        console.log('Executing query via API...');
        const executeData = await rateLimitedRequest(async () => {
            const executeResponse = await fetch(`/api/blackbaud?action=query-execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fullQueryRequest)
            });

            console.log('Execute response status:', executeResponse.status);

            if (!executeResponse.ok) {
                const errorText = await executeResponse.text();
                console.error('Execute response error:', errorText);
                throw new Error(`Query execution failed: ${executeResponse.status} - ${errorText}`);
            }

            return executeResponse.json();
        });

        console.log('Execute response data:', executeData);
        
        // Get the job ID from the response
        const jobId = executeData.id;
        if (!jobId) {
            console.error('No job ID found in response:', executeData);
            throw new Error('No job ID returned from query execution');
        }

        console.log('Query job ID:', jobId);
        console.log('Initial status:', executeData.status);

        // Step 2: Poll for job completion (rate-limited)
        const statusData = await pollJobStatus(jobId);
        
        if (!statusData.sas_uri) {
            throw new Error('Query completed but no results URL provided');
        }

        // Step 3: Fetch the actual results (not rate-limited as it's not a Blackbaud API call)
        console.log('Fetching query results from URL...');
        console.log('SAS URI to fetch:', statusData.sas_uri);
        
        const resultsResponse = await fetch('/api/blackbaud?action=query-results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: statusData.sas_uri })
        });

        if (!resultsResponse.ok) {
            const errorText = await resultsResponse.text();
            console.error('Failed to fetch query results:', resultsResponse.status, errorText);
            throw new Error(`Failed to fetch query results: ${resultsResponse.status} - ${errorText}`);
        }

        const resultsData = await resultsResponse.json();
        console.log('Query results received:', resultsData);
        console.log('Row count:', resultsData.length);
        
        return resultsData;
    }
    
    async function pollJobStatus(jobId, maxAttempts = 60) {
        console.log('=== pollJobStatus() started ===');
        console.log('Job ID:', jobId);
        
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            console.log(`Polling attempt ${attempts + 1}/${maxAttempts}...`);
            
            const statusData = await rateLimitedRequest(async () => {
                const statusResponse = await fetch(`/api/blackbaud?action=query-status&jobId=${jobId}`, {
                    method: 'GET'
                });

                if (!statusResponse.ok) {
                    const errorText = await statusResponse.text();
                    console.error('Status check error:', errorText);
                    throw new Error(`Query status check failed: ${statusResponse.status}`);
                }

                return statusResponse.json();
            });

            console.log('Status data:', statusData);

            // Check for completion
            if (statusData.status === 'Completed') {
                console.log('Query completed successfully');
                console.log('Row count:', statusData.row_count);
                return statusData;
            } else if (statusData.status === 'Failed' || statusData.status === 'failed') {
                throw new Error('Query execution failed: ' + (statusData.message || statusData.error || 'Unknown error'));
            }

            // Wait 1 second before next attempt
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        throw new Error('Query execution timeout after ' + maxAttempts + ' seconds');
    }
    
    // Chapter data functions - OPTIMIZED to use cached data
    async function getChapterQuid(chapterName) {
        console.log('=== getChapterQuid() started ===');
        console.log('Looking up QUID for chapter:', chapterName);
        
        // First check if we have cached data
        if (appState.chapterData && appState.chapter === chapterName) {
            console.log('Using cached chapter data');
            return appState.chapterData.quid;
        }
        
        // If not cached, fetch from server (rate-limited)
        try {
            const data = await rateLimitedRequest(async () => {
                const response = await fetch(`/api/blackbaud?action=chapter-lookup&chapter=${encodeURIComponent(chapterName)}`, {
                    method: 'GET'
                });
                
                console.log('Chapter lookup response status:', response.status);
                
                if (!response.ok) {
                    throw new Error(`Chapter lookup failed: ${response.status}`);
                }
                
                return response.json();
            });
            
            console.log('Chapter data received:', data);
            
            // Cache the data if it's for the current chapter
            if (appState.chapter === chapterName) {
                appState.chapterData = data;
            }
            
            return data.quid;
        } catch (error) {
            console.error('Chapter lookup failed:', error);
            return null;
        }
    }
    
    async function getChapterData(chapterName) {
        console.log('=== getChapterData() started ===');
        console.log('Looking up data for chapter:', chapterName);
        
        // First check if we have cached data
        if (appState.chapterData && appState.chapter === chapterName) {
            console.log('Using cached chapter data');
            return appState.chapterData;
        }
        
        // If not cached, fetch from server (rate-limited)
        try {
            const data = await rateLimitedRequest(async () => {
                const response = await fetch(`/api/blackbaud?action=chapter-lookup&chapter=${encodeURIComponent(chapterName)}`, {
                    method: 'GET'
                });
                
                console.log('Chapter lookup response status:', response.status);
                
                if (!response.ok) {
                    throw new Error(`Chapter lookup failed: ${response.status}`);
                }
                
                return response.json();
            });
            
            console.log('Chapter data received:', data);
            
            // Cache the data if it's for the current chapter
            if (appState.chapter === chapterName) {
                appState.chapterData = data;
            }
            
            return data;
        } catch (error) {
            console.error('Chapter lookup failed:', error);
            return null;
        }
    }
    
    // Allow skips configuration functions (not rate-limited as they're internal)
    async function loadAllowSkipsConfig() {
        console.log('=== loadAllowSkipsConfig() started ===');
        
        // Check if we have a chapter
        if (!appState.chapter) {
            Utils.hideElement('allow-skips-loading');
            Utils.hideElement('allow-skips-content');
            Utils.hideElement('allow-skips-error');
            return;
        }
        
        // Show loading state
        Utils.showLoading('allow-skips-loading');
        Utils.hideElement('allow-skips-content');
        Utils.hideElement('allow-skips-error');
        
        try {
            // Get allowed skips data from server (not rate-limited - internal endpoint)
            const response = await fetch('/api/blackbaud?action=get-allowed-skips', {
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error('Failed to load configuration');
            }
            
            const allowedSkips = await response.json();
            appState.allowedSkips = allowedSkips;
            
            // Display the configuration for current chapter
            displayAllowSkipsConfig(allowedSkips);
            
        } catch (error) {
            console.error('Error loading allow skips config:', error);
            Utils.hideElement('allow-skips-loading');
            Utils.showElement('allow-skips-error');
        }
    }
    
    function displayAllowSkipsConfig(allowedSkips) {
        console.log('=== displayAllowSkipsConfig() started ===');
        
        const checkbox = document.getElementById('allow-skips-checkbox');
        const chapterNameSpan = document.getElementById('current-chapter-name');
        
        if (checkbox && appState.chapter) {
            // Update chapter name in label
            if (chapterNameSpan) {
                chapterNameSpan.textContent = appState.chapter;
            }
            
            // Set checkbox state
            checkbox.checked = allowedSkips[appState.chapter] === true;
            
            // Remove any existing event listeners
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);
            
            // Add event listener
            newCheckbox.addEventListener('change', function() {
                updateAllowSkips(appState.chapter, this.checked);
            });
        }
        
        // Show content
        Utils.hideElement('allow-skips-loading');
        Utils.showElement('allow-skips-content');
    }
    
    async function updateAllowSkips(chapter, allowSkips) {
        console.log(`Updating allow skips for ${chapter} to ${allowSkips}`);
        
        try {
            const response = await fetch('/api/blackbaud?action=set-allowed-skips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chapter, allowSkips })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update configuration');
            }
            
            // Update local state
            appState.allowedSkips[chapter] = allowSkips;
            
            Utils.showStatus(`Badge skip validation ${allowSkips ? 'disabled' : 'enabled'} for ${chapter}`, 'success');
            
        } catch (error) {
            console.error('Error updating allow skips:', error);
            Utils.showStatus('Failed to update configuration', 'error');
            // Revert checkbox
            const checkbox = document.getElementById('allow-skips-checkbox');
            if (checkbox) checkbox.checked = !allowSkips;
        }
    }
    
    async function checkAllowedSkips() {
        if (!appState.chapter) return false;
        
        try {
            const response = await fetch('/api/blackbaud?action=get-allowed-skips', {
                method: 'GET'
            });
            
            if (response.ok) {
                const allowedSkips = await response.json();
                appState.allowedSkips = allowedSkips;
                return allowedSkips[appState.chapter] === true;
            }
        } catch (error) {
            console.error('Error checking allowed skips:', error);
        }
        
        return false;
    }
    
    // Rate-limited API call wrapper (exposed for modules that make direct API calls)
    async function makeRateLimitedApiCall(endpoint, method = 'GET', body = null) {
        return rateLimitedRequest(async () => {
            const options = {
                method: method,
                headers: {}
            };
            
            if (body) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
            
            const response = await fetch(endpoint, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API call failed: ${response.status} - ${errorText}`);
            }
            
            return response.json();
        });
    }
    
    // Public API
    return {
        authenticate,
        scheduleTokenRefresh,
        refreshToken,
        updateTokenInfo,
        isTokenValid,
        makeApiCall,
        testApiCall,
        executeQuery,
        pollJobStatus,
        getChapterQuid,
        getChapterData,
        loadAllowSkipsConfig,
        displayAllowSkipsConfig,
        updateAllowSkips,
        checkAllowedSkips,
        makeRateLimitedApiCall
    };
})();

// Make it available globally
window.API = API;

// Also expose specific functions globally for backward compatibility
window.authenticate = API.authenticate;
window.makeApiCall = API.makeApiCall;
window.testApiCall = API.testApiCall;
window.executeQuery = API.executeQuery;
window.pollJobStatus = API.pollJobStatus;
window.getChapterQuid = API.getChapterQuid;
window.getChapterData = API.getChapterData;
window.loadAllowSkipsConfig = API.loadAllowSkipsConfig;
window.checkAllowedSkips = API.checkAllowedSkips;