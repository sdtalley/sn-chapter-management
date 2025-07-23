// Roster Information Module for SN Chapter Management
const RosterModule = (function() {
    'use strict';
    
    // Reference to global state and utilities
    const appState = window.appState;
    const Utils = window.Utils;
    const API = window.API;
    const Queries = window.Queries;
    
    // Load roster data
    async function loadRoster() {
        console.log('=== loadRoster() started ===');
        console.log('Chapter:', appState.chapter);
        
        if (!appState.chapter) {
            Utils.showRosterError('No chapter specified. Please access this page with a chapter parameter.');
            console.error('No chapter parameter found');
            return;
        }

        // Show loading state
        console.log('Showing loading state...');
        Utils.showLoading('roster-loading');
        Utils.hideElement('roster-content');
        Utils.hideElement('roster-error');

        try {
            // Use cached chapter data
            const chapterQuid = appState.chapterData?.quid;
            console.log('Chapter QUID from cache:', chapterQuid);
            
            if (!chapterQuid) {
                throw new Error(`Chapter QUID not found for ${appState.chapter}`);
            }

            // Build and execute query
            const queryRequest = Queries.buildRosterQuery(chapterQuid, appState.chapter);
            const resultsData = await API.executeQuery(queryRequest, 'roster');
            
            // Process results
            const roster = processRosterResults(resultsData);
            console.log('Processed roster:', roster);
            
            // Display roster
            displayRoster(roster);
            
        } catch (error) {
            console.error('Error loading roster:', error);
            Utils.showRosterError(`Failed to load roster: ${error.message}`);
        }
    }

    function processRosterResults(results) {
        console.log('=== processRosterResults() started ===');
        console.log('Raw results:', results);
        
        const roster = [];
        
        if (Array.isArray(results)) {
            console.log(`Processing ${results.length} roster members`);
            
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
                
                const member = {
                    id: row.ID || row.QRECID || row.id,
                    name: row.Name || row.name || 'N/A',
                    status: row.Code || row.Status || 'Unknown',
                    fromDate: row.From_Date || '',
                    relationId: truncatedRelationId,
                    candidateFeePaid: row.Candidate_Fee_Paid || 'No',
                    initiateFeePaid: row.Initiate_Fee_Paid || 'No',
                    codeId: truncatedCodeId
                };
                
                console.log(`Member ${index}:`, member);
                roster.push(member);
            });
        } else {
            console.warn('Unexpected results format:', results);
        }

        console.log(`Total roster members processed: ${roster.length}`);
        return roster;
    }

    function displayRoster(roster) {
        console.log('=== displayRoster() started ===');
        console.log('Number of members to display:', roster.length);
        
        const chapterSpan = document.getElementById('roster-chapter');
        const candidatesCountSpan = document.getElementById('roster-candidates-count');
        const initiatesCountSpan = document.getElementById('roster-initiates-count');
        const tbody = document.getElementById('roster-tbody');
        
        // Count candidates and initiates
        let candidatesCount = 0;
        let initiatesCount = 0;
        roster.forEach(member => {
            if (member.status === '5707' || member.status === 'Candidate') {
                candidatesCount++;
            } else if (member.status === '5708' || member.status === 'Initiate') {
                initiatesCount++;
            }
        });
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        if (candidatesCountSpan) candidatesCountSpan.textContent = candidatesCount;
        if (initiatesCountSpan) initiatesCountSpan.textContent = initiatesCount;
        
        // Clear existing rows
        if (tbody) {
            tbody.innerHTML = '';
            
            if (roster.length === 0) {
                console.log('No members found - showing empty state');
                const row = tbody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 5;
                cell.className = 'empty-state-cell';
                cell.textContent = 'No members found for this chapter.';
            } else {
                console.log('Creating table rows for roster...');
                roster.forEach((member, index) => {
                    console.log(`Creating row ${index} for:`, member);
                    
                    const row = tbody.insertRow();
                    
                    // Store member data as attributes
                    row.dataset.memberId = member.id;
                    row.dataset.memberStatus = member.status;
                    row.dataset.candidateFeePaid = member.candidateFeePaid;
                    row.dataset.initiateFeePaid = member.initiateFeePaid;
                    row.dataset.codeId = member.codeId;
                    row.dataset.relationId = member.relationId;
                    
                    // Name
                    const nameCell = row.insertCell();
                    nameCell.textContent = member.name || 'N/A';
                    
                    // Current Status
                    const currentCell = row.insertCell();
                    currentCell.textContent = member.status === '5707' || member.status === 'Candidate' ? 'Candidate' : 
                                            member.status === '5708' || member.status === 'Initiate' ? 'Initiate' : 
                                            member.status;
                    
                    // From Date
                    const fromDateCell = row.insertCell();
                    fromDateCell.textContent = Utils.formatDateForDisplay(member.fromDate);
                    
                    // Status dropdown
                    const statusCell = row.insertCell();
                    
                    // Determine if dropdown should be shown
                    const isCandidate = member.status === '5707' || member.status === 'Candidate';
                    const isInitiate = member.status === '5708' || member.status === 'Initiate';
                    const candidateFeeUnpaid = isCandidate && member.candidateFeePaid !== 'Yes';
                    const feesUnpaid = isInitiate && (member.candidateFeePaid !== 'Yes' || member.initiateFeePaid !== 'Yes');
                    
                    if (candidateFeeUnpaid) {
                        statusCell.textContent = '-';
                        statusCell.title = 'Candidate Fee Unpaid';
                        statusCell.style.cursor = 'help';
                    } else {
                        const selectWrapper = document.createElement('div');
                        selectWrapper.className = 'select-wrapper';
                        
                        const statusSelect = document.createElement('select');
                        statusSelect.className = 'status-select';
                        statusSelect.id = `status-${index}`;
                        
                        // Default option
                        const defaultOption = document.createElement('option');
                        defaultOption.value = '';
                        defaultOption.textContent = 'No Change';
                        defaultOption.selected = true;
                        statusSelect.appendChild(defaultOption);
                        
                        if (isCandidate) {
                            // Candidate options
                            const depledgeOption = document.createElement('option');
                            depledgeOption.value = 'De-Pledge';
                            depledgeOption.textContent = 'De-pledge';
                            statusSelect.appendChild(depledgeOption);
                        } else if (isInitiate) {
                            if (feesUnpaid) {
                                // Limited options for unpaid fees
                                selectWrapper.title = 'Fee(s) Unpaid';
                                
                                const suspendedOption = document.createElement('option');
                                suspendedOption.value = 'Proposed Suspended';
                                suspendedOption.textContent = 'Proposed Suspended';
                                statusSelect.appendChild(suspendedOption);
                                
                                const expelledOption = document.createElement('option');
                                expelledOption.value = 'Proposed Expelled';
                                expelledOption.textContent = 'Proposed Expelled';
                                statusSelect.appendChild(expelledOption);
                            } else {
                                // Full options for paid fees
                                const alumniLeftOption = document.createElement('option');
                                alumniLeftOption.value = 'Alumni (Left School)';
                                alumniLeftOption.textContent = 'Alumni (Left-School)';
                                statusSelect.appendChild(alumniLeftOption);
                                
                                const alumniGradOption = document.createElement('option');
                                alumniGradOption.value = 'Alumni';
                                alumniGradOption.textContent = 'Alumni (Graduated)';
                                statusSelect.appendChild(alumniGradOption);
                                
                                const suspendedOption = document.createElement('option');
                                suspendedOption.value = 'Proposed Suspended';
                                suspendedOption.textContent = 'Proposed Suspended';
                                statusSelect.appendChild(suspendedOption);
                                
                                const expelledOption = document.createElement('option');
                                expelledOption.value = 'Proposed Expelled';
                                expelledOption.textContent = 'Proposed Expelled';
                                statusSelect.appendChild(expelledOption);
                            }
                        }
                        
                        // Add change event listener
                        statusSelect.addEventListener('change', function() {
                            handleRosterStatusChange(index, this.value);
                        });
                        
                        selectWrapper.appendChild(statusSelect);
                        statusCell.appendChild(selectWrapper);
                    }
                    
                    // Date picker
                    const dateCell = row.insertCell();
                    const dateInput = document.createElement('input');
                    dateInput.type = 'date';
                    dateInput.className = 'date-input';
                    dateInput.id = `roster-date-${index}`;
                    dateInput.disabled = true; // Initially disabled
                    
                    // Set max date to today
                    const today = new Date();
                    dateInput.max = today.toISOString().split('T')[0];
                    
                    // Set min date to day after from date if it exists
                    if (member.fromDate) {
                        const fromDate = Utils.parseDate(member.fromDate);
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
        Utils.hideElement('roster-loading');
        Utils.showElement('roster-content');
        
        // Trigger resize
        Utils.resizeIframe();
        console.log('=== displayRoster() completed ===');
    }

    function handleRosterStatusChange(index, statusValue) {
        const dateInput = document.getElementById(`roster-date-${index}`);
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

    function reviewRosterChanges() {
        // Get all roster changes
        const changes = [];
        const tbody = document.getElementById('roster-tbody');
        
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach((row, index) => {
                const memberId = row.dataset.memberId;
                if (memberId) {
                    const statusSelect = document.getElementById(`status-${index}`);
                    const dateInput = document.getElementById(`roster-date-${index}`);
                    const nameCell = row.cells[0];
                    const currentStatusCell = row.cells[1];
                    
                    if (statusSelect && statusSelect.value && statusSelect.value !== '' && dateInput) {
                        const selectedOption = statusSelect.options[statusSelect.selectedIndex];
                        
                        changes.push({
                            id: memberId,
                            name: nameCell.textContent,
                            currentStatus: currentStatusCell.textContent,
                            newStatus: statusSelect.value,
                            newStatusText: selectedOption.textContent,
                            effectiveDate: dateInput.value,
                            effectiveDateFormatted: dateInput.value ? Utils.formatDateForDisplay(dateInput.value) : '',
                            codeId: row.dataset.codeId,
                            relationId: row.dataset.relationId
                        });
                    }
                }
            });
        }
        
        if (changes.length === 0) {
            const message = 'No changes have been made. Please select a status for at least one member.';
            alert(message);
            Utils.showStatus(message, 'error');
            return;
        }
        
        // Validate that all changes have dates
        const incomplete = changes.filter(c => !c.effectiveDate);
        
        if (incomplete.length > 0) {
            const message = `Please ensure all status changes have effective dates. ${incomplete.length} member(s) missing date.`;
            alert(message);
            Utils.showStatus(message, 'error');
            return;
        }
        
        // Display review table
        displayRosterReview(changes);
    }

    function displayRosterReview(changes) {
        const chapterSpan = document.getElementById('roster-review-chapter');
        const countSpan = document.getElementById('roster-review-count');
        const tbody = document.getElementById('roster-review-tbody');
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        if (countSpan) countSpan.textContent = changes.length;
        
        if (tbody) {
            tbody.innerHTML = '';
            
            changes.forEach(change => {
                const row = tbody.insertRow();
                
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
        Utils.hideElement('roster-content');
        Utils.showElement('roster-review');
        Utils.resizeIframe();
    }

    function backToRoster() {
        Utils.hideElement('roster-review');
        Utils.showElement('roster-content');
        Utils.resizeIframe();
    }

    function submitRosterChanges() {
        // For now, just show what would be submitted
        console.log('Roster changes to submit from review');
        Utils.showStatus('Submit functionality coming soon', 'info');
    }

    async function getRosterInfo() {
        const rosterType = document.getElementById('rosterType').value;
        
        // This would need to be customized based on your specific API structure
        let endpoint = '/constituents';
        
        // Add filtering based on roster type and chapter info
        if (appState.chapter) {
            endpoint += `?chapter=${appState.chapter}`;
        }
        
        await API.makeApiCall(endpoint, 'rosterResult');
    }
    
    // Public API
    return {
        loadRoster,
        processRosterResults,
        reviewRosterChanges,
        backToRoster,
        submitRosterChanges,
        getRosterInfo
    };
})();

// Make it available globally
window.RosterModule = RosterModule;

// Also expose individual functions for backward compatibility
window.loadRoster = RosterModule.loadRoster;
window.processRosterResults = RosterModule.processRosterResults;
window.reviewRosterChanges = RosterModule.reviewRosterChanges;
window.backToRoster = RosterModule.backToRoster;
window.submitRosterChanges = RosterModule.submitRosterChanges;
window.getRosterInfo = RosterModule.getRosterInfo;