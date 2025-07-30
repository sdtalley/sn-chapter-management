// Main initialization and navigation module for SN Chapter Management
const Main = (function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        tokenEndpoint: 'https://oauth2.sky.blackbaud.com/token',
        apiBaseUrl: 'https://api.sky.blackbaud.com',
        tokenRefreshBuffer: 300000 // 5 minutes in milliseconds
    };
    
    // Make CONFIG available globally
    window.CONFIG = CONFIG;
    
    // Application state
    const appState = {
        accessToken: null,
        tokenType: 'Bearer',
        expiresAt: null,
        refreshTimer: null,
        sid: null,
        chapter: null,
        sts: null,
        offname: null,
        clientId: null,
        clientSecret: null,
        subscriptionKey: null,
        currentPage: 'main-menu',
        lastApiCall: null,
        chapterData: null,
        allowedSkips: {}
    };
    
    // Make appState available globally
    window.appState = appState;
    
    // Initialize the application
    async function init() {
        console.log('=== Application Initialization Started ===');
        
        // Parse URL parameters
        parseURLParameters();
        
        // Load stored credentials
        loadStoredCredentials();
        
        // Apply security based on sts parameter
        applySecurityLevel();
        
        // Initialize navigation (make functions available globally)
        initializeNavigation();
        
        // Set up authentication if we have credentials
        if (appState.clientId && appState.clientSecret) {
            try {
                await window.API.authenticate();
            } catch (error) {
                console.error('Initial authentication failed:', error);
            }
        }
        
        // Cache chapter data if chapter is available
        if (appState.chapter && appState.chapter !== 'Not provided') {
            try {
                console.log('Loading chapter data for:', appState.chapter);
                const chapterData = await window.API.getChapterData(appState.chapter);
                if (chapterData) {
                    appState.chapterData = chapterData;
                    console.log('Chapter data cached:', chapterData);
                } else {
                    console.warn('No chapter data found for:', appState.chapter);
                }
            } catch (error) {
                console.error('Failed to cache chapter data:', error);
            }
        }
        
        // Check token status periodically
        checkTokenStatus();
        
        console.log('=== Application Initialization Complete ===');
    }
    
    function initializeNavigation() {
        // Expose showPage globally for navigation
        window.showPage = function(pageId) {
            console.log('=== Navigation: ' + pageId + ' ===');
            
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.style.display = 'none';
            });
            
            // Hide main menu
            document.getElementById('main-menu').style.display = 'none';
            
            // Show selected page
            const selectedPage = document.getElementById(pageId);
            if (selectedPage) {
                selectedPage.style.display = 'block';
                appState.currentPage = pageId;
                
                // Auto-load data for specific pages
                switch(pageId) {
                    case 'verify-candidates':
                        window.CandidatesModule.loadCandidates();
                        break;
                    case 'verify-initiates':
                        window.InitiatesModule.loadInitiates();
                        break;
                    case 'roster-info':
                        window.RosterModule.loadRoster();
                        break;
                    case 'officer-info':
                        window.OfficersModule.loadOfficers();
                        break;
                    case 'contact-info':
                        window.ContactModule.loadChapterContact();
                        break;
                    case 'fee-status':
                        window.FeesModule.loadFeeStatus();
                        break;
                    case 'returning-students':
                        window.ReturningModule.loadReturningStudents();
                        break;
                    case 'admin':
                        window.API.loadAllowSkipsConfig();
                        break;
                }
            }
            
            // Adjust iframe height if embedded
            window.Utils.resizeIframe();
        };
        
        // Expose backToMenu globally
        window.backToMenu = function() {
            console.log('=== Returning to Main Menu ===');
            
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.style.display = 'none';
            });
            
            // Show main menu
            document.getElementById('main-menu').style.display = 'block';
            appState.currentPage = 'main-menu';
            
            // Clear any status messages
            const statusElements = document.querySelectorAll('.status');
            statusElements.forEach(element => {
                element.style.display = 'none';
            });
            
            // Adjust iframe height
            window.Utils.resizeIframe();
        };
        
        // Expose showMainMenu globally (alias for backToMenu)
        window.showMainMenu = window.backToMenu;
    }
    
    function applySecurityLevel() {
        console.log('=== Applying Security Level ===');
        console.log('STS Value:', appState.sts);
        
        const mainMenu = document.getElementById('main-menu');
        const unauthorized = document.getElementById('unauthorized');
        
        if (!appState.sts || !['0', '1', '2'].includes(appState.sts)) {
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
        
        // Hide all navigation items first
        const navItems = {
            'btn-member-directory': false,
            'btn-verify-candidates': false,
            'btn-verify-initiates': false,
            'btn-roster-info': false,
            'btn-returning-students': false,
            'btn-officer-info': false,
            'btn-contact-info': false,
            'btn-fee-status': false,
            'btn-admin': false
        };
        
        // Show navigation items based on sts value
        switch(appState.sts) {
            case '0': // Show all items including Admin
                Object.keys(navItems).forEach(btn => navItems[btn] = true);
                break;
            case '1': // Show all items except Admin
                Object.keys(navItems).forEach(btn => {
                    navItems[btn] = btn !== 'btn-admin';
                });
                break;
            case '2': // Show only Fee Status, Member Directory, and Roster (view-only)
                navItems['btn-fee-status'] = true;
                navItems['btn-member-directory'] = true;
                navItems['btn-roster-info'] = true;  // Added roster access for STS 2
                break;
        }
        
        // Apply visibility to navigation items
        Object.keys(navItems).forEach(btnId => {
            const button = document.getElementById(btnId);
            if (button && button.parentElement && button.parentElement.classList.contains('nav-item')) {
                // Hide/show the entire nav-item div
                button.parentElement.style.display = navItems[btnId] ? 'flex' : 'none';
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