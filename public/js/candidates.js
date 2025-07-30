// Verify Candidates Module for SN Chapter Management
const CandidatesModule = (function() {
    'use strict';
    
    // Reference to global state and utilities
    const appState = window.appState;
    const Utils = window.Utils;
    const API = window.API;
    const Queries = window.Queries;
    
    // Load candidates data
    async function loadCandidates() {
        console.log('=== loadCandidates() started ===');
        console.log('Chapter:', appState.chapter);
        
        if (!appState.chapter) {
            Utils.showError('candidates-error', 'No chapter specified. Please access this page with a chapter parameter.');
            console.error('No chapter parameter found');
            return;
        }

        // Show loading state
        console.log('Showing loading state...');
        Utils.showLoading('candidates-loading');
        Utils.hideElement('candidates-content');
        Utils.hideElement('candidates-error');

        try {
            // Use cached chapter data
            const chapterQuid = appState.chapterData?.quid;
            console.log('Chapter QUID from cache:', chapterQuid);
            
            if (!chapterQuid) {
                throw new Error(`Chapter QUID not found for ${appState.chapter}`);
            }

            // Build and execute query
            const queryRequest = Queries.buildCandidatesQuery(chapterQuid);
            const resultsData = await API.executeQuery(queryRequest, 'prospective_candidates');
            
            // Process results
            const candidates = processCandidatesResults(resultsData);
            console.log('Processed candidates:', candidates);
            
            // Display candidates
            displayCandidates(candidates);
            
        } catch (error) {
            console.error('Error loading candidates:', error);
            Utils.showError('candidates-error', `Failed to load candidates: ${error.message}`);
        }
    }

    function processCandidatesResults(results) {
        console.log('=== processCandidatesResults() started ===');
        console.log('Raw results:', results);
        
        const candidates = [];
        
        if (Array.isArray(results)) {
            console.log(`Processing ${results.length} candidates`);
            
            results.forEach((row, index) => {
                console.log(`Row ${index}:`, row);
                
                // Truncate codeId to last 5 digits
                let truncatedCodeId = row.CodeID || '';
                if (truncatedCodeId && truncatedCodeId.length > 5) {
                    truncatedCodeId = truncatedCodeId.slice(-5);
                }
                
                const candidate = {
                    id: row.ID || row.QRECID || row.id,
                    name: row.Name || row.name || 'N/A',
                    code: row.Code || '',
                    codeId: truncatedCodeId
                };
                
                console.log(`Candidate ${index}:`, candidate);
                candidates.push(candidate);
            });
        } else {
            console.warn('Unexpected results format:', results);
        }

        console.log(`Total candidates processed: ${candidates.length}`);
        return candidates;
    }

    function displayCandidates(candidates) {
        console.log('=== displayCandidates() started ===');
        console.log('Number of candidates to display:', candidates.length);
        
        const chapterSpan = document.getElementById('candidates-chapter');
        const countSpan = document.getElementById('candidates-count');
        const tbody = document.getElementById('candidates-tbody');
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        if (countSpan) countSpan.textContent = candidates.length;
        
        // Set up same date checkbox functionality
        setupSameDateCheckbox();
        
        // Clear existing rows
        if (tbody) {
            tbody.innerHTML = '';
            
            if (candidates.length === 0) {
                console.log('No candidates found - showing empty state');
                const row = tbody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 3; // Updated colspan for 3 columns
                cell.className = 'empty-state-cell';
                cell.textContent = 'No prospective candidates found for this chapter.';
            } else {
                console.log('Creating table rows for candidates...');
                candidates.forEach((candidate, index) => {
                    console.log(`Creating row ${index} for:`, candidate);
                    
                    const row = tbody.insertRow();
                    
                    // Store candidate ID, code, and codeId as data attributes
                    row.dataset.candidateId = candidate.id;
                    row.dataset.code = candidate.code;
                    row.dataset.codeId = candidate.codeId;
                    
                    // Name (single column)
                    const nameCell = row.insertCell();
                    nameCell.textContent = candidate.name || 'N/A';
                    
                    // Approve dropdown
                    const approveCell = row.insertCell();
                    
                    // Create a wrapper div for the select
                    const selectWrapper = document.createElement('div');
                    selectWrapper.className = 'select-wrapper';
                    
                    const approveSelect = document.createElement('select');
                    approveSelect.className = 'approval-select';
                    approveSelect.id = `approval-${index}`;
                    
                    // No Change option (default, blank value)
                    const noChangeOption = document.createElement('option');
                    noChangeOption.value = '';
                    noChangeOption.textContent = 'No Change';
                    noChangeOption.selected = true;
                    approveSelect.appendChild(noChangeOption);
                    
                    const approveOption = document.createElement('option');
                    approveOption.value = 'Candidate';
                    approveOption.textContent = 'Approve';
                    approveSelect.appendChild(approveOption);
                    
                    const disapproveOption = document.createElement('option');
                    disapproveOption.value = 'Disapproved';
                    disapproveOption.textContent = 'Disapprove';
                    approveSelect.appendChild(disapproveOption);
                    
                    const unknownOption = document.createElement('option');
                    unknownOption.value = 'Unknown';
                    unknownOption.textContent = 'Person Unknown';
                    approveSelect.appendChild(unknownOption);
                    
                    // Add change event listener
                    approveSelect.addEventListener('change', function() {
                        handleApprovalChange(index, this.value);
                        // Mark as having unsaved changes
                        if (window.setUnsavedChanges) {
                            window.setUnsavedChanges(true);
                        }
                    });
                    
                    selectWrapper.appendChild(approveSelect);
                    approveCell.appendChild(selectWrapper);
                    
                    // Candidate Ceremony Date
                    const dateCell = row.insertCell();
                    const dateInput = document.createElement('input');
                    dateInput.type = 'date';
                    dateInput.className = 'date-input';
                    dateInput.id = `ceremony-date-${index}`;
                    dateInput.disabled = true; // Initially disabled
                    
                    // Set max date to today
                    const today = new Date();
                    dateInput.max = today.toISOString().split('T')[0];
                    
                    dateCell.appendChild(dateInput);
                });
            }
        }
        
        // Show content
        console.log('Hiding loading state and showing content...');
        Utils.hideElement('candidates-loading');
        Utils.showElement('candidates-content');
        
        // Trigger resize
        Utils.resizeIframe();
        console.log('=== displayCandidates() completed ===');
    }

    function setupSameDateCheckbox() {
        const checkbox = document.getElementById('candidates-same-date-checkbox');
        const datePicker = document.getElementById('candidates-same-date-picker');
        
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
                    updateAllApprovedDates(this.value);
                }
            });
        }
    }
    
    function clearAllDateFields() {
        const tbody = document.getElementById('candidates-tbody');
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                const approvalSelect = document.getElementById(`approval-${index}`);
                const dateInput = document.getElementById(`ceremony-date-${index}`);
                
                if (approvalSelect && dateInput) {
                    // Only clear if approved
                    if (approvalSelect.value === 'Candidate') {
                        dateInput.value = '';
                    }
                }
            });
        }
    }
    
    function updateAllApprovedDates(date) {
        const tbody = document.getElementById('candidates-tbody');
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach((row, index) => {
                const approvalSelect = document.getElementById(`approval-${index}`);
                const dateInput = document.getElementById(`ceremony-date-${index}`);
                
                if (approvalSelect && dateInput) {
                    // Only update if approved
                    if (approvalSelect.value === 'Candidate') {
                        dateInput.value = date;
                    }
                }
            });
        }
    }

    function handleApprovalChange(index, approvalValue) {
        const dateInput = document.getElementById(`ceremony-date-${index}`);
        if (!dateInput) return;

        const sameDateCheckbox = document.getElementById('candidates-same-date-checkbox');
        const sameDatePicker = document.getElementById('candidates-same-date-picker');

        if (approvalValue === 'Candidate') {
            // Enable date picker for approved candidates
            dateInput.disabled = false;
            
            // If same date is checked and has a value, apply it
            if (sameDateCheckbox && sameDateCheckbox.checked && sameDatePicker && sameDatePicker.value) {
                dateInput.value = sameDatePicker.value;
            } else {
                dateInput.value = ''; // Clear any default value
            }
        } else if (approvalValue === '' || !approvalValue) {
            // No Change selected - disable and clear date
            dateInput.disabled = true;
            dateInput.value = '';
        } else {
            // Disapproved or Unknown - disable date picker and set to today's date in Eastern Time
            dateInput.disabled = true;
            
            // Get today's date in Eastern Time
            const easternTime = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
            const easternDate = new Date(easternTime);
            
            // Format as YYYY-MM-DD for input field
            const year = easternDate.getFullYear();
            const month = String(easternDate.getMonth() + 1).padStart(2, '0');
            const day = String(easternDate.getDate()).padStart(2, '0');
            
            dateInput.value = `${year}-${month}-${day}`;
        }
    }

    function reviewCandidateChanges() {
        // Get all candidate changes
        const changes = [];
        const tbody = document.getElementById('candidates-tbody');
        
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach((row, index) => {
                const candidateId = row.dataset.candidateId;
                if (candidateId) {
                    const approvalSelect = document.getElementById(`approval-${index}`);
                    const dateInput = document.getElementById(`ceremony-date-${index}`);
                    const nameCell = row.cells[0];
                    
                    if (approvalSelect && dateInput && approvalSelect.value !== '') {
                        changes.push({
                            id: candidateId,
                            code: row.dataset.code,
                            codeId: row.dataset.codeId,
                            name: nameCell.textContent,
                            approval: approvalSelect.value,
                            ceremonyDate: dateInput.value,
                            ceremonyDateFormatted: dateInput.value ? Utils.formatDateForDisplay(dateInput.value) : ''
                        });
                    }
                }
            });
        }
        
        if (changes.length === 0) {
            const message = 'No changes have been made. Please select approval status for at least one candidate.';
            alert(message);
            Utils.showStatus(message, 'error');
            return;
        }
        
        // Validate that all changed candidates have ceremony dates
        const incomplete = changes.filter(c => !c.ceremonyDate);
        
        if (incomplete.length > 0) {
            const message = `Please ensure all candidates have ceremony dates. ${incomplete.length} candidate(s) missing ceremony date.`;
            alert(message);
            Utils.showStatus(message, 'error');
            return;
        }
        
        // Display review table
        displayCandidateReview(changes);
    }

    function displayCandidateReview(changes) {
        const chapterSpan = document.getElementById('candidates-review-chapter');
        const countSpan = document.getElementById('candidates-review-count');
        const tbody = document.getElementById('candidates-review-tbody');
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        if (countSpan) countSpan.textContent = changes.length;
        
        if (tbody) {
            tbody.innerHTML = '';
            
            changes.forEach(change => {
                const row = tbody.insertRow();
                
                // Store the candidate data on the row for later retrieval
                row.candidateData = {
                    id: change.id,
                    code: change.code,
                    codeId: change.codeId
                };
                
                // Name
                const nameCell = row.insertCell();
                nameCell.textContent = change.name;
                
                // Approval Status
                const statusCell = row.insertCell();
                let statusText = change.approval;
                if (statusText === 'Candidate') statusText = 'Approve';
                else if (statusText === 'Disapproved') statusText = 'Disapprove';
                else if (statusText === 'Unknown') statusText = 'Person Unknown';
                statusCell.textContent = statusText;
                
                // Date
                const dateCell = row.insertCell();
                dateCell.textContent = change.ceremonyDateFormatted;
            });
        }
        
        // Hide main content, show review
        Utils.hideElement('candidates-content');
        Utils.showElement('candidates-review');
        Utils.resizeIframe();
    }

    function backToCandidates() {
        Utils.hideElement('candidates-review');
        Utils.showElement('candidates-content');
        Utils.resizeIframe();
    }

    function submitCandidateVerifications() {
        // Get all candidate data from the review table
        const tbody = document.getElementById('candidates-review-tbody');
        if (!tbody) {
            Utils.showStatus('No review data found. Please return to the main screen.', 'error');
            return;
        }
        
        const rows = tbody.querySelectorAll('tr');
        const candidates = [];
        
        // Collect all candidate data from review table
        rows.forEach((row) => {
            const nameCell = row.cells[0];
            const statusCell = row.cells[1];
            const dateCell = row.cells[2];
            
            // Store the candidate data that was saved during review
            const candidateData = row.candidateData;
            
            if (candidateData) {
                candidates.push({
                    id: candidateData.id,
                    code: candidateData.code,
                    codeId: candidateData.codeId,
                    name: nameCell.textContent,
                    approval: Utils.getApprovalValueFromText(statusCell.textContent),
                    ceremonyDate: Utils.getDateFromFormattedText(dateCell.textContent)
                });
            }
        });
        
        if (candidates.length === 0) {
            Utils.showStatus('No candidates found for submission.', 'error');
            return;
        }
        
        // Start the submission process
        submitCandidateChanges(candidates);
    }
    
    async function submitCandidateChanges(candidates) {
        console.log('=== submitCandidateChanges() started ===');
        console.log('Submitting changes for', candidates.length, 'candidates');
        
        // Get the submit section and create spinner
        const submitSection = document.querySelector('#candidates-review .submit-section');
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
            
            // Process each candidate
            for (const candidate of candidates) {
                try {
                    await processCandidateSubmission(candidate, chapterData);
                    successCount++;
                } catch (error) {
                    console.error(`Error processing candidate ${candidate.name}:`, error);
                    errorCount++;
                    errors.push(`${candidate.name}: ${error.message}`);
                }
            }
            
            // Show results
            if (errorCount === 0) {
                // Hide the review table before showing success message
                Utils.hideElement('candidates-review');
                
                // Create a temporary success message div
                const successDiv = document.createElement('div');
                successDiv.className = 'submission-success-overlay';
                successDiv.innerHTML = `
                    <div class="submission-success">
                        <p>Successfully processed all ${successCount} candidate(s).</p>
                    </div>
                `;
                document.querySelector('.container').appendChild(successDiv);
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
                        <p>Processed ${successCount} candidate(s) with ${errorCount} error(s).</p>
                        <p>Errors encountered:</p>
                        <ul class="error-list">
                            ${errors.map(err => `<li>${err}</li>`).join('')}
                        </ul>
                        <p>Please retry submission. If the problem persists, email <a href="mailto:members.area@sigmanu.org">members.area@sigmanu.org</a> with the error message above.</p>
                        <button class="btn" onclick="CandidatesModule.backToCandidates()">Back</button>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Fatal error during submission:', error);
            
            // Show error message with email instructions
            submitSection.innerHTML = `
                <div class="submission-error">
                    <p>Submission failed: ${error.message}</p>
                    <p>Please retry submission. If the problem persists, email <a href="mailto:members.area@sigmanu.org">members.area@sigmanu.org</a> with the error message above.</p>
                    <button class="btn" onclick="CandidatesModule.backToCandidates()">Back</button>
                </div>
            `;
        }
    }
    
    async function processCandidateSubmission(candidate, chapterData) {
        console.log(`Processing candidate: ${candidate.name}`);
        
        // Step 1: Parse ceremony date
        const [year, month, day] = candidate.ceremonyDate.split('-');
        const startDate = {
            d: parseInt(day, 10),
            m: parseInt(month, 10),
            y: parseInt(year, 10)
        };
        
        // Get current date in Eastern Time - use let instead of const
        let easternTime = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
        let easternDate = new Date(easternTime);
        const currentDateISO = `${easternDate.getFullYear()}-${String(easternDate.getMonth() + 1).padStart(2, '0')}-${String(easternDate.getDate()).padStart(2, '0')}T00:00:00Z`;
        
        // Step 2: Delete existing constituent code
        console.log(`Deleting code: ${candidate.codeId}`);
        const deleteResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=delete-constituent-code&endpoint=/constituent/v1/constituentcodes/${candidate.codeId}`,
            'DELETE'
        );
        
        console.log('Delete response:', deleteResponse);
        
        // Step 3: Create new constituent code
        console.log(`Creating new code: ${candidate.approval}`);
        const codeData = {
            constituent_id: candidate.id,
            description: candidate.approval,
            start: startDate
        };
        
        const createCodeResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-constituent-code',
            'POST',
            codeData
        );
        
        console.log('Create code response:', createCodeResponse);
        
        
        // Step 4: Create constituent note
        console.log('Creating note');
        // Reuse the existing easternTime and easternDate variables
        easternTime = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
        easternDate = new Date(easternTime);
        const currentDate = {
            d: easternDate.getDate(),
            m: easternDate.getMonth() + 1,
            y: easternDate.getFullYear()
        };
        
        const noteData = {
            constituent_id: candidate.id,
            date: currentDate,
            text: `Changed to ${candidate.approval} by ${appState.offname || 'Unknown'}`,
            type: "CodeLog"
        };
        
        const createNoteResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-constituent-note',
            'POST',
            noteData
        );
        
        console.log('Create note response:', createNoteResponse);
        
        // Step 5: If approved (Candidate), continue with relationship and custom fields
        if (candidate.approval === 'Candidate') {
            console.log('Candidate approved - creating relationship and custom fields');
            
            // Step 6: Create constituent relationship
            const relationshipData = {
                comment: `Added by ${appState.offname || 'Unknown'}`,
                constituent_id: candidate.id,
                is_organization_contact: false,
                is_primary_business: false,
                is_spouse: false,
                reciprocal_type: "Candidate",
                relation_id: chapterData.csid,
                start: startDate,
                type: "Collegiate Chapter"
            };
            
            const createRelationshipResponse = await API.makeRateLimitedApiCall(
                '/api/blackbaud?action=create-constituent-relationship',
                'POST',
                relationshipData
            );
            
            console.log('Create relationship response:', createRelationshipResponse);
            
            // Step 7: Create custom fields
            const customFields = [
                {
                    category: "Candidate - Ceremony Date",
                    date: currentDateISO,
                    value: `${candidate.ceremonyDate}T00:00:00Z`
                },
                {
                    category: "Candidate - Fee Paid",
                    comment: chapterData.feid,
                    date: currentDateISO,
                    value: ""
                },
                {
                    category: "Candidate - Complete Date",
                    date: currentDateISO,
                    value: ""
                },
                {
                    category: "Sigma Nu Code",
                    value: "Candidate"
                }
            ];
            
            const createFieldsResponse = await API.makeRateLimitedApiCall(
                '/api/blackbaud?action=create-custom-fields',
                'POST',
                {
                    constituentId: candidate.id,
                    fields: customFields
                }
            );
            
            console.log('Create custom fields response:', createFieldsResponse);
        }
        
        console.log(`Successfully processed candidate: ${candidate.name}`);
    }
    
    // Public API
    return {
        loadCandidates,
        reviewCandidateChanges,
        backToCandidates,
        submitCandidateVerifications
    };
})();

// Make it available globally
window.CandidatesModule = CandidatesModule;

// Also expose individual functions for backward compatibility
window.loadCandidates = CandidatesModule.loadCandidates;
window.reviewCandidateChanges = CandidatesModule.reviewCandidateChanges;
window.backToCandidates = CandidatesModule.backToCandidates;
window.submitCandidateVerifications = CandidatesModule.submitCandidateVerifications;