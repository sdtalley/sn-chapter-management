// Utility functions for SN Chapter Management
const Utils = (function() {
    'use strict';
    
    // Show/Hide Elements
    function showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) element.style.display = 'block';
    }
    
    function hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) element.style.display = 'none';
    }
    
    function showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) element.style.display = 'block';
    }
    
    // Status Messages
    function showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `status ${type}`;
            statusDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }
    
    // Date Formatting
    function formatDateForDisplay(dateString) {
        if (!dateString) return 'N/A';
        
        // Handle various date formats
        if (dateString.includes('-')) {
            // For YYYY-MM-DD format, parse the components directly to avoid timezone issues
            const [year, month, day] = dateString.split('-');
            return `${month}/${day}/${year}`;
        }
        
        // For other formats, try to parse
        const date = parseDate(dateString);
        if (date && !isNaN(date)) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        }
        
        return dateString; // Return as-is if parsing fails
    }
    
    function parseDate(dateString) {
        if (!dateString) return null;
        
        // Try parsing various formats
        // Format: MM/DD/YYYY
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                return new Date(parts[2], parts[0] - 1, parts[1]);
            }
        }
        
        // Format: YYYY-MM-DD
        if (dateString.includes('-')) {
            return new Date(dateString);
        }
        
        // Try default parsing
        return new Date(dateString);
    }
    
    function getDateFromFormattedText(formattedDate) {
        // Convert mm/dd/yyyy back to yyyy-mm-dd
        const parts = formattedDate.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
        return '';
    }
    
    function getApprovalValueFromText(text) {
        if (text === 'Approve') return 'Candidate';
        if (text === 'Disapprove') return 'Disapproved';
        if (text === 'Person Unknown') return 'Unknown';
        return '';
    }
    
    // IFrame Communication
    function resizeIframe() {
        // Wait for DOM to settle, then force recalculation
        setTimeout(() => {
            // Force the body to shrink to its content
            document.body.style.height = 'auto';
            
            // Force a reflow
            document.body.offsetHeight;
            
            // Get the actual content height
            const container = document.querySelector('.container');
            const containerHeight = container ? container.offsetHeight : 0;
            const bodyPadding = 40; // 20px top + 20px bottom
            const bufferHeight = 20; //adjust as needed
            const totalHeight = containerHeight + bodyPadding + bufferHeight;
            
            // Send height to parent window
            if (window.parent) {
                window.parent.postMessage({
                    type: 'resize',
                    height: totalHeight
                }, '*');
            }
        }, 150);
    }

    // Open Plaid via parent page message
    function openPlaid() {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ 
                type: 'open_plaid',
                source: 'sn_chapter_management' 
            }, '*');
        } else {
            showStatus('This function requires the application to be embedded in the parent page.', 'error');
        }
    }
    
    // Error Display Helpers
    function showError(elementId, message) {
        // Hide loading states
        hideElement('candidates-loading');
        hideElement('candidates-content');
        hideElement('initiates-loading');
        hideElement('initiates-content');
        hideElement('roster-loading');
        hideElement('roster-content');
        hideElement('officer-loading');
        hideElement('officer-content');
        hideElement('contact-loading');
        hideElement('contact-content');
        hideElement('fee-loading');
        hideElement('fee-content');
        
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            const errorText = errorElement.querySelector('p');
            if (errorText) errorText.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function showRosterError(message) {
        hideElement('roster-loading');
        hideElement('roster-content');
        const errorElement = document.getElementById('roster-error');
        if (errorElement) {
            const errorText = errorElement.querySelector('p');
            if (errorText) errorText.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function showOfficerError(message) {
        hideElement('officer-loading');
        hideElement('officer-content');
        const errorElement = document.getElementById('officer-error');
        if (errorElement) {
            const errorText = errorElement.querySelector('p');
            if (errorText) errorText.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function showContactError(message) {
        hideElement('contact-loading');
        hideElement('contact-content');
        const errorElement = document.getElementById('contact-error');
        if (errorElement) {
            const errorText = errorElement.querySelector('p');
            if (errorText) errorText.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function showFeeError(message) {
        hideElement('fee-loading');
        hideElement('fee-content');
        const errorElement = document.getElementById('fee-error');
        if (errorElement) {
            const errorText = errorElement.querySelector('p');
            if (errorText) errorText.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function showReturningError(message) {
        hideElement('returning-loading');
        hideElement('returning-content');
        const errorElement = document.getElementById('returning-error');
        if (errorElement) {
            const errorText = errorElement.querySelector('p');
            if (errorText) errorText.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    // Compare dates helper
    function compareFromDates(date1, date2) {
        const d1 = parseDate(date1);
        const d2 = parseDate(date2);
        if (!d1) return -1;
        if (!d2) return 1;
        return d1.getTime() - d2.getTime();
    }
    
    // Public API
    return {
        showElement,
        hideElement,
        showLoading,
        showStatus,
        formatDateForDisplay,
        parseDate,
        getDateFromFormattedText,
        getApprovalValueFromText,
        resizeIframe,
        openPlaid,
        showError,
        showRosterError,
        showOfficerError,
        showContactError,
        showFeeError,
        showReturningError,
        compareFromDates
    };
})();

// Make it available globally
window.Utils = Utils;