// Chapter Contact Information Module for SN Chapter Management
const ContactModule = (function() {
    'use strict';
    
    // Reference to global state and utilities
    const appState = window.appState;
    const Utils = window.Utils;
    const API = window.API;
    const Queries = window.Queries;
    
    // Load contact information data
    async function loadContactInfo() {
        console.log('=== loadContactInfo() started ===');
        console.log('Chapter:', appState.chapter);
        
        if (!appState.chapter) {
            Utils.showContactError('No chapter specified. Please access this page with a chapter parameter.');
            console.error('No chapter parameter found');
            return;
        }

        // Show loading state
        console.log('Showing loading state...');
        Utils.showLoading('contact-loading');
        Utils.hideElement('contact-content');
        Utils.hideElement('contact-error');

        try {
            // Build and execute query (doesn't need QUID, just chapter name)
            const queryRequest = Queries.buildChapterContactQuery(appState.chapter);
            const resultsData = await API.executeQuery(queryRequest, 'chapter_contact');
            
            // Process results
            const contactInfo = processContactResults(resultsData);
            console.log('Processed contact info:', contactInfo);
            
            // Display contact info
            displayContactInfo(contactInfo);
            
        } catch (error) {
            console.error('Error loading contact info:', error);
            Utils.showContactError(`Failed to load contact information: ${error.message}`);
        }
    }

    function processContactResults(results) {
        console.log('=== processContactResults() started ===');
        console.log('Raw results:', results);
        
        let contactInfo = {
            id: '',
            name: '',
            postalAddress1: '',
            postalAddress2: '',
            postalCity: '',
            postalState: '',
            postalZip: '',
            postalImpId: '',
            shippingAddress1: '',
            shippingAddress2: '',
            shippingCity: '',
            shippingState: '',
            shippingZip: '',
            shippingImpId: '',
            phone: '',
            email: ''
        };
        
        if (Array.isArray(results) && results.length > 0) {
            const row = results[0]; // Should only be one result
            console.log('Contact data:', row);
            
            contactInfo = {
                id: row.ID || '',
                name: row.Name || '',
                postalAddress1: row.Postal_Address_Line_1 || '',
                postalAddress2: row.Postal_Address_Line_2 || '',
                postalCity: row.Postal_City || '',
                postalState: row.Postal_State || '',
                postalZip: row.Postal_ZIP || '',
                postalImpId: row.Postal_ImpID || '',
                shippingAddress1: row.Shipping_Address_Line_1 || '',
                shippingAddress2: row.Shipping_Address_Line_2 || '',
                shippingCity: row.Shipping_City || '',
                shippingState: row.Shipping_State || '',
                shippingZip: row.Shipping_ZIP || '',
                shippingImpId: row.Shipping_ImpID || '',
                phone: row.Phone || '',
                email: row.Email || ''
            };
        } else {
            console.warn('No contact information found');
        }

        console.log('Processed contact info:', contactInfo);
        return contactInfo;
    }

    function displayContactInfo(contactInfo) {
        console.log('=== displayContactInfo() started ===');
        console.log('Contact info to display:', contactInfo);
        
        const chapterSpan = document.getElementById('contact-chapter');
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        
        // Store IDs for later use
        appState.contactId = contactInfo.id;
        appState.postalImpId = contactInfo.postalImpId;
        appState.shippingImpId = contactInfo.shippingImpId;
        
        // Populate form fields
        document.getElementById('postal-address-1').value = contactInfo.postalAddress1;
        document.getElementById('postal-address-2').value = contactInfo.postalAddress2;
        document.getElementById('postal-city').value = contactInfo.postalCity;
        document.getElementById('postal-state').value = contactInfo.postalState;
        document.getElementById('postal-zip').value = contactInfo.postalZip;
        
        document.getElementById('shipping-address-1').value = contactInfo.shippingAddress1;
        document.getElementById('shipping-address-2').value = contactInfo.shippingAddress2;
        document.getElementById('shipping-city').value = contactInfo.shippingCity;
        document.getElementById('shipping-state').value = contactInfo.shippingState;
        document.getElementById('shipping-zip').value = contactInfo.shippingZip;
        
        const phoneInput = document.getElementById('chapter-phone');
        const emailInput = document.getElementById('chapter-email');
        
        phoneInput.value = contactInfo.phone;
        emailInput.value = contactInfo.email;
        
        // Add phone formatting on input
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            let formattedValue = '';
            
            if (value.length > 0) {
                if (value.length <= 3) {
                    formattedValue = `(${value}`;
                } else if (value.length <= 6) {
                    formattedValue = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                } else {
                    formattedValue = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                }
            }
            
            e.target.value = formattedValue;
        });
        
        // Add email validation
        emailInput.addEventListener('blur', function(e) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (e.target.value && !emailRegex.test(e.target.value)) {
                e.target.setCustomValidity('Please enter a valid email address');
                e.target.reportValidity();
            } else {
                e.target.setCustomValidity('');
            }
        });
        
        // Show content
        console.log('Hiding loading state and showing content...');
        Utils.hideElement('contact-loading');
        Utils.showElement('contact-content');
        
        // Trigger resize
        Utils.resizeIframe();
        console.log('=== displayContactInfo() completed ===');
    }

    function submitContactChanges() {
        // Validate email
        const emailInput = document.getElementById('chapter-email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailInput.value && !emailRegex.test(emailInput.value)) {
            Utils.showStatus('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }
        
        // Validate phone format
        const phoneInput = document.getElementById('chapter-phone');
        const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
        if (phoneInput.value && !phoneRegex.test(phoneInput.value)) {
            Utils.showStatus('Please enter phone in format: (123) 456-7890', 'error');
            phoneInput.focus();
            return;
        }
        
        // Collect all contact data
        const contactData = {
            id: appState.contactId,
            postalAddress: {
                impId: appState.postalImpId,
                address1: document.getElementById('postal-address-1').value,
                address2: document.getElementById('postal-address-2').value,
                city: document.getElementById('postal-city').value,
                state: document.getElementById('postal-state').value,
                zip: document.getElementById('postal-zip').value
            },
            shippingAddress: {
                impId: appState.shippingImpId,
                address1: document.getElementById('shipping-address-1').value,
                address2: document.getElementById('shipping-address-2').value,
                city: document.getElementById('shipping-city').value,
                state: document.getElementById('shipping-state').value,
                zip: document.getElementById('shipping-zip').value
            },
            phone: document.getElementById('chapter-phone').value,
            email: document.getElementById('chapter-email').value
        };
        
        // For now, just show what would be submitted
        console.log('Contact information to submit:', contactData);
        Utils.showStatus('Ready to submit contact information updates. (Submit functionality coming soon)', 'info');
    }
    
    async function getContactInfo() {
        // This would need to be customized based on your specific API structure
        let endpoint = '/constituents';
        
        if (appState.chapter) {
            endpoint += `?chapter=${appState.chapter}&contact_info=true`;
        }
        
        await API.makeApiCall(endpoint, 'contactResult');
    }
    
    // Public API
    return {
        loadContactInfo,
        processContactResults,
        displayContactInfo,
        submitContactChanges,
        getContactInfo
    };
})();

// Make it available globally
window.ContactModule = ContactModule;

// Also expose individual functions for backward compatibility
window.loadContactInfo = ContactModule.loadContactInfo;
window.submitContactChanges = ContactModule.submitContactChanges;
window.getContactInfo = ContactModule.getContactInfo;