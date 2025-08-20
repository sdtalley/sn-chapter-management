// Verify Initiates Module for SN Chapter Management
const InitiatesModule = (function() {
    'use strict';
    
    // Reference to global state and utilities
    const appState = window.appState;
    const Utils = window.Utils;
    const API = window.API;
    const Queries = window.Queries;
    
    // Load initiates data
    async function loadInitiates() {
        console.log('=== loadInitiates() started ===');
        console.log('Chapter:', appState.chapter);
        
        if (!appState.chapter) {
            Utils.showError('initiates-error', 'No chapter specified. Please access this page with a chapter parameter.');
            console.error('No chapter parameter found');
            return;
        }

        // Show loading state
        console.log('Showing loading state...');
        Utils.showLoading('initiates-loading');
        Utils.hideElement('initiates-content');
        Utils.hideElement('initiates-error');

        try {
            // Check if skips are allowed for this chapter
            const skipValidationDisabled = await API.checkAllowedSkips();
            const lowerBadgeAllowed = await API.checkAllowedLowerBadge();
            
            // Use cached chapter data
            const chapterData = appState.chapterData;
            console.log('Chapter data from cache:', chapterData);
            
            if (!chapterData || !chapterData.quid) {
                throw new Error(`Chapter data not found for ${appState.chapter}`);
            }

            // Execute both queries in parallel
            const [initiatesResults, topBadgeResults] = await Promise.all([
                // Query 1: Get initiates
                API.executeQuery(Queries.buildInitiatesQuery(chapterData.quid, appState.chapter), 'candidates'),
                // Query 2: Get top badge (only if memcatid exists)
                chapterData.memcatid ? API.executeQuery(Queries.buildTopBadgeQuery(chapterData.memcatid), 'topbadge') : Promise.resolve(null)
            ]);
            
            // Process initiates results
            const initiates = processInitiatesResults(initiatesResults);
            console.log('Processed initiates:', initiates);
            
            // Process top badge if available
            let topBadgeNumber = null;
            if (topBadgeResults && Array.isArray(topBadgeResults) && topBadgeResults.length > 0) {
                const fullBadge = topBadgeResults[0].Badge;
                // Extract last 4 characters and convert to number to remove leading zeros
                const last4 = fullBadge.slice(-4);
                topBadgeNumber = parseInt(last4, 10);
                console.log('Top badge found:', fullBadge, '-> processed to:', topBadgeNumber);
            }
            
            // Store in app state for validation
            appState.lastBadgeNumber = topBadgeNumber;
            appState.skipValidationDisabled = skipValidationDisabled;
            appState.lowerBadgeAllowed = lowerBadgeAllowed;
            
            // Display initiates with top badge info
            displayInitiates(initiates, topBadgeNumber);
            
        } catch (error) {
            console.error('Error loading initiates:', error);
            Utils.showError('initiates-error', `Failed to load initiates: ${error.message}`);
        }
    }

    function processInitiatesResults(results) {
        console.log('=== processInitiatesResults() started ===');
        console.log('Raw results:', results);
        
        const initiates = [];
        
        if (Array.isArray(results)) {
            console.log(`Processing ${results.length} initiates`);
            
            results.forEach((row, index) => {
                console.log(`Row ${index}:`, row);
                
                // Truncate codeId to last 5 digits
                let truncatedCodeId = row.CodeID || '';
                if (truncatedCodeId && truncatedCodeId.length > 5) {
                    truncatedCodeId = truncatedCodeId.slice(-5);
                }
                
                // Truncate relationId to last 7 digits
                let truncatedRelationId = row.Relation_ID || '';
                if (truncatedRelationId && truncatedRelationId.length > 7) {
                    truncatedRelationId = truncatedRelationId.slice(-7);
                }
                
                const initiate = {
                    id: row.ID || row.QRECID || row.id,
                    name: row.Name || row.name || 'N/A',
                    candidateCeremonyDate: row.Candidate_Ceremony_Date || '',
                    code: row.Code || '',
                    codeId: truncatedCodeId,
                    relationId: truncatedRelationId
                };
                
                console.log(`Initiate ${index}:`, initiate);
                initiates.push(initiate);
            });
        } else {
            console.warn('Unexpected results format:', results);
        }

        console.log(`Total initiates processed: ${initiates.length}`);
        return initiates;
    }

    function displayInitiates(initiates, topBadgeNumber = null) {
        console.log('=== displayInitiates() started ===');
        console.log('Number of initiates to display:', initiates.length);
        console.log('Top badge number:', topBadgeNumber);
        
        const chapterSpan = document.getElementById('initiates-chapter');
        const countSpan = document.getElementById('initiates-count');
        const tbody = document.getElementById('initiates-tbody');
        const lastBadgeInfo = document.getElementById('last-badge-info');
        const lastBadgeNumber = document.getElementById('last-badge-number');
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        if (countSpan) countSpan.textContent = initiates.length;
        
        // Display top badge if available
        if (topBadgeNumber !== null && lastBadgeInfo && lastBadgeNumber) {
            lastBadgeNumber.textContent = topBadgeNumber.toString();
            lastBadgeInfo.style.display = 'block';
        }
        
        // Set up same date checkbox functionality
        setupSameDateCheckbox();
        
        // Clear existing rows
        if (tbody) {
            tbody.innerHTML = '';
            
            if (initiates.length === 0) {
                console.log('No initiates found - showing empty state');
                const row = tbody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 5; // 5 columns for initiates table
                cell.className = 'empty-state-cell';
                cell.textContent = 'No prospective initiates found for this chapter.';
            } else {
                console.log('Creating table rows for initiates...');
                initiates.forEach((initiate, index) => {
                    console.log(`Creating row ${index} for:`, initiate);
                    
                    const row = tbody.insertRow();
                    
                    // Store initiate ID, code, codeId, and relationId as data attributes
                    row.dataset.initiateId = initiate.id;
                    row.dataset.code = initiate.code;
                    row.dataset.codeId = initiate.codeId;
                    row.dataset.relationId = initiate.relationId;
                    row.dataset.candidateCeremonyDate = initiate.candidateCeremonyDate;
                    
                    // Initiated checkbox
                    const initiatedCell = row.insertCell();
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'initiated-checkbox';
                    checkbox.id = `initiated-${index}`;
                    checkbox.addEventListener('change', function() {
                        handleInitiatedChange(index, this.checked);
                        // Mark as having unsaved changes
                        if (window.setUnsavedChanges) {
                            window.setUnsavedChanges(true);
                        }
                    });
                    initiatedCell.appendChild(checkbox);
                    
                    // Name
                    const nameCell = row.insertCell();
                    nameCell.textContent = initiate.name || 'N/A';
                    
                    // Candidate Ceremony Date
                    const candidateDateCell = row.insertCell();
                    if (initiate.candidateCeremonyDate) {
                        // Format date for display if it exists
                        candidateDateCell.textContent = Utils.formatDateForDisplay(initiate.candidateCeremonyDate);
                    } else {
                        candidateDateCell.textContent = 'N/A';
                    }
                    
                    // Initiate Ceremony Date
                    const initiateDateCell = row.insertCell();
                    const dateInput = document.createElement('input');
                    dateInput.type = 'date';
                    dateInput.className = 'date-input';
                    dateInput.id = `initiate-ceremony-date-${index}`;
                    dateInput.disabled = true; // Initially disabled
                    
                    // Set max date to today
                    const today = new Date();
                    dateInput.max = today.toISOString().split('T')[0];
                    
                    // Set min date to day after candidate ceremony date if it exists
                    if (initiate.candidateCeremonyDate) {
                        const candidateDate = Utils.parseDate(initiate.candidateCeremonyDate);
                        if (candidateDate) {
                            candidateDate.setDate(candidateDate.getDate() + 1);
                            dateInput.min = candidateDate.toISOString().split('T')[0];
                        }
                    }
                    
                    initiateDateCell.appendChild(dateInput);
                    
                    // Badge Number
                    const badgeCell = row.insertCell();
                    const badgeInput = document.createElement('input');
                    badgeInput.type = 'number';
                    badgeInput.className = 'badge-input';
                    badgeInput.id = `badge-number-${index}`;
                    badgeInput.disabled = true; // Initially disabled
                    
                    // Set min based on last badge number
                    if (topBadgeNumber !== null) {
                        badgeInput.min = (topBadgeNumber + 1).toString();
                    } else {
                        badgeInput.min = '1';
                    }
                    badgeInput.max = '9999';
                    badgeInput.placeholder = '0000';
                    
                    // Add validation for badge number
                    badgeInput.addEventListener('input', function() {
                        // Restrict to 4 digits
                        if (this.value.length > 4) {
                            this.value = this.value.slice(0, 4);
                        }
                        
                        // Validate against last badge number (unless lower badges are allowed)
                        if (appState.lastBadgeNumber !== null && this.value && !appState.lowerBadgeAllowed) {
                            const enteredNumber = parseInt(this.value, 10);
                            if (enteredNumber <= appState.lastBadgeNumber) {
                                this.setCustomValidity(`Badge number must be greater than ${appState.lastBadgeNumber}`);
                                this.reportValidity();
                            } else {
                                this.setCustomValidity('');
                            }
                        } else {
                            this.setCustomValidity('');
                        }

                        // Mark as having unsaved changes
                        if (window.setUnsavedChanges) {
                            window.setUnsavedChanges(true);
                        }
                    });
                    
                    badgeCell.appendChild(badgeInput);
                });
            }
        }
        
        // Show content
        console.log('Hiding loading state and showing content...');
        Utils.hideElement('initiates-loading');
        Utils.showElement('initiates-content');
        
        // Trigger resize
        Utils.resizeIframe();
        console.log('=== displayInitiates() completed ===');
    }

    function setupSameDateCheckbox() {
        const checkbox = document.getElementById('initiates-same-date-checkbox');
        const datePicker = document.getElementById('initiates-same-date-picker');
        
        if (checkbox && datePicker) {
            // Set max date to today
            const today = new Date();
            datePicker.max = today.toISOString().split('T')[0];
            
            // Clear any existing event listeners
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);
            
            // Add event listener for checkbox
            newCheckbox.addEventListener('change', function() {
                datePicker.disabled = !this.checked;
                if (!this.checked) {
                    datePicker.value = '';
                    // Clear all date fields when unchecked
                    clearAllDateFields();
                }
            });
            
            // Add event listener for date picker
            datePicker.addEventListener('change', function() {
                if (newCheckbox.checked && this.value) {
                    updateAllInitiatedDates(this.value);
                }
            });
        }
    }
    
    function clearAllDateFields() {
        const tbody = document.getElementById('initiates-tbody');
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                const checkbox = document.getElementById(`initiated-${index}`);
                const dateInput = document.getElementById(`initiate-ceremony-date-${index}`);
                
                if (checkbox && dateInput) {
                    // Only clear if initiated
                    if (checkbox.checked) {
                        dateInput.value = '';
                    }
                }
            });
        }
    }
    
    function updateAllInitiatedDates(date) {
        const tbody = document.getElementById('initiates-tbody');
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                const checkbox = document.getElementById(`initiated-${index}`);
                const dateInput = document.getElementById(`initiate-ceremony-date-${index}`);
                
                if (checkbox && dateInput) {
                    // Only update if initiated
                    if (checkbox.checked) {
                        // Check if the date meets the min date requirement
                        if (dateInput.min && date >= dateInput.min) {
                            dateInput.value = date;
                        } else if (!dateInput.min) {
                            dateInput.value = date;
                        }
                        // If date is before min date, don't update this field
                    }
                }
            });
        }
    }

    function handleInitiatedChange(index, isChecked) {
        const dateInput = document.getElementById(`initiate-ceremony-date-${index}`);
        const badgeInput = document.getElementById(`badge-number-${index}`);
        
        const sameDateCheckbox = document.getElementById('initiates-same-date-checkbox');
        const sameDatePicker = document.getElementById('initiates-same-date-picker');
        
        if (dateInput) {
            dateInput.disabled = !isChecked;
            if (!isChecked) {
                dateInput.value = '';
            } else {
                // If same date is checked and has a value, apply it
                if (sameDateCheckbox && sameDateCheckbox.checked && sameDatePicker && sameDatePicker.value) {
                    // Check if the date meets the min date requirement
                    if (dateInput.min && sameDatePicker.value >= dateInput.min) {
                        dateInput.value = sameDatePicker.value;
                    } else if (!dateInput.min) {
                        dateInput.value = sameDatePicker.value;
                    }
                }
            }
        }
        
        if (badgeInput) {
            badgeInput.disabled = !isChecked;
            if (!isChecked) {
                badgeInput.value = '';
            }
        }
    }

    function reviewInitiateChanges() {
        // Get all initiate changes
        const changes = [];
        const tbody = document.getElementById('initiates-tbody');
        
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach((row, index) => {
                const initiateId = row.dataset.initiateId;
                if (initiateId) {
                    const checkbox = document.getElementById(`initiated-${index}`);
                    const dateInput = document.getElementById(`initiate-ceremony-date-${index}`);
                    const badgeInput = document.getElementById(`badge-number-${index}`);
                    const nameCell = row.cells[1]; // Name is in second column
                    
                    if (checkbox && checkbox.checked && dateInput && badgeInput) {
                        changes.push({
                            id: initiateId,
                            code: row.dataset.code,
                            codeId: row.dataset.codeId,
                            relationId: row.dataset.relationId,
                            candidateCeremonyDate: row.dataset.candidateCeremonyDate,
                            name: nameCell.textContent,
                            initiated: true,
                            ceremonyDate: dateInput.value,
                            ceremonyDateFormatted: dateInput.value ? Utils.formatDateForDisplay(dateInput.value) : '',
                            badgeNumber: badgeInput.value
                        });
                    }
                }
            });
        }
        
        if (changes.length === 0) {
            const message = 'No initiates have been selected. Please check at least one initiate.';
            alert(message);
            Utils.showStatus(message, 'error');
            return;
        }
        
        // Validate that all selected initiates have ceremony dates and badge numbers
        const incomplete = changes.filter(i => !i.ceremonyDate || !i.badgeNumber);
        
        if (incomplete.length > 0) {
            const message = `Please ensure all selected initiates have ceremony dates and badge numbers. ${incomplete.length} initiate(s) missing required information.`;
            alert(message);
            Utils.showStatus(message, 'error');
            return;
        }
        
        // Validate badge numbers are greater than last badge (unless lower badges are allowed)
        if (appState.lastBadgeNumber !== null && !appState.lowerBadgeAllowed) {
            const invalidBadges = changes.filter(i => {
                const badgeNum = parseInt(i.badgeNumber, 10);
                return badgeNum <= appState.lastBadgeNumber;
            });

            if (invalidBadges.length > 0) {
                const message = `Badge numbers must be greater than ${appState.lastBadgeNumber}. ${invalidBadges.length} initiate(s) have invalid badge numbers.`;
                alert(message);
                Utils.showStatus(message, 'error');
                return;
            }
        } else if (appState.lowerBadgeAllowed) {
            console.log('Lower badge validation is disabled for this chapter');
        }
        
        // Check for duplicate badge numbers
        const badgeNumbers = changes.map(c => parseInt(c.badgeNumber, 10));
        const uniqueBadgeNumbers = [...new Set(badgeNumbers)];
        
        if (badgeNumbers.length !== uniqueBadgeNumbers.length) {
            // Find the duplicate badge numbers
            const duplicates = badgeNumbers.filter((num, index) => badgeNumbers.indexOf(num) !== index);
            const uniqueDuplicates = [...new Set(duplicates)];
            const message = `Duplicate badge numbers found: ${uniqueDuplicates.join(', ')}. Each initiate must have a unique badge number.`;
            alert(message);
            Utils.showStatus(message, 'error');
            return;
        }
        
        // Only check for skipped numbers if validation is NOT disabled for this chapter
        if (!appState.skipValidationDisabled) {
            // Sort badge numbers and check for skipped numbers
            const sortedBadgeNumbers = [...badgeNumbers].sort((a, b) => a - b);
            const startingNumber = appState.lastBadgeNumber !== null ? appState.lastBadgeNumber : 0;
            
            // Check for skipped numbers from last badge to first new badge
            if (sortedBadgeNumbers[0] > startingNumber + 1) {
                const skippedCount = sortedBadgeNumbers[0] - startingNumber - 1;
                const skippedNumbers = [];
                for (let i = startingNumber + 1; i < sortedBadgeNumbers[0]; i++) {
                    skippedNumbers.push(i);
                }
                const message = `Badge numbers must be consecutive. Skipped number(s): ${skippedNumbers.join(', ')} (${skippedCount} total) between ${startingNumber} and ${sortedBadgeNumbers[0]}.`;
                alert(message);
                Utils.showStatus(message, 'error');
                return;
            }
            
            // Check for skipped numbers between new badges
            for (let i = 1; i < sortedBadgeNumbers.length; i++) {
                if (sortedBadgeNumbers[i] > sortedBadgeNumbers[i-1] + 1) {
                    const skippedCount = sortedBadgeNumbers[i] - sortedBadgeNumbers[i-1] - 1;
                    const skippedNumbers = [];
                    for (let j = sortedBadgeNumbers[i-1] + 1; j < sortedBadgeNumbers[i]; j++) {
                        skippedNumbers.push(j);
                    }
                    const message = `Badge numbers must be consecutive. Skipped number(s): ${skippedNumbers.join(', ')} (${skippedCount} total) between ${sortedBadgeNumbers[i-1]} and ${sortedBadgeNumbers[i]}.`;
                    alert(message);
                    Utils.showStatus(message, 'error');
                    return;
                }
            }
        } else {
            console.log('Skip validation is disabled for this chapter');
        }
        
        // Sort changes by badge number for display
        changes.sort((a, b) => parseInt(a.badgeNumber, 10) - parseInt(b.badgeNumber, 10));
        
        // Display review table
        displayInitiateReview(changes);
    }

    function displayInitiateReview(changes) {
        const chapterSpan = document.getElementById('initiates-review-chapter');
        const countSpan = document.getElementById('initiates-review-count');
        const tbody = document.getElementById('initiates-review-tbody');
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        if (countSpan) countSpan.textContent = changes.length;
        
        if (tbody) {
            tbody.innerHTML = '';
            
            changes.forEach(change => {
                const row = tbody.insertRow();
                
                // Store the initiate data on the row for later retrieval
                row.initiateData = {
                    id: change.id,
                    code: change.code,
                    codeId: change.codeId,
                    relationId: change.relationId,
                    candidateCeremonyDate: change.candidateCeremonyDate,
                    ceremonyDate: change.ceremonyDate,
                    badgeNumber: change.badgeNumber
                };
                
                // Name
                const nameCell = row.insertCell();
                nameCell.textContent = change.name;
                
                // Ceremony Date
                const dateCell = row.insertCell();
                dateCell.textContent = change.ceremonyDateFormatted;
                
                // Badge Number
                const badgeCell = row.insertCell();
                badgeCell.textContent = change.badgeNumber;
            });
        }
        
        // Hide main content, show review
        Utils.hideElement('initiates-content');
        Utils.showElement('initiates-review');
        Utils.resizeIframe();
    }

    function backToInitiates() {
        Utils.hideElement('initiates-review');
        Utils.showElement('initiates-content');
        Utils.resizeIframe();
    }

    function submitInitiateVerifications() {
        // Get all initiate data from the review table
        const tbody = document.getElementById('initiates-review-tbody');
        if (!tbody) {
            Utils.showStatus('No review data found. Please return to the main screen.', 'error');
            return;
        }
        
        const rows = tbody.querySelectorAll('tr');
        const initiates = [];
        
        // Collect all initiate data from review table
        rows.forEach((row) => {
            const nameCell = row.cells[0];
            const dateCell = row.cells[1];
            const badgeCell = row.cells[2];
            
            // Store the initiate data that was saved during review
            const initiateData = row.initiateData;
            
            if (initiateData) {
                initiates.push({
                    id: initiateData.id,
                    code: initiateData.code,
                    codeId: initiateData.codeId,
                    relationId: initiateData.relationId,
                    candidateCeremonyDate: initiateData.candidateCeremonyDate,
                    name: nameCell.textContent,
                    ceremonyDate: initiateData.ceremonyDate,
                    badgeNumber: initiateData.badgeNumber
                });
            }
        });
        
        if (initiates.length === 0) {
            Utils.showStatus('No initiates found for submission.', 'error');
            return;
        }
        
        // Store pending initiates in case of retry
        appState.pendingInitiates = initiates;
        
        // Start the submission process
        submitInitiateChanges(initiates);
    }
    
    async function submitInitiateChanges(initiates) {
        console.log('=== submitInitiateChanges() started ===');
        console.log('Submitting changes for', initiates.length, 'initiates');
        
        // Get the submit section and create spinner
        const submitSection = document.querySelector('#initiates-review .submit-section');
        const originalContent = submitSection.innerHTML;
        
        // Replace submit section content with spinner
        submitSection.innerHTML = '<div class="spinner"></div>';
        
        try {
            // Use cached chapter data
            const chapterData = appState.chapterData;
            if (!chapterData) {
                throw new Error('Chapter data not available');
            }
            
            let successCount = 0;
            let errorCount = 0;
            const errors = [];
            
            // Process each initiate
            for (const initiate of initiates) {
                try {
                    await processInitiateSubmission(initiate, chapterData);
                    successCount++;
                } catch (error) {
                    console.error(`Error processing initiate ${initiate.name}:`, error);
                    errorCount++;
                    errors.push(`${initiate.name}: ${error.message}`);
                }
            }
            
            // Show results
            if (errorCount === 0) {
                // Hide the review table before showing success message
                Utils.hideElement('initiates-review');
                
                // Create a temporary success message div
                const successDiv = document.createElement('div');
                successDiv.className = 'submission-success-overlay';
                successDiv.innerHTML = `
                    <div class="submission-success">
                        <p>Successfully processed all ${successCount} initiate(s).</p>
                    </div>
                `;
                document.querySelector('.container').appendChild(successDiv);
                
                // Clear pending initiates
                delete appState.pendingInitiates;

                // Clear unsaved Changes tracking
                if (window.setUnsavedChanges) {
                    window.setUnsavedChanges(false);
                }

                // Wait 2 seconds then return to main menu
                setTimeout(() => {
                    successDiv.remove();
                    window.showMainMenu();
                }, 2000);
            } else {
                // Show error message with retry instructions
                submitSection.innerHTML = `
                    <div class="submission-error">
                        <p>Processed ${successCount} initiate(s) with ${errorCount} error(s).</p>
                        <p>Errors encountered:</p>
                        <ul class="error-list">
                            ${errors.map(err => `<li>${err}</li>`).join('')}
                        </ul>
                        <p>Please try again. If the problem persists, email <a href="mailto:members.area@sigmanu.org">members.area@sigmanu.org</a> with the error message above.</p>
                        <button class="btn" onclick="InitiatesModule.backToInitiates()">Back</button>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Fatal error during submission:', error);
            
            // Show error message with email instructions
            submitSection.innerHTML = `
                <div class="submission-error">
                    <p>Submission failed: ${error.message}</p>
                    <p>Please try again. If the problem persists, email <a href="mailto:members.area@sigmanu.org">members.area@sigmanu.org</a> with the error message above.</p>
                    <button class="btn" onclick="InitiatesModule.backToInitiates()">Back</button>
                </div>
            `;
        }
    }
    
    async function processInitiateSubmission(initiate, chapterData) {
        console.log(`Processing initiate: ${initiate.name}`);
        
        // Step 1: Parse initiate ceremony date
        const [iYear, iMonth, iDay] = initiate.ceremonyDate.split('-');
        const startDate = {
            d: parseInt(iDay, 10),
            m: parseInt(iMonth, 10),
            y: parseInt(iYear, 10)
        };
        
        // Step 2: Parse candidate ceremony date if exists
        let cstartDate = null;
        if (initiate.candidateCeremonyDate) {
            const candidateDate = Utils.parseDate(initiate.candidateCeremonyDate);
            if (candidateDate) {
                cstartDate = {
                    d: candidateDate.getDate(),
                    m: candidateDate.getMonth() + 1,
                    y: candidateDate.getFullYear()
                };
            }
        }
        
        // Step 3: Calculate end date (initiate ceremony date - 1 day)
        // Parse the date components directly to avoid timezone issues
        const [eYear, eMonth, eDay] = initiate.ceremonyDate.split('-');
        const ceremonyDateParsed = new Date(parseInt(eYear), parseInt(eMonth) - 1, parseInt(eDay));
        
        // Calculate end date (1 day before ceremony date)
        const endDateObj = new Date(ceremonyDateParsed);
        endDateObj.setDate(endDateObj.getDate() - 1);
        
        const endDate = {
            d: endDateObj.getDate(),
            m: endDateObj.getMonth() + 1,
            y: endDateObj.getFullYear()
        };
        
        // Get current date in Eastern Time
        const easternTime = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
        const easternDate = new Date(easternTime);
        const currentDate = {
            d: easternDate.getDate(),
            m: easternDate.getMonth() + 1,
            y: easternDate.getFullYear()
        };
        const currentDateISO = `${easternDate.getFullYear()}-${String(easternDate.getMonth() + 1).padStart(2, '0')}-${String(easternDate.getDate()).padStart(2, '0')}T00:00:00Z`;
        
        // Step 4: Delete existing constituent code
        console.log(`Deleting code: ${initiate.codeId}`);
        const deleteResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=delete-constituent-code&endpoint=/constituent/v1/constituentcodes/${initiate.codeId}`,
            'DELETE'
        );
        
        console.log('Delete response:', deleteResponse);
        
        // Step 5: Create new constituent code (Initiate)
        console.log('Creating new code: Initiate');
        const codeData = {
            constituent_id: initiate.id,
            description: 'Initiate',
            start: startDate
        };
        
        const createCodeResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-constituent-code',
            'POST',
            codeData
        );
        
        console.log('Create code response:', createCodeResponse);
        
        // Step 6: Create constituent note
        console.log('Creating note');
        const noteData = {
            constituent_id: initiate.id,
            date: currentDate,
            text: `Changed to Initiate by ${appState.offname || 'Unknown'}`,
            type: "CodeLog"
        };
        
        const createNoteResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-constituent-note',
            'POST',
            noteData
        );
        
        console.log('Create note response:', createNoteResponse);
        
        // Step 7: Create closed candidate relationship (only if we have candidate ceremony date)
        if (cstartDate) {
            console.log('Creating closed candidate relationship');
            const closedRelationshipData = {
                comment: `Added by ${appState.offname || 'Unknown'}`,
                constituent_id: initiate.id,
                is_organization_contact: false,
                is_primary_business: false,
                is_spouse: false,
                do_not_reciprocate: true,
                reciprocal_type: "Candidate",
                relation_id: chapterData.csid,
                start: cstartDate,
                end: endDate,
                type: "Collegiate Chapter"
            };
            
            const createClosedRelResponse = await API.makeRateLimitedApiCall(
                '/api/blackbaud?action=create-constituent-relationship',
                'POST',
                closedRelationshipData
            );
            
            console.log('Create closed relationship response:', createClosedRelResponse);
        }
        
        // Step 8: Create initiate relationship
        console.log('Creating initiate relationship');
        const initiateRelationshipData = {
            comment: `Added by ${appState.offname || 'Unknown'}`,
            constituent_id: initiate.id,
            is_organization_contact: false,
            is_primary_business: false,
            is_spouse: false,
            reciprocal_type: "Initiate",
            relation_id: chapterData.csid,
            start: startDate,
            type: "Collegiate Chapter"
        };
        
        const createInitRelResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-constituent-relationship',
            'POST',
            initiateRelationshipData
        );
        
        console.log('Create initiate relationship response:', createInitRelResponse);
        
        // Step 9: Delete existing candidate relationship
        console.log(`Deleting relationship: ${initiate.relationId}`);
        const deleteRelResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=delete-relationship&endpoint=/constituent/v1/relationships/${initiate.relationId}`,
            'DELETE'
        );
        
        console.log('Delete relationship response:', deleteRelResponse);
        
        // Step 10: Create custom fields
        console.log('Creating custom fields');
        
        // Format badge number with leading zeros
        const formattedBadge = initiate.badgeNumber.padStart(4, '0');
        const fullBadge = `${chapterData.prefix}${formattedBadge}`;
        
        const customFields = [
            {
                category: "Initiate - Ceremony Date",
                comment: "Yes",
                date: currentDateISO,
                value: `${initiate.ceremonyDate}T00:00:00Z`
            },
            {
                category: "Initiate - Fee Paid",
                comment: chapterData.feid
            },
            {
                category: "Initiate - Complete Date",
                value: ""
            },
            {
                category: "Preferred Chapter Badge",
                value: fullBadge
            }
        ];
        
        const createFieldsResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-custom-fields',
            'POST',
            {
                constituentId: initiate.id,
                fields: customFields
            }
        );
        
        console.log('Create custom fields response:', createFieldsResponse);
        
        // Get custom fields to find Sigma Nu Code ID
        console.log('Getting custom fields to find Sigma Nu Code ID');
        const customFieldsResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=get-custom-fields&constituentId=${initiate.id}`,
            'GET'
        );
        
        console.log('Custom fields response:', customFieldsResponse);
        
        // Find the Sigma Nu Code attribute ID
        let snAttId = null;
        if (customFieldsResponse && customFieldsResponse.value) {
            const sncField = customFieldsResponse.value.find(field => field.category === 'Sigma Nu Code');
            if (sncField) {
                snAttId = sncField.id;
                console.log('Found Sigma Nu Code attribute ID:', snAttId);
            }
        }
        
        if (!snAttId) {
            throw new Error('Could not find Sigma Nu Code attribute ID');
        }
        
        // Step 11: Update Sigma Nu Code custom field
        console.log('Updating Sigma Nu Code');
        const updateSNCData = {
            value: "Initiate"
        };
        
        const updateSNCResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=patch-custom-field&endpoint=/constituent/v1/constituents/customfields/${snAttId}&method=PATCH`,
            'POST',
            updateSNCData
        );
        
        console.log('Update SNC response:', updateSNCResponse);
        
        // Step 12: Create membership
        console.log('Creating membership');
        const membershipData = {
            membership_id: fullBadge,
            category: {
                value: appState.chapter
            },
            joined_date: initiate.ceremonyDate,
            lifetime_membership: true,
            total_members: 1
        };
        
        const createMembershipResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=create-membership&constituentId=${initiate.id}`,
            'POST',
            membershipData
        );
        
        console.log('Create membership response:', createMembershipResponse);
        
        console.log(`Successfully processed initiate: ${initiate.name}`);
    }
    
    function retrySubmission() {
        if (appState.pendingInitiates) {
            submitInitiateChanges(appState.pendingInitiates);
        } else {
            Utils.showStatus('No pending initiates to retry.', 'error');
        }
    }
    
    // Public API
    return {
        loadInitiates,
        reviewInitiateChanges,
        backToInitiates,
        submitInitiateVerifications,
        retrySubmission
    };
})();

// Make it available globally
window.InitiatesModule = InitiatesModule;

// Also expose individual functions for backward compatibility
window.loadInitiates = InitiatesModule.loadInitiates;
window.reviewInitiateChanges = InitiatesModule.reviewInitiateChanges;
window.backToInitiates = InitiatesModule.backToInitiates;
window.submitInitiateVerifications = InitiatesModule.submitInitiateVerifications;