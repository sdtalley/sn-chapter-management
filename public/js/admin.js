// Admin Module for SN Chapter Management
const AdminModule = (function() {
    'use strict';
    
    // Reference to global state and utilities
    const appState = window.appState;
    const Utils = window.Utils;
    const API = window.API;
    
    // Initialize admin page
    function initAdmin() {
        console.log('=== initAdmin() started ===');
        
        // Display chapter information
        displayChapterInfo();
        
        // Load allow skips configuration if chapter is available
        if (appState.chapter) {
            API.loadAllowSkipsConfig();
        }
    }
    
    // Display chapter information from URL parameters
    function displayChapterInfo() {
        console.log('=== displayChapterInfo() started ===');
        
        const sidElement = document.getElementById('sid');
        const chapterElement = document.getElementById('chapter');
        const offnameElement = document.getElementById('offname');
        
        if (sidElement) sidElement.textContent = appState.sid || 'Not provided';
        if (chapterElement) chapterElement.textContent = appState.chapter || 'Not provided';
        if (offnameElement) offnameElement.textContent = appState.offname || 'Not provided';
        
        console.log('Chapter info displayed:', {
            sid: appState.sid,
            chapter: appState.chapter,
            offname: appState.offname
        });
    }
    
    // Public API
    return {
        initAdmin,
        displayChapterInfo
    };
})();

// Make it available globally
window.AdminModule = AdminModule;

// Also expose individual functions for backward compatibility
window.initAdmin = AdminModule.initAdmin;
window.displayChapterInfo = AdminModule.displayChapterInfo;