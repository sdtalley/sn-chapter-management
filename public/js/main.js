// Main application initialization and state management
const Main = (function() {
    'use strict';
    
    // Application state
    window.appState = {
        accessToken: null,
        tokenType: 'Bearer',
        expiresAt: null,
        refreshTimer: null,
        clientId: null,
        clientSecret: null,
        subscriptionKey: null,
        sid: null,
        chapter: null,
        sts: null,
        offname: null,
        currentPage: 'main',
        lastBadgeNumber: null,
        allowedSkips: {} // Store allowed skips configuration
    };
    
    // Configuration
    window.CONFIG = {
        tokenEndpoint: 'https://oauth2.sky.blackbaud.com/token',
        apiBaseUrl: 'https://api.sky.blackbaud.com/',
        tokenRefreshBuffer: 300000 // 5 minutes in milliseconds
    };
    
    // Initialize application
    function init() {
        parseURLParameters();
        loadStoredCredentials();
        checkTokenStatus();
        
        // Initial iframe resize
        Utils.resizeIframe();
    }
    
    // Simple navigation functions
    window.showPage = function(pageId) {
        // Check authorization before showing any page
        if (!isAuthorized()) {
            return;
        }
        
        // Hide main menu
        document.getElementById('main-menu').style.display = 'none';
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show selected page
        document.getElementById(pageId).style.display = 'block';
        appState.currentPage = pageId;
        
        // Load page-specific data
        if (pageId === 'verify-candidates') {
            loadCandidates();
        } else if (pageId === 'verify-initiates') {
            loadInitiates();
        } else if (pageId === 'roster-info') {
            loadRoster();
        } else if (pageId === 'officer-info') {
            loadOfficers();
        } else if (pageId === 'contact-info') {
            loadContactInfo();
        } else if (pageId === 'fee-status') {
            loadFeeStatus();
        } else if (pageId === 'admin') {
            if (window.AdminModule) {
                window.AdminModule.initAdmin();
            }
        }
        
        // Notify parent of height change
        Utils.resizeIframe();
    };
    
    window.showMainMenu = function() {
        // Check authorization
        if (!isAuthorized()) {
            return;
        }
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show main menu
        document.getElementById('main-menu').style.display = 'block';
        appState.currentPage = 'main';
        
        // Notify parent of height change
        Utils.resizeIframe();
    };
    
    // Authorization check function
    function isAuthorized() {
        return appState.sts !== null && ['0', '1', '2'].includes(appState.sts);
    }
    
    // Apply security level based on sts parameter
    function applySecurityLevel() {
        const mainMenu = document.getElementById('main-menu');
        const unauthorized = document.getElementById('unauthorized');
        
        // If no sts parameter or invalid value, show unauthorized
        if (appState.sts === null || !['0', '1', '2'].includes(appState.sts)) {
            mainMenu.style.display = 'none';
            unauthorized.style.display = 'block';
            
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.style.display = 'none';
            });
            
            Utils.resizeIframe();
            return;
        }
        
        // Show main menu
        unauthorized.style.display = 'none';
        mainMenu.style.display = 'block';
        
        // Hide all buttons first
        const buttons = {
            'btn-verify-candidates': false,
            'btn-verify-initiates': false,
            'btn-roster-info': false,
            'btn-officer-info': false,
            'btn-contact-info': false,
            'btn-fee-status': false,
            'btn-admin': false
        };
        
        // Show buttons based on sts value
        switch(appState.sts) {
            case '0': // Show all buttons including Admin
                Object.keys(buttons).forEach(btn => buttons[btn] = true);
                break;
            case '1': // Show all buttons except Admin
                Object.keys(buttons).forEach(btn => {
                    buttons[btn] = btn !== 'btn-admin';
                });
                break;
            case '2': // Show only Fee Status (Treasurer) button
                buttons['btn-fee-status'] = true;
                break;
        }
        
        // Apply visibility
        Object.keys(buttons).forEach(btnId => {
            const button = document.getElementById(btnId);
            if (button) {
                button.style.display = buttons[btnId] ? 'block' : 'none';
            }
        });
        
        Utils.resizeIframe();
    }
    
    function parseURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const sid = urlParams.get('sid') || urlParams.get('SID') || 'Not provided';
        const chapter = urlParams.get('chapter') || urlParams.get('Chapter') || 'Not provided';
        const sts = urlParams.get('sts') || urlParams.get('STS');
        const offname = urlParams.get('offname') || urlParams.get('OFFNAME') || 'Not provided';
        
        // Store in application state
        appState.sid = sid !== 'Not provided' ? sid : null;
        appState.chapter = chapter !== 'Not provided' ? chapter : null;
        appState.sts = sts;
        appState.offname = offname !== 'Not provided' ? offname : null;
        
        const sidElement = document.getElementById('sid');
        const chapterElement = document.getElementById('chapter');
        const offnameElement = document.getElementById('offname');
        if (sidElement) sidElement.textContent = sid;
        if (chapterElement) chapterElement.textContent = chapter;
        if (offnameElement) offnameElement.textContent = offname;
        
        // Apply security based on sts parameter
        applySecurityLevel();
    }
    
    function loadStoredCredentials() {
        // In a real application, you'd load these from secure server-side storage
        // For demo purposes, we'll use the form inputs
    }
    
    function checkTokenStatus() {
        // Check token validity every minute
        setInterval(() => {
            updateTokenInfo();
        }, 60000);
    }
    
    window.updateTokenInfo = function() {
        const tokenInfo = document.getElementById('tokenInfo');
        const accessTokenSpan = document.getElementById('accessToken');
        const tokenTypeSpan = document.getElementById('tokenType');
        const expiresAtSpan = document.getElementById('expiresAt');
        const tokenStatusSpan = document.getElementById('tokenStatus');
        
        if (appState.accessToken && tokenInfo) {
            tokenInfo.style.display = 'block';
            if (accessTokenSpan) accessTokenSpan.textContent = appState.accessToken.substring(0, 20) + '...';
            if (tokenTypeSpan) tokenTypeSpan.textContent = appState.tokenType;
            if (expiresAtSpan) expiresAtSpan.textContent = appState.expiresAt ? new Date(appState.expiresAt).toLocaleString() : 'Unknown';
            if (tokenStatusSpan) tokenStatusSpan.textContent = isTokenValid() ? 'Active' : 'Expired';
        } else if (tokenInfo) {
            tokenInfo.style.display = 'none';
        }
    };
    
    window.isTokenValid = function() {
        console.log('Checking token validity...');
        console.log('Access Token exists:', !!appState.accessToken);
        console.log('Expires At:', appState.expiresAt);
        console.log('Current Time:', new Date().getTime());
        console.log('Time until expiration:', appState.expiresAt ? (appState.expiresAt - new Date().getTime()) / 1000 + ' seconds' : 'N/A');
        
        const valid = appState.accessToken && appState.expiresAt && new Date().getTime() < appState.expiresAt;
        console.log('Token is valid:', valid);
        return valid;
    };
    
    // Public API
    return {
        init
    };
})();

// Make it available globally
window.Main = Main;