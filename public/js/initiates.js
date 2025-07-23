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
                    
                    // Initiated checkbox
                    const initiatedCell = row.insertCell();
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'initiated-checkbox';
                    checkbox.id = `initiated-${index}`;
                    checkbox.addEventListener('change', function() {
                        handleInitiatedChange(index, this.checked);
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
                        
                        // Validate against last badge number
                        if (appState.lastBadgeNumber !== null && this.value) {
                            const enteredNumber = parseInt(this.value, 10);
                            if (enteredNumber <= appState.lastBadgeNumber) {
                                this.setCustomValidity(`Badge number must be greater than ${appState.lastBadgeNumber}`);
                                this.reportValidity();
                            } else {
                                this.setCustomValidity('');
                            }
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

    function handleInitiatedChange(index, isChecked) {
        const dateInput = document.getElementById(`initiate-ceremony-date-${index}`);
        const badgeInput = document.getElementById(`badge-number-${index}`);
        
        if (dateInput) {
            dateInput.disabled = !isChecked;
            if (!isChecked) {
                dateInput.value = '';
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
        
        // Validate badge numbers are greater than last badge
        if (appState.lastBadgeNumber !== null) {
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
                    relationId: change.relationId
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
        // Get all initiate data
        const initiates = [];
        const tbody = document.getElementById('initiates-tbody');
        
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach((row, index) => {
                const initiateId = row.dataset.initiateId;
                if (initiateId) {
                    const checkbox = document.getElementById(`initiated-${index}`);
                    const dateInput = document.getElementById(`initiate-ceremony-date-${index}`);
                    const badgeInput = document.getElementById(`badge-number-${index}`);
                    
                    if (checkbox && checkbox.checked && dateInput && badgeInput) {
                        // Format date as mm/dd/yyyy for display
                        let formattedDate = '';
                        if (dateInput.value) {
                            const [year, month, day] = dateInput.value.split('-');
                            formattedDate = `${month}/${day}/${year}`;
                        }
                        
                        initiates.push({
                            id: initiateId,
                            initiated: true,
                            ceremonyDate: dateInput.value,
                            ceremonyDateFormatted: formattedDate,
                            badgeNumber: badgeInput.value
                        });
                    }
                }
            });
        }
        
        if (initiates.length === 0) {
            Utils.showStatus('No initiates have been selected. Please check at least one initiate.', 'error');
            return;
        }
        
        // Validate that all selected initiates have ceremony dates and badge numbers
        const incomplete = initiates.filter(i => !i.ceremonyDate || !i.badgeNumber);
        
        if (incomplete.length > 0) {
            Utils.showStatus(`Please ensure all selected initiates have ceremony dates and badge numbers. ${incomplete.length} initiate(s) missing required information.`, 'error');
            return;
        }
        
        // Validate badge numbers are greater than last badge
        if (appState.lastBadgeNumber !== null) {
            const invalidBadges = initiates.filter(i => {
                const badgeNum = parseInt(i.badgeNumber, 10);
                return badgeNum <= appState.lastBadgeNumber;
            });
            
            if (invalidBadges.length > 0) {
                Utils.showStatus(`Badge numbers must be greater than ${appState.lastBadgeNumber}. ${invalidBadges.length} initiate(s) have invalid badge numbers.`, 'error');
                return;
            }
        }
        
        // For now, just show what would be submitted
        console.log('Initiate verifications to submit:', initiates);
        Utils.showStatus(`Ready to submit ${initiates.length} initiate verification(s). (Submit functionality coming soon)`, 'info');
    }
    
    // Public API
    return {
        loadInitiates,
        reviewInitiateChanges,
        backToInitiates,
        submitInitiateVerifications
    };
})();

// Make it available globally
window.InitiatesModule = InitiatesModule;

// Also expose individual functions for backward compatibility
window.loadInitiates = InitiatesModule.loadInitiates;
window.reviewInitiateChanges = InitiatesModule.reviewInitiateChanges;
window.backToInitiates = InitiatesModule.backToInitiates;
window.submitInitiateVerifications = InitiatesModule.submitInitiateVerifications;