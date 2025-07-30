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
        allowedSkips: {}, // Store allowed skips configuration
        chapterData: null, // Cache chapter data
        hasUnsavedChanges: false,
        originalChapter: null // Store the original chapter from URL
    };
    
    // Configuration
    window.CONFIG = {
        tokenEndpoint: 'https://oauth2.sky.blackbaud.com/token',
        apiBaseUrl: 'https://api.sky.blackbaud.com/',
        tokenRefreshBuffer: 300000 // 5 minutes in milliseconds
    };
    
    // Initialize application
    async function init() {
        parseURLParameters();
        
        // Store original chapter
        appState.originalChapter = appState.chapter;
        
        loadStoredCredentials();
        checkTokenStatus();
        
        // Initialize chapter dropdown if needed (for STS 0, 3, 4)
        initializeChapterDropdown();
        
        // Cache chapter data if chapter is available and not STS 0, 3, or 4
        if (appState.chapter && appState.chapter !== 'Not provided' && 
            !['0', '3', '4'].includes(appState.sts)) {
            try {
                const chapterData = await API.getChapterData(appState.chapter);
                if (chapterData) {
                    appState.chapterData = chapterData;
                    console.log('Chapter data cached:', chapterData);
                }
            } catch (error) {
                console.error('Failed to cache chapter data:', error);
            }
        }
        
        // Initial iframe resize
        Utils.resizeIframe();
    }
    
    function initializeChapterDropdown() {
        // Only initialize for STS 0, 3, or 4
        if (!['0', '3', '4'].includes(appState.sts)) {
            return;
        }
        
        // Create chapter selection section if it doesn't exist
        let chapterSelectSection = document.getElementById('chapter-select-section');
        if (!chapterSelectSection) {
            const mainMenu = document.getElementById('main-menu');
            const h2 = mainMenu.querySelector('h2');
            
            chapterSelectSection = document.createElement('div');
            chapterSelectSection.id = 'chapter-select-section';
            chapterSelectSection.className = 'chapter-select-section';
            chapterSelectSection.innerHTML = `
                <div class="form-group">
                    <label for="chapter-select">Select Chapter:</label>
                    <select id="chapter-select" class="chapter-select">
                        <option value="">Select Chapter</option>
                    </select>
                </div>
            `;
            
            // Insert after the h2
            h2.insertAdjacentElement('afterend', chapterSelectSection);
        }
        
        // Populate the dropdown
        populateChapterDropdown();
        
        // Add change event listener
        const chapterSelect = document.getElementById('chapter-select');
        chapterSelect.addEventListener('change', handleChapterChange);
        
        // Hide navigation buttons initially
        hideNavigationButtons();
    }
    
    async function populateChapterDropdown() {
        const chapterSelect = document.getElementById('chapter-select');
        if (!chapterSelect) return;
    
        try {
            // Fetch chapter names from API
            const response = await fetch('/api/blackbaud?action=get-chapters');
            const chapters = await response.json();
        
            chapters.forEach(chapterName => {
                const option = document.createElement('option');
                option.value = chapterName;
                option.textContent = chapterName;
                chapterSelect.appendChild(option);
            });
        
            // Set current chapter if available
            if (appState.chapter && appState.chapter !== 'Not provided') {
                chapterSelect.value = appState.chapter;
                showNavigationButtons();
            }
        } catch (error) {
            console.error('Failed to load chapters:', error);
        }
    }
    
    async function handleChapterChange(event) {
        const newChapter = event.target.value;
        
        // If no chapter selected, hide navigation
        if (!newChapter) {
            hideNavigationButtons();
            return;
        }
        
        // Check for unsaved changes
        if (appState.hasUnsavedChanges) {
            const confirmChange = confirm('You have unsaved changes. Are you sure you want to switch chapters? All unsaved work will be lost.');
            if (!confirmChange) {
                // Revert the dropdown to the current chapter
                event.target.value = appState.chapter || '';
                return;
            }
        }
        
        // Clear any in-progress work
        clearInProgressWork();
        
        // Reset to main menu
        showMainMenu();
        
        // Update chapter
        appState.chapter = newChapter;
        
        // Clear cached chapter data
        appState.chapterData = null;
        
        // Load new chapter data
        try {
            console.log('Loading chapter data for:', newChapter);
            const chapterData = await API.getChapterData(newChapter);
            if (chapterData) {
                appState.chapterData = chapterData;
                console.log('Chapter data cached:', chapterData);
            }
        } catch (error) {
            console.error('Failed to load chapter data:', error);
        }
        
        // Show navigation buttons
        showNavigationButtons();
        
        // Reset iframe height
        Utils.resizeIframe();
    }
    
    function clearInProgressWork() {
        // Clear any pending data
        delete appState.pendingCandidates;
        delete appState.pendingInitiates;
        delete appState.pendingRosterMembers;
        delete appState.pendingReturningStudents;
        
        // Clear any form data
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
        
        // Clear any dynamic content
        const tbodies = document.querySelectorAll('tbody');
        tbodies.forEach(tbody => tbody.innerHTML = '');
        
        // Reset unsaved changes flag
        appState.hasUnsavedChanges = false;
    }
    
    function hideNavigationButtons() {
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons) {
            navButtons.style.display = 'none';
        }
    }
    
    function showNavigationButtons() {
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons) {
            navButtons.style.display = 'flex';
        }
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
            window.CandidatesModule.loadCandidates();
        } else if (pageId === 'verify-initiates') {
            window.InitiatesModule.loadInitiates();
        } else if (pageId === 'roster-info') {
            window.RosterModule.loadRoster();
        } else if (pageId === 'returning-students') {
            window.ReturningModule.loadReturningStudents();
        } else if (pageId === 'officer-info') {
            window.OfficersModule.loadOfficers();
        } else if (pageId === 'contact-info') {
            window.ContactModule.loadContactInfo();
        } else if (pageId === 'fee-status') {
            window.FeesModule.loadFeeStatus();
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
        return appState.sts !== null && ['0', '1', '2', '3', '4'].includes(appState.sts);
    }
    
    // Apply security level based on sts parameter
    function applySecurityLevel() {
        const mainMenu = document.getElementById('main-menu');
        const unauthorized = document.getElementById('unauthorized');
        
        // If no sts parameter or invalid value, show unauthorized
        if (appState.sts === null || !['0', '1', '2', '3', '4'].includes(appState.sts)) {
            mainMenu.style.display = 'none';
            unauthorized.style.display = 'block';
            
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.style.display = 'none';
            });
            
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
            case '3': // STS 3 same as STS 1
                Object.keys(navItems).forEach(btn => {
                    navItems[btn] = btn !== 'btn-admin';
                });
                break;
            case '2': // Show only Fee Status, Member Directory, and Roster (view-only)
            case '4': // STS 4 same as STS 2
                navItems['btn-fee-status'] = true;
                navItems['btn-member-directory'] = true;
                navItems['btn-roster-info'] = true;
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
    }
    
    // Parse URL parameters
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
    
    // Load stored credentials (placeholder)
    function loadStoredCredentials() {
        // In a real application, you'd load these from secure server-side storage
        // For demo purposes, we'll use the form inputs
    }
    
    // Check token status periodically
    function checkTokenStatus() {
        // Check token validity every minute
        setInterval(() => {
            updateTokenInfo();
        }, 60000);
    }
    
    // Update token information display
    function updateTokenInfo() {
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
    }
    
    // Check if token is valid
    function isTokenValid() {
        return appState.accessToken && appState.expiresAt && new Date().getTime() < appState.expiresAt;
    }
    
    // Track unsaved changes
    window.setUnsavedChanges = function(hasChanges) {
        appState.hasUnsavedChanges = hasChanges;
    };
    
    // Public API
    return {
        init
    };
})();

// Make it available globally
window.Main = Main;