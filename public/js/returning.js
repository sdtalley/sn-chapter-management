// Returning Students Module for SN Chapter Management
const ReturningModule = (function() {
    'use strict';
    
    // Reference to global state and utilities
    const appState = window.appState;
    const Utils = window.Utils;
    const API = window.API;
    const Queries = window.Queries;
    
    // Load returning students data
    async function loadReturningStudents() {
        console.log('=== loadReturningStudents() started ===');
        console.log('Chapter:', appState.chapter);
        
        if (!appState.chapter) {
            Utils.showReturningError('No chapter specified. Please access this page with a chapter parameter.');
            console.error('No chapter parameter found');
            return;
        }

        // Show loading state
        console.log('Showing loading state...');
        Utils.showLoading('returning-loading');
        Utils.hideElement('returning-content');
        Utils.hideElement('returning-error');

        try {
            // Use cached chapter data
            const chapterQuid = appState.chapterData?.quid;
            console.log('Chapter QUID from cache:', chapterQuid);
            
            if (!chapterQuid) {
                throw new Error(`Chapter QUID not found for ${appState.chapter}`);
            }

            // Build and execute query
            const queryRequest = Queries.buildReturningStudentsQuery(chapterQuid, appState.chapter);
            const resultsData = await API.executeQuery(queryRequest, 'returning_students');
            
            // Process results
            const returningStudents = processReturningResults(resultsData);
            console.log('Processed returning students:', returningStudents);
            
            // Display returning students
            displayReturningStudents(returningStudents);
            
        } catch (error) {
            console.error('Error loading returning students:', error);
            Utils.showReturningError(`Failed to load returning students: ${error.message}`);
        }
    }

    function processReturningResults(results) {
        console.log('=== processReturningResults() started ===');
        console.log('Raw results:', results);
        
        const returningStudents = [];
        
        if (Array.isArray(results)) {
            console.log(`Processing ${results.length} returning students`);
            
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
                
                const student = {
                    id: row.ID || row.QRECID || row.id,
                    name: row.Name || row.name || 'N/A',
                    code: row.Code || 'Unknown',
                    fromDate: row.From_Date || '',
                    relationId: truncatedRelationId,
                    codeId: truncatedCodeId,
                    recip: row.Recip || '',
                    candidateFeePaid: row.Candidate_Fee_Paid || 'No',
                    initiateFeePaid: row.Initiate_Fee_Paid || 'No'
                };
                
                console.log(`Returning student ${index}:`, student);
                returningStudents.push(student);
            });
        } else {
            console.warn('Unexpected results format:', results);
        }

        console.log(`Total returning students processed: ${returningStudents.length}`);
        return returningStudents;
    }

    function displayReturningStudents(returningStudents) {
        console.log('=== displayReturningStudents() started ===');
        console.log('Number of returning students to display:', returningStudents.length);
        
        const chapterSpan = document.getElementById('returning-chapter');
        const alumniCountSpan = document.getElementById('returning-alumni-count');
        const depledgeCountSpan = document.getElementById('returning-depledge-count');
        const tbody = document.getElementById('returning-tbody');
        
        // Count alumni and de-pledges
        let alumniCount = 0;
        let depledgeCount = 0;
        returningStudents.forEach(student => {
            if (student.code === 'Alumni (Left School)') {
                alumniCount++;
            } else if (student.code === 'De-Pledge') {
                depledgeCount++;
            }
        });
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        if (alumniCountSpan) alumniCountSpan.textContent = alumniCount;
        if (depledgeCountSpan) depledgeCountSpan.textContent = depledgeCount;
        
        // Clear existing rows
        if (tbody) {
            tbody.innerHTML = '';
            
            if (returningStudents.length === 0) {
                console.log('No returning students found - showing empty state');
                const row = tbody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 5;
                cell.className = 'empty-state-cell';
                cell.textContent = 'No returning students found for this chapter.';
            } else {
                console.log('Creating table rows for returning students...');
                returningStudents.forEach((student, index) => {
                    console.log(`Creating row ${index} for:`, student);
                    
                    const row = tbody.insertRow();
                    
                    // Store student data as attributes
                    row.dataset.studentId = student.id;
                    row.dataset.studentCode = student.code;
                    row.dataset.codeId = student.codeId;
                    row.dataset.relationId = student.relationId;
                    row.dataset.fromDate = student.fromDate;
                    row.dataset.candidateFeePaid = student.candidateFeePaid;
                    row.dataset.initiateFeePaid = student.initiateFeePaid;
                    
                    // Name
                    const nameCell = row.insertCell();
                    nameCell.textContent = student.name || 'N/A';
                    
                    // Current Status
                    const currentCell = row.insertCell();
                    currentCell.textContent = student.code;
                    
                    // From Date
                    const fromDateCell = row.insertCell();
                    fromDateCell.textContent = Utils.formatDateForDisplay(student.fromDate);
                    
                    // Status dropdown
                    const statusCell = row.insertCell();
                    const selectWrapper = document.createElement('div');
                    selectWrapper.className = 'select-wrapper';
                    
                    const statusSelect = document.createElement('select');
                    statusSelect.className = 'status-select';
                    statusSelect.id = `returning-status-${index}`;
                    
                    // Default option
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'No Change';
                    defaultOption.selected = true;
                    statusSelect.appendChild(defaultOption);
                    
                    if (student.code === 'De-Pledge') {
                        // De-Pledge can only become Candidate
                        const candidateOption = document.createElement('option');
                        candidateOption.value = 'Candidate';
                        candidateOption.textContent = 'Candidate';
                        statusSelect.appendChild(candidateOption);
                    } else if (student.code === 'Alumni (Left School)') {
                        // Alumni (Left School) can become Initiate
                        const initiateOption = document.createElement('option');
                        initiateOption.value = 'Initiate';
                        initiateOption.textContent = 'Initiate';
                        statusSelect.appendChild(initiateOption);
                        
                        // Check fee status to determine if Alumni (Graduated) option should be shown
                        const bothFeesPaid = student.candidateFeePaid === 'Yes' && student.initiateFeePaid === 'Yes';
                        
                        if (bothFeesPaid) {
                            // Both fees paid - show Alumni (Graduated) option
                            const alumniGradOption = document.createElement('option');
                            alumniGradOption.value = 'Alumni';
                            alumniGradOption.textContent = 'Alumni (Graduated)';
                            statusSelect.appendChild(alumniGradOption);
                        } else {
                            // Fees unpaid - add tooltip to the select wrapper
                            selectWrapper.title = 'Alumni (Graduated) option unavailable - unpaid fees';
                            selectWrapper.style.cursor = 'help';
                            
                            // Add a visual indicator (question mark) after the dropdown
                            const indicator = document.createElement('span');
                            indicator.textContent = ' ?';
                            indicator.style.color = '#6c757d';
                            indicator.style.fontSize = '14px';
                            indicator.style.marginLeft = '5px';
                            indicator.title = 'Alumni (Graduated) option requires both Candidate and Initiate fees to be paid';
                            selectWrapper.appendChild(indicator);
                        }
                    }
                    
                    // Add change event listener
                    statusSelect.addEventListener('change', function() {
                        handleReturningStatusChange(index, this.value);
                    });
                    
                    selectWrapper.appendChild(statusSelect);
                    statusCell.appendChild(selectWrapper);
                    
                    // Effective Date picker
                    const dateCell = row.insertCell();
                    const dateInput = document.createElement('input');
                    dateInput.type = 'date';
                    dateInput.className = 'date-input';
                    dateInput.id = `returning-date-${index}`;
                    dateInput.disabled = true; // Initially disabled
                    
                    // Set max date to today
                    const today = new Date();
                    dateInput.max = today.toISOString().split('T')[0];
                    
                    // Set min date to day after from date if it exists
                    if (student.fromDate) {
                        const fromDate = Utils.parseDate(student.fromDate);
                        if (fromDate) {
                            fromDate.setDate(fromDate.getDate() + 1);
                            dateInput.min = fromDate.toISOString().split('T')[0];
                        }
                    }
                    
                    dateCell.appendChild(dateInput);
                });
            }
        }
        
        // Show content
        console.log('Hiding loading state and showing content...');
        Utils.hideElement('returning-loading');
        Utils.showElement('returning-content');
        
        // Trigger resize
        Utils.resizeIframe();
        console.log('=== displayReturningStudents() completed ===');
    }

    function handleReturningStatusChange(index, statusValue) {
        const dateInput = document.getElementById(`returning-date-${index}`);
        if (!dateInput) return;

        if (statusValue && statusValue !== '') {
            // Enable date picker when status is selected
            dateInput.disabled = false;
            dateInput.value = ''; // Clear any default value
        } else {
            // Disable and clear date when "No Change" is selected
            dateInput.disabled = true;
            dateInput.value = '';
        }
    }

    function reviewReturningChanges() {
        // Get all returning student changes
        const changes = [];
        const tbody = document.getElementById('returning-tbody');
        
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach((row, index) => {
                const studentId = row.dataset.studentId;
                if (studentId) {
                    const statusSelect = document.getElementById(`returning-status-${index}`);
                    const dateInput = document.getElementById(`returning-date-${index}`);
                    const nameCell = row.cells[0];
                    const currentStatusCell = row.cells[1];
                    
                    if (statusSelect && statusSelect.value && statusSelect.value !== '' && dateInput) {
                        const selectedOption = statusSelect.options[statusSelect.selectedIndex];
                        
                        changes.push({
                            id: studentId,
                            name: nameCell.textContent,
                            currentStatus: currentStatusCell.textContent,
                            newStatus: statusSelect.value,
                            newStatusText: selectedOption.textContent,
                            effectiveDate: dateInput.value,
                            effectiveDateFormatted: dateInput.value ? Utils.formatDateForDisplay(dateInput.value) : '',
                            codeId: row.dataset.codeId,
                            relationId: row.dataset.relationId,
                            fromDate: row.dataset.fromDate,
                            candidateFeePaid: row.dataset.candidateFeePaid,
                            initiateFeePaid: row.dataset.initiateFeePaid
                        });
                    }
                }
            });
        }
        
        if (changes.length === 0) {
            const message = 'No changes have been made. Please select a status for at least one student.';
            alert(message);
            Utils.showStatus(message, 'error');
            return;
        }
        
        // Validate that all changes have dates
        const incomplete = changes.filter(c => !c.effectiveDate);
        
        if (incomplete.length > 0) {
            const message = `Please ensure all status changes have effective dates. ${incomplete.length} student(s) missing date.`;
            alert(message);
            Utils.showStatus(message, 'error');
            return;
        }
        
        // Display review table
        displayReturningReview(changes);
    }

    function displayReturningReview(changes) {
        const chapterSpan = document.getElementById('returning-review-chapter');
        const countSpan = document.getElementById('returning-review-count');
        const tbody = document.getElementById('returning-review-tbody');
        const submitSection = document.querySelector('#returning-review .submit-section');
        
        // IMPORTANT: Reset submit section to ensure no spinner is showing
        if (submitSection) {
            submitSection.innerHTML = `
                <button class="btn" onclick="ReturningModule.backToReturning()">Back</button>
                <button class="btn" onclick="ReturningModule.submitReturningChanges()">Submit</button>
            `;
        }
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        if (countSpan) countSpan.textContent = changes.length;
        
        if (tbody) {
            tbody.innerHTML = '';
            
            changes.forEach(change => {
                const row = tbody.insertRow();
                
                // Store the student data on the row for later retrieval
                row.studentData = {
                    id: change.id,
                    name: change.name,
                    currentStatus: change.currentStatus,
                    newStatus: change.newStatus,
                    effectiveDate: change.effectiveDate,
                    codeId: change.codeId,
                    relationId: change.relationId,
                    fromDate: change.fromDate,
                    candidateFeePaid: change.candidateFeePaid,
                    initiateFeePaid: change.initiateFeePaid
                };
                
                // Name
                const nameCell = row.insertCell();
                nameCell.textContent = change.name;
                
                // Current Status
                const currentCell = row.insertCell();
                currentCell.textContent = change.currentStatus;
                
                // New Status
                const newStatusCell = row.insertCell();
                newStatusCell.textContent = change.newStatusText;
                
                // Effective Date
                const dateCell = row.insertCell();
                dateCell.textContent = change.effectiveDateFormatted;
            });
        }
        
        // Hide main content, show review
        Utils.hideElement('returning-content');
        Utils.showElement('returning-review');
        Utils.resizeIframe();
    }

    function backToReturning() {
        // Clear any pending state
        delete appState.pendingReturningStudents;
        
        // Reset submit section to ensure no spinner
        const submitSection = document.querySelector('#returning-review .submit-section');
        if (submitSection) {
            submitSection.innerHTML = `
                <button class="btn" onclick="ReturningModule.backToReturning()">Back</button>
                <button class="btn" onclick="ReturningModule.submitReturningChanges()">Submit</button>
            `;
        }
        
        Utils.hideElement('returning-review');
        Utils.showElement('returning-content');
        Utils.resizeIframe();
    }

    function submitReturningChanges() {
        // Get all student data from the review table
        const tbody = document.getElementById('returning-review-tbody');
        if (!tbody) {
            Utils.showStatus('No review data found. Please return to the main screen.', 'error');
            return;
        }
        
        const rows = tbody.querySelectorAll('tr');
        const students = [];
        
        // Collect all student data from review table
        rows.forEach((row) => {
            // Store the student data that was saved during review
            const studentData = row.studentData;
            
            if (studentData) {
                students.push({
                    id: studentData.id,
                    name: studentData.name,
                    currentStatus: studentData.currentStatus,
                    newStatus: studentData.newStatus,
                    effectiveDate: studentData.effectiveDate,
                    codeId: studentData.codeId,
                    relationId: studentData.relationId,
                    fromDate: studentData.fromDate,
                    candidateFeePaid: studentData.candidateFeePaid,
                    initiateFeePaid: studentData.initiateFeePaid
                });
            }
        });
        
        if (students.length === 0) {
            Utils.showStatus('No students found for submission.', 'error');
            return;
        }
        
        // Store pending students in case of retry
        appState.pendingReturningStudents = students;
        
        // Start the submission process
        submitReturningStudentChanges(students);
    }
    
    async function submitReturningStudentChanges(students) {
        console.log('=== submitReturningStudentChanges() started ===');
        console.log('Submitting changes for', students.length, 'students');
        
        // Get the submit section and create spinner
        const submitSection = document.querySelector('#returning-review .submit-section');
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
            
            // Process each student
            for (const student of students) {
                try {
                    await processReturningStudentSubmission(student, chapterData);
                    successCount++;
                } catch (error) {
                    console.error(`Error processing student ${student.name}:`, error);
                    errorCount++;
                    errors.push(`${student.name}: ${error.message}`);
                }
            }
            
            // Show results
            if (errorCount === 0) {
                // Hide the review table before showing success message
                Utils.hideElement('returning-review');
                
                // Create a temporary success message div
                const successDiv = document.createElement('div');
                successDiv.className = 'submission-success-overlay';
                successDiv.innerHTML = `
                    <div class="submission-success">
                        <p>Successfully processed all ${successCount} returning student(s).</p>
                    </div>
                `;
                document.querySelector('.container').appendChild(successDiv);
                
                // Clear pending students
                delete appState.pendingReturningStudents;
                
                // Wait 2 seconds then return to main menu
                setTimeout(() => {
                    successDiv.remove();
                    window.showMainMenu();
                }, 2000);
            } else {
                // Show error message with retry instructions
                submitSection.innerHTML = `
                    <div class="submission-error">
                        <p>Processed ${successCount} student(s) with ${errorCount} error(s).</p>
                        <p>Errors encountered:</p>
                        <ul class="error-list">
                            ${errors.map(err => `<li>${err}</li>`).join('')}
                        </ul>
                        <p>Please retry submission. If the problem persists, email <a href="mailto:members.area@sigmanu.org">members.area@sigmanu.org</a> with the error message above.</p>
                        <button class="btn" onclick="ReturningModule.backToReturning()">Back</button>
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
                    <button class="btn" onclick="ReturningModule.backToReturning()">Back</button>
                </div>
            `;
        }
    }
    
    async function processReturningStudentSubmission(student, chapterData) {
        console.log(`Processing returning student: ${student.name}`);
        
        // Step 1: Parse effective date
        const [year, month, day] = student.effectiveDate.split('-');
        const startDate = {
            d: parseInt(day, 10),
            m: parseInt(month, 10),
            y: parseInt(year, 10)
        };
        
        // Step 2: Parse from date
        let cstartDate = null;
        if (student.fromDate) {
            const fromDate = Utils.parseDate(student.fromDate);
            if (fromDate) {
                cstartDate = {
                    d: fromDate.getDate(),
                    m: fromDate.getMonth() + 1,
                    y: fromDate.getFullYear()
                };
            }
        }
        
        // Step 3: Calculate end date (effective date - 1 day)
        // Parse the date components directly to avoid timezone issues
        const [eYear, eMonth, eDay] = student.effectiveDate.split('-');
        const effectiveDateParsed = new Date(parseInt(eYear), parseInt(eMonth) - 1, parseInt(eDay));
        
        // Calculate end date (1 day before effective date)
        const endDateObj = new Date(effectiveDateParsed);
        endDateObj.setDate(endDateObj.getDate() - 1);
        
        const endDate = {
            d: endDateObj.getDate(),
            m: endDateObj.getMonth() + 1,
            y: endDateObj.getFullYear()
        };
        
        // Get current date in Eastern Time - use let instead of const
        let easternTime = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
        let easternDate = new Date(easternTime);
        const currentDate = {
            d: easternDate.getDate(),
            m: easternDate.getMonth() + 1,
            y: easternDate.getFullYear()
        };
        const currentDateFormatted = `${String(easternDate.getMonth() + 1).padStart(2, '0')}/${String(easternDate.getDate()).padStart(2, '0')}/${easternDate.getFullYear()}`;
        
        // Step 4: PATCH existing relationship to close it
        console.log(`Updating relationship to closed: ${student.relationId}`);
        const patchRelationshipData = {
            comment: `Updated on ${currentDateFormatted} by ${appState.offname || 'Unknown'}`,
            end: endDate
        };
        
        const patchRelResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=patch-relationship&endpoint=/constituent/v1/relationships/${student.relationId}&method=PATCH`,
            'POST',
            patchRelationshipData
        );
        
        console.log('Patch relationship response:', patchRelResponse);
        
        // Step 5: Delete existing constituent code
        console.log(`Deleting code: ${student.codeId}`);
        const deleteCodeResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=delete-constituent-code&endpoint=/constituent/v1/constituentcodes/${student.codeId}`,
            'DELETE'
        );
        
        console.log('Delete code response:', deleteCodeResponse);
        
        // Step 6: Create new constituent code
        console.log(`Creating new code: ${student.newStatus}`);
        const codeData = {
            constituent_id: student.id,
            description: student.newStatus,
            start: startDate
        };
        
        const createCodeResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-constituent-code',
            'POST',
            codeData
        );
        
        console.log('Create code response:', createCodeResponse);
        
        // Step 7: Create constituent note
        console.log('Creating note');
        const noteData = {
            constituent_id: student.id,
            date: currentDate,
            text: `Changed to ${student.newStatus} by ${appState.offname || 'Unknown'}`,
            type: "CodeLog"
        };
        
        const createNoteResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-constituent-note',
            'POST',
            noteData
        );
        
        console.log('Create note response:', createNoteResponse);
        
        // Step 8: Get custom fields to find Sigma Nu Code ID
        console.log('Getting custom fields to find Sigma Nu Code ID');
        const customFieldsResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=get-custom-fields&constituentId=${student.id}`,
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
        
        // Step 9: Update Sigma Nu Code custom field
        console.log('Updating Sigma Nu Code');
        const updateSNCData = {
            value: student.newStatus
        };
        
        const updateSNCResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=patch-custom-field&endpoint=/constituent/v1/constituents/customfields/${snAttId}&method=PATCH`,
            'POST',
            updateSNCData
        );
        
        console.log('Update SNC response:', updateSNCResponse);
        
        // Step 10: Create new relationship based on status
        if (student.newStatus === 'Alumni') {
            // Step 10A: Create Alumni relationship with do_not_reciprocate
            console.log('Creating Alumni relationship');
            const alumniRelationshipData = {
                comment: `Added ${currentDateFormatted} by ${appState.offname || 'Unknown'}`,
                constituent_id: student.id,
                is_organization_contact: false,
                is_primary_business: false,
                is_spouse: false,
                do_not_reciprocate: true,
                reciprocal_type: student.newStatus,
                relation_id: chapterData.csid,
                start: startDate,
                type: "Collegiate Chapter"
            };
            
            const createAlumniRelResponse = await API.makeRateLimitedApiCall(
                '/api/blackbaud?action=create-constituent-relationship',
                'POST',
                alumniRelationshipData
            );
            
            console.log('Create alumni relationship response:', createAlumniRelResponse);
        } else {
            // Step 10B: Create other relationship types
            console.log(`Creating ${student.newStatus} relationship`);
            const relationshipData = {
                comment: `Added ${currentDateFormatted} by ${appState.offname || 'Unknown'}`,
                constituent_id: student.id,
                is_organization_contact: false,
                is_primary_business: false,
                is_spouse: false,
                reciprocal_type: student.newStatus,
                relation_id: chapterData.csid,
                start: startDate,
                type: "Collegiate Chapter"
            };
            
            const createRelResponse = await API.makeRateLimitedApiCall(
                '/api/blackbaud?action=create-constituent-relationship',
                'POST',
                relationshipData
            );
            
            console.log('Create relationship response:', createRelResponse);
        }
        
        console.log(`Successfully processed returning student: ${student.name}`);
    }
    
    // Public API
    return {
        loadReturningStudents,
        reviewReturningChanges,
        backToReturning,
        submitReturningChanges
    };
})();

// Make it available globally
window.ReturningModule = ReturningModule;

// Also expose individual functions for backward compatibility
window.loadReturningStudents = ReturningModule.loadReturningStudents;
window.reviewReturningChanges = ReturningModule.reviewReturningChanges;
window.backToReturning = ReturningModule.backToReturning;
window.submitReturningChanges = ReturningModule.submitReturningChanges;