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
        
        // Truncate ImpIDs to last 7 digits
        appState.postalImpId = truncateImpId(contactInfo.postalImpId);
        appState.shippingImpId = truncateImpId(contactInfo.shippingImpId);
        
        console.log('Truncated Postal ImpId:', appState.postalImpId);
        console.log('Truncated Shipping ImpId:', appState.shippingImpId);
        
        // Store original values for comparison
        appState.originalContactInfo = {
            postalAddress1: contactInfo.postalAddress1,
            postalAddress2: contactInfo.postalAddress2,
            postalCity: contactInfo.postalCity,
            postalState: contactInfo.postalState,
            postalZip: contactInfo.postalZip,
            shippingAddress1: contactInfo.shippingAddress1,
            shippingAddress2: contactInfo.shippingAddress2,
            shippingCity: contactInfo.shippingCity,
            shippingState: contactInfo.shippingState,
            shippingZip: contactInfo.shippingZip,
            phone: contactInfo.phone,
            email: contactInfo.email
        };
        
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
        
        // Add event listener for "Same as Postal Address" checkbox
        const sameAddressCheckbox = document.getElementById('same-as-postal');
        if (sameAddressCheckbox) {
            sameAddressCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    copyPostalToShipping();
                }
            });
        }
        
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
    
    function truncateImpId(impId) {
        if (!impId) return '';
        
        // If the ImpId contains "00001-516-000", remove it and take last 7 digits
        let truncated = impId;
        if (impId.includes('00001-516-000')) {
            truncated = impId.replace('00001-516-000', '');
        }
        
        // Ensure we get the last 7 digits
        if (truncated.length > 7) {
            truncated = truncated.slice(-7);
        }
        
        return truncated;
    }
    
    function copyPostalToShipping() {
        document.getElementById('shipping-address-1').value = document.getElementById('postal-address-1').value;
        document.getElementById('shipping-address-2').value = document.getElementById('postal-address-2').value;
        document.getElementById('shipping-city').value = document.getElementById('postal-city').value;
        document.getElementById('shipping-state').value = document.getElementById('postal-state').value;
        document.getElementById('shipping-zip').value = document.getElementById('postal-zip').value;
    }

    async function submitContactChanges() {
        // Validate required fields
        const requiredFields = [
            { id: 'postal-address-1', name: 'Postal Address Line 1' },
            { id: 'postal-city', name: 'Postal City' },
            { id: 'postal-state', name: 'Postal State' },
            { id: 'postal-zip', name: 'Postal Zip' },
            { id: 'shipping-address-1', name: 'Shipping Address Line 1' },
            { id: 'shipping-city', name: 'Shipping City' },
            { id: 'shipping-state', name: 'Shipping State' },
            { id: 'shipping-zip', name: 'Shipping Zip' }
        ];
        
        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element.value.trim()) {
                Utils.showStatus(`${field.name} is required.`, 'error');
                element.focus();
                return;
            }
        }
        
        // Validate email if provided
        const emailInput = document.getElementById('chapter-email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailInput.value && !emailRegex.test(emailInput.value)) {
            Utils.showStatus('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }
        
        // Validate phone format if provided
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
        
        // Check what has changed
        const changes = [];
        
        if (hasAddressChanged(contactData.postalAddress, 'postal')) {
            changes.push({ type: 'postal_address', data: contactData.postalAddress });
        }
        
        if (hasAddressChanged(contactData.shippingAddress, 'shipping')) {
            changes.push({ type: 'shipping_address', data: contactData.shippingAddress });
        }
        
        if (contactData.phone !== appState.originalContactInfo.phone) {
            changes.push({ type: 'phone', data: contactData.phone });
        }
        
        if (contactData.email !== appState.originalContactInfo.email) {
            changes.push({ type: 'email', data: contactData.email });
        }
        
        if (changes.length === 0) {
            Utils.showStatus('No changes detected. Please modify at least one field before submitting.', 'error');
            return;
        }
        
        // Get the submit section and create spinner
        const submitSection = document.querySelector('#contact-content .submit-section');
        const originalContent = submitSection.innerHTML;
        
        // Replace submit section content with spinner
        submitSection.innerHTML = '<div class="spinner"></div>';
        
        // Process the submission
        processContactSubmission(contactData, changes, submitSection, originalContent);
    }
    
    function hasAddressChanged(address, type) {
        const original = appState.originalContactInfo;
        if (type === 'postal') {
            return address.address1 !== original.postalAddress1 ||
                   address.address2 !== original.postalAddress2 ||
                   address.city !== original.postalCity ||
                   address.state !== original.postalState ||
                   address.zip !== original.postalZip;
        } else {
            return address.address1 !== original.shippingAddress1 ||
                   address.address2 !== original.shippingAddress2 ||
                   address.city !== original.shippingCity ||
                   address.state !== original.shippingState ||
                   address.zip !== original.shippingZip;
        }
    }
    
    async function processContactSubmission(contactData, changes, submitSection, originalContent) {
        console.log('=== processContactSubmission() started ===');
        console.log('Processing', changes.length, 'changes');
        
        try {
            // Use cached chapter data
            const chapterData = appState.chapterData;
            if (!chapterData) {
                throw new Error('Chapter data not available');
            }
            
            let successCount = 0;
            let errorCount = 0;
            const errors = [];
            
            // Step 1: Get phone IDs if we need to update phone or email
            let phoneIds = {};
            if (changes.some(c => c.type === 'phone' || c.type === 'email')) {
                try {
                    const phonesResponse = await API.makeRateLimitedApiCall(
                        `/api/blackbaud?action=api&endpoint=/constituent/v1/constituents/${chapterData.csid}/phones&token=${appState.accessToken}`,
                        'GET'
                    );
                    
                    console.log('Phones response:', phonesResponse);
                    
                    if (phonesResponse && phonesResponse.value) {
                        phonesResponse.value.forEach(phone => {
                            if (phone.type === 'Chapter #1') {
                                phoneIds.phone = phone.id;
                            } else if (phone.type === 'Email #1 (Chapter)') {
                                phoneIds.email = phone.id;
                            }
                        });
                    }
                    
                    console.log('Phone IDs found:', phoneIds);
                } catch (error) {
                    console.error('Error getting phone IDs:', error);
                    // Don't add to errors array - we'll try to create new records instead
                    console.log('Will attempt to create new phone/email records');
                }
            }
            
            // Process each change
            for (const change of changes) {
                try {
                    if (change.type === 'postal_address' || change.type === 'shipping_address') {
                        await processAddressUpdate(change, chapterData);
                        successCount++;
                    } else if (change.type === 'phone') {
                        await processPhoneUpdate(phoneIds.phone, change.data, 'Chapter #1', chapterData);
                        successCount++;
                    } else if (change.type === 'email') {
                        await processPhoneUpdate(phoneIds.email, change.data, 'Email #1 (Chapter)', chapterData);
                        successCount++;
                    }
                } catch (error) {
                    console.error(`Error processing ${change.type}:`, error);
                    errorCount++;
                    errors.push(`${change.type}: ${error.message}`);
                }
            }
            
            // Show results
            if (errorCount === 0) {
                // Hide the content section
                Utils.hideElement('contact-content');
                
                // Create a temporary success message div
                const successDiv = document.createElement('div');
                successDiv.className = 'submission-success-overlay';
                successDiv.innerHTML = `
                    <div class="submission-success">
                        <p>Successfully updated ${successCount} contact information field(s).</p>
                    </div>
                `;
                document.querySelector('.container').appendChild(successDiv);
                
                // Wait 2 seconds then return to main menu
                setTimeout(() => {
                    successDiv.remove();
                    window.showMainMenu();
                }, 2000);
            } else {
                // Show error message with retry instructions
                submitSection.innerHTML = `
                    <div class="submission-error">
                        <p>Updated ${successCount} field(s) with ${errorCount} error(s).</p>
                        <p>Errors encountered:</p>
                        <ul class="error-list">
                            ${errors.map(err => `<li>${err}</li>`).join('')}
                        </ul>
                        <p>Please retry submission. If the problem persists, email <a href="mailto:members.area@sigmanu.org">members.area@sigmanu.org</a> with the error message above.</p>
                        <button class="btn" onclick="ContactModule.submitContactChanges()">Retry</button>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Fatal error during submission:', error);
            
            // Show error message
            submitSection.innerHTML = `
                <div class="submission-error">
                    <p>Submission failed: ${error.message}</p>
                    <p>Please retry submission. If the problem persists, email <a href="mailto:members.area@sigmanu.org">members.area@sigmanu.org</a> with the error message above.</p>
                    <button class="btn" onclick="ContactModule.submitContactChanges()">Retry</button>
                </div>
            `;
        }
    }
    
    async function processAddressUpdate(change, chapterData) {
        console.log(`Processing ${change.type} update`);
        
        const addressId = change.type === 'postal_address' ? appState.postalImpId : appState.shippingImpId;
        const addressType = change.type === 'postal_address' ? 'Chapter (Postal)' : 'Chapter (Shipping)';
        
        // Get current date in Eastern Time in ISO format
        const easternTime = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
        const easternDate = new Date(easternTime);
        const currentDateISO = `${easternDate.getFullYear()}-${String(easternDate.getMonth() + 1).padStart(2, '0')}-${String(easternDate.getDate()).padStart(2, '0')}T00:00:00Z`;
        
        // Concatenate address lines with /n
        let addressLines = change.data.address1;
        if (change.data.address2) {
            addressLines += `/n${change.data.address2}`;
        }
        
        // Check if we have an address ID - if not, create instead of update
        if (!addressId) {
            console.log(`No address ID found for ${change.type}, creating new address`);
            
            const createAddressData = {
                constituent_id: chapterData.csid,
                address_lines: addressLines,
                city: change.data.city,
                country: "United States",
                do_not_mail: false,
                postal_code: change.data.zip,
                start: currentDateISO,
                state: change.data.state,
                type: addressType,
                information_source: "NetCommunity"
            };
            
            console.log('Address create data:', createAddressData);
            
            const response = await API.makeRateLimitedApiCall(
                '/api/blackbaud?action=create-address',
                'POST',
                createAddressData
            );
            
            console.log('Address create response:', response);
        } else {
            // Update existing address
            const addressData = {
                address_lines: addressLines,
                city: change.data.city,
                country: "United States",
                do_not_mail: false,
                postal_code: change.data.zip,
                start: currentDateISO,
                state: change.data.state,
                type: addressType,
                information_source: "NetCommunity"
            };
            
            console.log('Address update data:', addressData);
            
            const response = await API.makeRateLimitedApiCall(
                `/api/blackbaud?action=patch-address&endpoint=/constituent/v1/addresses/${addressId}&method=PATCH`,
                'POST',
                addressData
            );
            
            console.log('Address update response:', response);
        }
    }
    
    async function processPhoneUpdate(phoneId, value, phoneType, chapterData) {
        console.log(`Processing phone/email update for ID: ${phoneId}, type: ${phoneType}`);
        
        // Check if we have a phone ID - if not, create instead of update
        if (!phoneId) {
            console.log(`No phone ID found for ${phoneType}, creating new phone/email`);
            
            const createPhoneData = {
                constituent_id: chapterData.csid,
                do_not_call: false,
                inactive: false,
                number: value,
                primary: false,
                type: phoneType
            };
            
            console.log('Phone create data:', createPhoneData);
            
            const response = await API.makeRateLimitedApiCall(
                '/api/blackbaud?action=create-phone',
                'POST',
                createPhoneData
            );
            
            console.log('Phone create response:', response);
        } else {
            // Update existing phone/email
            const phoneData = {
                do_not_call: false,
                inactive: false,
                number: value
            };
            
            console.log('Phone update data:', phoneData);
            
            const response = await API.makeRateLimitedApiCall(
                `/api/blackbaud?action=patch-phone&endpoint=/constituent/v1/phones/${phoneId}&method=PATCH`,
                'POST',
                phoneData
            );
            
            console.log('Phone update response:', response);
        }
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