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
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        if (countSpan) countSpan.textContent = changes.length;
        
        if (tbody) {
            tbody.innerHTML = '';
            
            changes.forEach(change => {
                const row = tbody.insertRow();
                
                // Store the student data on the row for later retrieval
                row.studentData = {
                    id: change.id,
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
        Utils.hideElement('returning-review');
        Utils.showElement('returning-content');
        Utils.resizeIframe();
    }

    function submitReturningChanges() {
        // TODO: Implement submission logic later
        Utils.showStatus('Returning student submission functionality coming soon.', 'info');
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