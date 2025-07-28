// Roster Information Module for SN Chapter Management
const RosterModule = (function() {
    'use strict';
    
    // Reference to global state and utilities
    const appState = window.appState;
    const Utils = window.Utils;
    const API = window.API;
    const Queries = window.Queries;
    
    // Module-level storage for officer relationships
    let memberOfficerRelationships = {};
    
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

            // Execute all three queries in parallel
            const [rosterResults, officerRelResults] = await Promise.all([
                // Query 1: Get roster
                API.executeQuery(Queries.buildRosterQuery(chapterQuid, appState.chapter), 'roster'),
                // Query 2: Get all open officer relationships
                API.executeQuery(buildAllOpenOfficerRelationshipsQuery(chapterQuid, appState.chapter), 'open_officer_relationships')
            ]);
            
            // Process results
            const roster = processRosterResults(rosterResults);
            console.log('Processed roster:', roster);
            
            // Process and store officer relationships
            memberOfficerRelationships = processOpenOfficerRelationships(officerRelResults);
            console.log('Processed officer relationships:', memberOfficerRelationships);
            
            // Display roster
            displayRoster(roster);
            
        } catch (error) {
            console.error('Error loading roster:', error);
            Utils.showRosterError(`Failed to load roster: ${error.message}`);
        }
    }
    
    // Build query for all open officer relationships
    function buildAllOpenOfficerRelationshipsQuery(chapterQuid, chapterName) {
        return {
            "query": {
                "advanced_processing_options": {},
                "constituent_filters": {
                    "include_deceased": true,
                    "include_inactive": true,
                    "include_no_valid_addresses": true
                },
                "filter_fields": [
                    {
                        "compare_type": "None",
                        "filter_values": [chapterName],
                        "operator": "Equals",
                        "query_field_id": 40918
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [
                            "2422", "2425", "2408", "2429", "2442", "2423",
                            "2426", "2510", "2412", "2490", "2432", "2431",
                            "2427", "2428", "2430", "2424"
                        ],
                        "operator": "OneOf",
                        "query_field_id": 40924
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "operator": "Blank",
                        "query_field_id": 40927
                    }
                ],
                "gift_processing_options": {
                    "matching_gift_credit_option": "MatchingGiftCompany",
                    "soft_credit_option": "Donor"
                },
                "select_fields": [
                    {
                        "query_field_id": 40961,
                        "user_alias": "offMemID"
                    },
                    {
                        "query_field_id": 40924,
                        "user_alias": "offRecip"
                    },
                    {
                        "query_field_id": 40906,
                        "user_alias": "offFromDate"
                    },
                    {
                        "query_field_id": 40907,
                        "user_alias": "offRelID"
                    }
                ],
                "sort_fields": [],
                "type_id": 40,
                "sql_generation_mode": "Query"
            }
        };
    }
    
    // Process open officer relationships into a lookup map
    function processOpenOfficerRelationships(results) {
        console.log('=== processOpenOfficerRelationships() started ===');
        const relationshipMap = {};
        
        if (Array.isArray(results)) {
            results.forEach(row => {
                const memberId = row.offMemID;
                
                if (!relationshipMap[memberId]) {
                    relationshipMap[memberId] = [];
                }
                
                // Truncate offRelID to last 7 digits
                let truncatedRelId = row.offRelID || '';
                if (truncatedRelId && truncatedRelId.length > 7) {
                    truncatedRelId = truncatedRelId.slice(-7);
                }
                
                relationshipMap[memberId].push({
                    id: truncatedRelId,
                    reciprocal_type: row.offRecip,
                    fromDate: row.offFromDate
                });
                
                console.log(`Added officer relationship for member ${memberId}: ${row.offRecip}`);
            });
        }
        
        console.log(`Total members with officer relationships: ${Object.keys(relationshipMap).length}`);
        return relationshipMap;
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
                    codeId: truncatedCodeId,
                    recip: row.Recip || ''
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
                    row.dataset.recip = member.recip;
                    row.dataset.fromDate = member.fromDate;
                    
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
                    
                    // Check if member has Proposed Expelled or Proposed Suspended status
                    if (member.recip === 'Proposed Expelled' || member.recip === 'Proposed Suspended') {
                        // Display as uneditable text
                        statusCell.textContent = member.recip;
                        statusCell.style.fontWeight = 'bold';
                        statusCell.style.color = '#dc3545'; // Red color for emphasis
                    } else {
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
                        
                        // Determine the reciprocal type based on current status
                        let reciprocalType = 'Candidate'; // Default
                        const currentStatus = currentStatusCell.textContent;
                        if (currentStatus === 'Candidate') {
                            reciprocalType = 'Candidate';
                        } else if (currentStatus === 'Initiate') {
                            reciprocalType = 'Initiate';
                        }
                        
                        changes.push({
                            id: memberId,
                            name: nameCell.textContent,
                            currentStatus: currentStatus,
                            newStatus: statusSelect.value,
                            newStatusText: selectedOption.textContent,
                            effectiveDate: dateInput.value,
                            effectiveDateFormatted: dateInput.value ? Utils.formatDateForDisplay(dateInput.value) : '',
                            codeId: row.dataset.codeId,
                            relationId: row.dataset.relationId,
                            fromDate: row.dataset.fromDate,
                            reciprocalType: reciprocalType,
                            recip: row.dataset.recip || reciprocalType // Use dataset recip if exists, otherwise use reciprocalType
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
                
                // Store the roster data on the row for later retrieval
                row.rosterData = {
                    id: change.id,
                    currentStatus: change.currentStatus,
                    newStatus: change.newStatus,
                    effectiveDate: change.effectiveDate,
                    codeId: change.codeId,
                    relationId: change.relationId,
                    fromDate: change.fromDate,
                    reciprocalType: change.reciprocalType,
                    recip: change.recip
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
        // Get all roster data from the review table
        const tbody = document.getElementById('roster-review-tbody');
        if (!tbody) {
            Utils.showStatus('No review data found. Please return to the main screen.', 'error');
            return;
        }
        
        const rows = tbody.querySelectorAll('tr');
        const members = [];
        
        // Collect all roster data from review table
        rows.forEach((row) => {
            const nameCell = row.cells[0];
            
            // Store the roster data that was saved during review
            const rosterData = row.rosterData;
            
            if (rosterData) {
                members.push({
                    id: rosterData.id,
                    name: nameCell.textContent,
                    currentStatus: rosterData.currentStatus,
                    newStatus: rosterData.newStatus,
                    effectiveDate: rosterData.effectiveDate,
                    codeId: rosterData.codeId,
                    relationId: rosterData.relationId,
                    fromDate: rosterData.fromDate,
                    reciprocalType: rosterData.reciprocalType,
                    recip: rosterData.recip
                });
            }
        });
        
        if (members.length === 0) {
            Utils.showStatus('No members found for submission.', 'error');
            return;
        }
        
        // Store pending members in case of retry
        appState.pendingRosterMembers = members;
        
        // Start the submission process
        submitRosterMemberChanges(members);
    }
    
    async function submitRosterMemberChanges(members) {
        console.log('=== submitRosterMemberChanges() started ===');
        console.log('Submitting changes for', members.length, 'members');
        
        // Get the submit section and create spinner
        const submitSection = document.querySelector('#roster-review .submit-section');
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
            
            // Process each member
            for (const member of members) {
                try {
                    await processRosterMemberSubmission(member, chapterData);
                    successCount++;
                } catch (error) {
                    console.error(`Error processing member ${member.name}:`, error);
                    errorCount++;
                    errors.push(`${member.name}: ${error.message}`);
                }
            }
            
            // Show results
            if (errorCount === 0) {
                // Hide the review table before showing success message
                Utils.hideElement('roster-review');
                
                // Create a temporary success message div
                const successDiv = document.createElement('div');
                successDiv.className = 'submission-success-overlay';
                successDiv.innerHTML = `
                    <div class="submission-success">
                        <p>Successfully processed all ${successCount} member(s).</p>
                    </div>
                `;
                document.querySelector('.container').appendChild(successDiv);
                
                // Clear pending members
                delete appState.pendingRosterMembers;
                
                // Wait 2 seconds then return to main menu
                setTimeout(() => {
                    successDiv.remove();
                    window.showMainMenu();
                }, 2000);
            } else {
                // Show error message with retry instructions
                submitSection.innerHTML = `
                    <div class="submission-error">
                        <p>Processed ${successCount} member(s) with ${errorCount} error(s).</p>
                        <p>Errors encountered:</p>
                        <ul class="error-list">
                            ${errors.map(err => `<li>${err}</li>`).join('')}
                        </ul>
                        <p>Please retry submission. If the problem persists, email <a href="mailto:members.area@sigmanu.org">members.area@sigmanu.org</a> with the error message above.</p>
                        <button class="btn" onclick="RosterModule.backToRoster()">Back</button>
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
                    <button class="btn" onclick="RosterModule.backToRoster()">Back</button>
                </div>
            `;
        }
    }
    
    async function processRosterMemberSubmission(member, chapterData) {
        console.log(`Processing member: ${member.name}`);
        
        // Step 1: Parse effective date
        const [year, month, day] = member.effectiveDate.split('-');
        const startDate = {
            d: parseInt(day, 10),
            m: parseInt(month, 10),
            y: parseInt(year, 10)
        };
        
        // Step 2: Parse from date
        let cstartDate = null;
        if (member.fromDate) {
            const fromDate = Utils.parseDate(member.fromDate);
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
        const [eYear, eMonth, eDay] = member.effectiveDate.split('-');
        const effectiveDateParsed = new Date(parseInt(eYear), parseInt(eMonth) - 1, parseInt(eDay));
        
        // Calculate end date (1 day before effective date)
        const endDateObj = new Date(effectiveDateParsed);
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
        
        // Step 4: Create closed relationship (only if we have from date)
        if (cstartDate) {
            console.log('Creating closed relationship');
            const closedRelationshipData = {
                comment: `Added by ${appState.offname || 'Unknown'}`,
                constituent_id: member.id,
                is_organization_contact: false,
                is_primary_business: false,
                is_spouse: false,
                do_not_reciprocate: true,
                reciprocal_type: member.recip,
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
        
        // Step 5: Create new relationship
        console.log('Creating new relationship');
        const newRelationshipData = {
            comment: `Added by ${appState.offname || 'Unknown'}`,
            constituent_id: member.id,
            is_organization_contact: false,
            is_primary_business: false,
            is_spouse: false,
            do_not_reciprocate: true,
            reciprocal_type: member.newStatus,
            relation_id: chapterData.csid,
            start: startDate,
            type: "Collegiate Chapter"
        };
        
        const createRelResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-constituent-relationship',
            'POST',
            newRelationshipData
        );
        
        console.log('Create relationship response:', createRelResponse);
        
        // Step 6: Delete existing relationship
        console.log(`Deleting relationship: ${member.relationId}`);
        const deleteRelResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=delete-relationship&endpoint=/constituent/v1/relationships/${member.relationId}`,
            'DELETE'
        );
        
        console.log('Delete relationship response:', deleteRelResponse);
        
        // Check if this is Proposed Expelled or Proposed Suspended - if so, stop here
        if (member.newStatus === 'Proposed Expelled' || member.newStatus === 'Proposed Suspended') {
            console.log(`Member status is ${member.newStatus}, stopping further processing`);
            return;
        }
        
        // Step 7: Delete existing constituent code
        console.log(`Deleting code: ${member.codeId}`);
        const deleteCodeResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=delete-constituent-code&endpoint=/constituent/v1/constituentcodes/${member.codeId}`,
            'DELETE'
        );
        
        console.log('Delete code response:', deleteCodeResponse);
        
        // Step 8: Create new constituent code
        console.log(`Creating new code: ${member.newStatus}`);
        const codeData = {
            constituent_id: member.id,
            description: member.newStatus,
            start: startDate
        };
        
        const createCodeResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-constituent-code',
            'POST',
            codeData
        );
        
        console.log('Create code response:', createCodeResponse);
        
        // Step 9: Create constituent note
        console.log('Creating note');
        const noteData = {
            constituent_id: member.id,
            date: currentDate,
            text: `Changed to ${member.newStatus} by ${appState.offname || 'Unknown'}`,
            type: "CodeLog"
        };
        
        const createNoteResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-constituent-note',
            'POST',
            noteData
        );
        
        console.log('Create note response:', createNoteResponse);
        
        // Step 10: Get custom fields to find Sigma Nu Code ID
        console.log('Getting custom fields to find Sigma Nu Code ID');
        const customFieldsResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=get-custom-fields&constituentId=${member.id}`,
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
            value: member.newStatus
        };
        
        const updateSNCResponse = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=patch-custom-field&endpoint=/constituent/v1/constituents/customfields/${snAttId}&method=PATCH`,
            'POST',
            updateSNCData
        );
        
        console.log('Update SNC response:', updateSNCResponse);
        
        // Steps 12-13: Process open officer relationships (if any)
        const openOfficerRels = memberOfficerRelationships[member.id] || [];
        if (openOfficerRels.length > 0) {
            console.log(`Processing ${openOfficerRels.length} open officer relationships for member ${member.id}`);
            
            for (const officerRel of openOfficerRels) {
                try {
                    // Parse the officer relationship from date
                    let officerStartDate = null;
                    if (officerRel.fromDate) {
                        const offFromDate = Utils.parseDate(officerRel.fromDate);
                        if (offFromDate) {
                            officerStartDate = {
                                d: offFromDate.getDate(),
                                m: offFromDate.getMonth() + 1,
                                y: offFromDate.getFullYear()
                            };
                        }
                    }
                    
                    // Step 12: Create closed officer relationship
                    if (officerStartDate) {
                        console.log(`Creating closed officer relationship for ${officerRel.reciprocal_type}`);
                        const closedOfficerRelData = {
                            comment: `Added by ${appState.offname || 'Unknown'}`,
                            constituent_id: member.id,
                            is_organization_contact: false,
                            is_primary_business: false,
                            is_spouse: false,
                            do_not_reciprocate: true,
                            reciprocal_type: officerRel.reciprocal_type,
                            relation_id: chapterData.csid,
                            start: officerStartDate,
                            end: endDate,
                            type: "Collegiate Chapter"
                        };
                        
                        const createClosedOfficerResponse = await API.makeRateLimitedApiCall(
                            '/api/blackbaud?action=create-constituent-relationship',
                            'POST',
                            closedOfficerRelData
                        );
                        
                        console.log('Create closed officer relationship response:', createClosedOfficerResponse);
                    }
                    
                    // Step 13: Delete open officer relationship
                    console.log(`Deleting officer relationship: ${officerRel.id}`);
                    const deleteOfficerRelResponse = await API.makeRateLimitedApiCall(
                        `/api/blackbaud?action=delete-relationship&endpoint=/constituent/v1/relationships/${officerRel.id}`,
                        'DELETE'
                    );
                    
                    console.log('Delete officer relationship response:', deleteOfficerRelResponse);
                    
                } catch (officerError) {
                    // Log error but continue processing other relationships
                    console.error(`Error processing officer relationship ${officerRel.reciprocal_type} for member ${member.name}:`, officerError);
                }
            }
        }
        
        console.log(`Successfully processed member: ${member.name}`);
    }
    
    function retrySubmission() {
        if (appState.pendingRosterMembers) {
            submitRosterMemberChanges(appState.pendingRosterMembers);
        } else {
            Utils.showStatus('No pending members to retry.', 'error');
        }
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
        getRosterInfo,
        retrySubmission
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