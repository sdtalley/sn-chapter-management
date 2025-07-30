// Officer Information Module for SN Chapter Management
const OfficersModule = (function() {
    'use strict';
    
    // Reference to global state and utilities
    const appState = window.appState;
    const Utils = window.Utils;
    const API = window.API;
    const Queries = window.Queries;
    
    // Define all 16 officer positions in order
    const OFFICER_POSITIONS = [
        'Alumni Relations',
        'Chaplain',
        'Commander',
        'House Manager',
        'LEAD Chairman',
        'Lt. Commander',
        'Marshal',
        'Philanthropy/Community Relations',
        'Recorder',
        'Recruitment Chairman',
        'Reporter',
        'Risk Reduction Officer',
        'Scholarship Chairman',
        'Sentinel',
        'Social Chairman',
        'Treasurer'
    ];
    
    // Load officers data
    async function loadOfficers() {
        console.log('=== loadOfficers() started ===');
        console.log('Chapter:', appState.chapter);
        
        if (!appState.chapter) {
            Utils.showOfficerError('No chapter specified. Please access this page with a chapter parameter.');
            console.error('No chapter parameter found');
            return;
        }

        // Show loading state
        console.log('Showing loading state...');
        Utils.showLoading('officer-loading');
        Utils.hideElement('officer-content');
        Utils.hideElement('officer-error');

        try {
            // Use cached chapter data
            const chapterQuid = appState.chapterData?.quid;
            console.log('Chapter QUID from cache:', chapterQuid);
            
            if (!chapterQuid) {
                throw new Error(`Chapter QUID not found for ${appState.chapter}`);
            }

            // Execute both queries in parallel
            const [rosterResults, officerResults] = await Promise.all([
                // Query 1: Get roster for member list
                API.executeQuery(Queries.buildRosterQuery(chapterQuid, appState.chapter), 'roster_for_officers'),
                // Query 2: Get current officers
                API.executeQuery(Queries.buildOfficerQuery(chapterQuid, appState.chapter), 'officers')
            ]);
            
            // Process results - note we're using RosterModule's function
            const roster = window.RosterModule.processRosterResults(rosterResults);
            const officers = processOfficerResults(officerResults);
            
            console.log('Processed roster:', roster);
            console.log('Processed officers:', officers);
            
            // Display officers
            displayOfficers(officers, roster);
            
        } catch (error) {
            console.error('Error loading officers:', error);
            Utils.showOfficerError(`Failed to load officers: ${error.message}`);
        }
    }

    function processOfficerResults(results) {
        console.log('=== processOfficerResults() started ===');
        console.log('Raw results:', results);
        
        const officers = [];
        
        if (Array.isArray(results)) {
            console.log(`Processing ${results.length} officers`);
            
            results.forEach((row, index) => {
                console.log(`Row ${index}:`, row);
                
                // Truncate relationId to last 7 digits
                let truncatedRelationId = row.Relation_ID || '';
                if (truncatedRelationId && truncatedRelationId.length > 7) {
                    truncatedRelationId = truncatedRelationId.slice(-7);
                }
                
                const officer = {
                    position: row.Position || 'Unknown',
                    id: row.ID || row.QRECID || row.id,
                    name: row.Name || row.name || 'N/A',
                    fromDate: row.From_Date || '',
                    relationId: truncatedRelationId,
                    orgImpId: row.Org_ImpID || ''
                };
                
                console.log(`Officer ${index}:`, officer);
                officers.push(officer);
            });
        } else {
            console.warn('Unexpected results format:', results);
        }

        console.log(`Total officers processed: ${officers.length}`);
        return officers;
    }

    function displayOfficers(officers, roster) {
        console.log('=== displayOfficers() started ===');
        console.log('Number of officers:', officers.length);
        console.log('Number of roster members:', roster.length);
        
        const chapterSpan = document.getElementById('officer-chapter');
        const tbody = document.getElementById('officer-tbody');
        
        // Process officers to handle duplicates - keep only the latest
        const officerMap = {};
        officers.forEach(officer => {
            const existingOfficer = officerMap[officer.position];
            if (!existingOfficer || Utils.compareFromDates(officer.fromDate, existingOfficer.fromDate) > 0) {
                officerMap[officer.position] = officer;
            }
        });
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        
        // Clear existing rows
        if (tbody) {
            tbody.innerHTML = '';
            
            // Create rows for all 16 positions
            OFFICER_POSITIONS.forEach((position, index) => {
                console.log(`Creating row for position: ${position}`);
                
                const row = tbody.insertRow();
                const currentOfficer = officerMap[position];
                
                // Store position data
                row.dataset.position = position;
                if (currentOfficer) {
                    row.dataset.currentOfficerId = currentOfficer.id;
                    row.dataset.currentOfficerName = currentOfficer.name;
                    row.dataset.fromDate = currentOfficer.fromDate;
                    row.dataset.relationId = currentOfficer.relationId;
                }
                
                // Position
                const positionCell = row.insertCell();
                positionCell.textContent = position;
                
                // Current Officer
                const currentCell = row.insertCell();
                currentCell.textContent = currentOfficer ? currentOfficer.name : '-';
                
                // From Date
                const fromDateCell = row.insertCell();
                fromDateCell.textContent = currentOfficer ? Utils.formatDateForDisplay(currentOfficer.fromDate) : '-';
                
                // New Officer dropdown
                const newOfficerCell = row.insertCell();
                const selectWrapper = document.createElement('div');
                selectWrapper.className = 'select-wrapper';
                
                const officerSelect = document.createElement('select');
                officerSelect.className = 'officer-select';
                officerSelect.id = `new-officer-${index}`;
                
                // Default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'No Change';
                defaultOption.selected = true;
                officerSelect.appendChild(defaultOption);
                
                // Add all roster members as options
                roster.forEach(member => {
                    const option = document.createElement('option');
                    option.value = member.id;
                    option.textContent = member.name;
                    option.dataset.memberId = member.id;
                    officerSelect.appendChild(option);
                });
                
                // Add change event listener
                officerSelect.addEventListener('change', function() {
                    handleOfficerChange(index, this.value);
                    // Mark as having unsaved changes
                    if (window.setUnsavedChanges) {
                        window.setUnsavedChanges(true);
                    }
                });
                
                selectWrapper.appendChild(officerSelect);
                newOfficerCell.appendChild(selectWrapper);
                
                // Start Date picker
                const startDateCell = row.insertCell();
                const dateInput = document.createElement('input');
                dateInput.type = 'date';
                dateInput.className = 'date-input';
                dateInput.id = `officer-start-date-${index}`;
                dateInput.disabled = true; // Initially disabled
                
                // Set max date to today
                const today = new Date();
                dateInput.max = today.toISOString().split('T')[0];
                
                // Set min date to day after current officer's from date if exists
                if (currentOfficer && currentOfficer.fromDate) {
                    const fromDate = Utils.parseDate(currentOfficer.fromDate);
                    if (fromDate) {
                        fromDate.setDate(fromDate.getDate() + 1);
                        dateInput.min = fromDate.toISOString().split('T')[0];
                    }
                }
                
                startDateCell.appendChild(dateInput);
            });
        }
        
        // Show content
        console.log('Hiding loading state and showing content...');
        Utils.hideElement('officer-loading');
        Utils.showElement('officer-content');
        
        // Trigger resize
        Utils.resizeIframe();
        console.log('=== displayOfficers() completed ===');
    }

    function handleOfficerChange(index, newOfficerId) {
        const dateInput = document.getElementById(`officer-start-date-${index}`);
        if (!dateInput) return;

        if (newOfficerId && newOfficerId !== '') {
            // Enable date picker when officer is selected
            dateInput.disabled = false;
            dateInput.value = ''; // Clear any default value
        } else {
            // Disable and clear date when "No Change" is selected
            dateInput.disabled = true;
            dateInput.value = '';
        }
    }

    function reviewOfficerChanges() {
        // Get all officer changes
        const changes = [];
        const tbody = document.getElementById('officer-tbody');
        
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach((row, index) => {
                const position = row.dataset.position;
                if (position) {
                    const officerSelect = document.getElementById(`new-officer-${index}`);
                    const dateInput = document.getElementById(`officer-start-date-${index}`);
                    const currentOfficerCell = row.cells[1];
                    
                    if (officerSelect && officerSelect.value && officerSelect.value !== '' && dateInput) {
                        const selectedOption = officerSelect.options[officerSelect.selectedIndex];
                        
                        changes.push({
                            position: position,
                            currentOfficer: currentOfficerCell.textContent === '-' ? 'None' : currentOfficerCell.textContent,
                            currentOfficerId: row.dataset.currentOfficerId || null,
                            newOfficerId: officerSelect.value,
                            newOfficerName: selectedOption.textContent,
                            startDate: dateInput.value,
                            startDateFormatted: dateInput.value ? Utils.formatDateForDisplay(dateInput.value) : '',
                            relationId: row.dataset.relationId || null,
                            fromDate: row.dataset.fromDate || null
                        });
                    }
                }
            });
        }
        
        if (changes.length === 0) {
            const message = 'No changes have been made. Please select a new officer for at least one position.';
            alert(message);
            Utils.showStatus(message, 'error');
            return;
        }
        
        // Validate that all changes have start dates
        const incomplete = changes.filter(c => !c.startDate);
        
        if (incomplete.length > 0) {
            const message = `Please ensure all officer changes have start dates. ${incomplete.length} position(s) missing date.`;
            alert(message);
            Utils.showStatus(message, 'error');
            return;
        }
        
        // Display review table
        displayOfficerReview(changes);
    }

    function displayOfficerReview(changes) {
        const chapterSpan = document.getElementById('officer-review-chapter');
        const countSpan = document.getElementById('officer-review-count');
        const tbody = document.getElementById('officer-review-tbody');
        const submitSection = document.querySelector('#officer-review .submit-section');
        
        // IMPORTANT: Reset submit section to ensure no spinner is showing
        if (submitSection) {
            submitSection.innerHTML = `
                <button class="btn" onclick="OfficersModule.backToOfficers()">Back</button>
                <button class="btn" onclick="OfficersModule.submitOfficerChanges()">Submit</button>
            `;
        }
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        if (countSpan) countSpan.textContent = changes.length;
        
        if (tbody) {
            tbody.innerHTML = '';
            
            changes.forEach(change => {
                const row = tbody.insertRow();
                
                // Store the officer data on the row for later retrieval
                row.officerData = {
                    position: change.position,
                    currentOfficerId: change.currentOfficerId,
                    newOfficerId: change.newOfficerId,
                    startDate: change.startDate,
                    relationId: change.relationId,
                    fromDate: change.fromDate
                };
                
                // Position
                const positionCell = row.insertCell();
                positionCell.textContent = change.position;
                
                // Current Officer
                const currentCell = row.insertCell();
                currentCell.textContent = change.currentOfficer;
                
                // New Officer
                const newOfficerCell = row.insertCell();
                newOfficerCell.textContent = change.newOfficerName;
                
                // Start Date
                const dateCell = row.insertCell();
                dateCell.textContent = change.startDateFormatted;
            });
        }
        
        // Hide main content, show review
        Utils.hideElement('officer-content');
        Utils.showElement('officer-review');
        Utils.resizeIframe();
    }

    function backToOfficers() {
        // Clear any pending state
        delete appState.pendingOfficers;
        
        // Reset submit section to ensure no spinner
        const submitSection = document.querySelector('#officer-review .submit-section');
        if (submitSection) {
            submitSection.innerHTML = `
                <button class="btn" onclick="OfficersModule.backToOfficers()">Back</button>
                <button class="btn" onclick="OfficersModule.submitOfficerChanges()">Submit</button>
            `;
        }
        
        Utils.hideElement('officer-review');
        Utils.showElement('officer-content');
        Utils.resizeIframe();
    }

    function submitOfficerChanges() {
        // Get all officer data from the review table
        const tbody = document.getElementById('officer-review-tbody');
        if (!tbody) {
            Utils.showStatus('No review data found. Please return to the main screen.', 'error');
            return;
        }
        
        const rows = tbody.querySelectorAll('tr');
        const officers = [];
        
        // Collect all officer data from review table
        rows.forEach((row) => {
            // Store the officer data that was saved during review
            const officerData = row.officerData;
            
            if (officerData) {
                officers.push({
                    position: officerData.position,
                    currentOfficerId: officerData.currentOfficerId,
                    newOfficerId: officerData.newOfficerId,
                    startDate: officerData.startDate,
                    relationId: officerData.relationId,
                    fromDate: officerData.fromDate
                });
            }
        });
        
        if (officers.length === 0) {
            Utils.showStatus('No officers found for submission.', 'error');
            return;
        }
        
        // Store pending officers in case of retry
        appState.pendingOfficers = officers;
        
        // Start the submission process
        submitOfficerPositionChanges(officers);
    }
    
    async function submitOfficerPositionChanges(officers) {
        console.log('=== submitOfficerPositionChanges() started ===');
        console.log('Submitting changes for', officers.length, 'officers');
        
        // Get the submit section and create spinner
        const submitSection = document.querySelector('#officer-review .submit-section');
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
            
            // Process each officer
            for (const officer of officers) {
                try {
                    await processOfficerSubmission(officer, chapterData);
                    successCount++;
                } catch (error) {
                    console.error(`Error processing officer ${officer.position}:`, error);
                    errorCount++;
                    errors.push(`${officer.position}: ${error.message}`);
                }
            }
            
            // Show results
            if (errorCount === 0) {
                // Hide the review table before showing success message
                Utils.hideElement('officer-review');
                
                // Create a temporary success message div
                const successDiv = document.createElement('div');
                successDiv.className = 'submission-success-overlay';
                successDiv.innerHTML = `
                    <div class="submission-success">
                        <p>Successfully processed all ${successCount} officer position(s).</p>
                    </div>
                `;
                document.querySelector('.container').appendChild(successDiv);
                
                // Clear pending officers
                delete appState.pendingOfficers;
                
                // Clear unsaved Changes Tracking
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
                        <p>Processed ${successCount} officer position(s) with ${errorCount} error(s).</p>
                        <p>Errors encountered:</p>
                        <ul class="error-list">
                            ${errors.map(err => `<li>${err}</li>`).join('')}
                        </ul>
                        <p>Please retry submission. If the problem persists, email <a href="mailto:members.area@sigmanu.org">members.area@sigmanu.org</a> with the error message above.</p>
                        <button class="btn" onclick="OfficersModule.backToOfficers()">Back</button>
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
                    <button class="btn" onclick="OfficersModule.backToOfficers()">Back</button>
                </div>
            `;
        }
    }
    
    async function processOfficerSubmission(officer, chapterData) {
        console.log(`Processing officer position: ${officer.position}`);
        
        // Step 1: Split Start Date into three values
        const [startYear, startMonth, startDay] = officer.startDate.split('-');
        const startDate = {
            d: parseInt(startDay, 10),
            m: parseInt(startMonth, 10),
            y: parseInt(startYear, 10)
        };
        
        // Step 2: Split From Date into three values (if exists)
        let cstartDate = null;
        if (officer.fromDate) {
            const fromDate = Utils.parseDate(officer.fromDate);
            if (fromDate) {
                cstartDate = {
                    d: fromDate.getDate(),
                    m: fromDate.getMonth() + 1,
                    y: fromDate.getFullYear()
                };
            }
        }
        
        // Step 3: Take the Start Date -1 day
        // Parse the date components directly to avoid timezone issues
        const [sYear, sMonth, sDay] = officer.startDate.split('-');
        const startDateParsed = new Date(parseInt(sYear), parseInt(sMonth) - 1, parseInt(sDay));
        
        // Calculate end date (1 day before start date)
        const endDateObj = new Date(startDateParsed);
        endDateObj.setDate(endDateObj.getDate() - 1);
        
        const endDate = {
            d: endDateObj.getDate(),
            m: endDateObj.getMonth() + 1,
            y: endDateObj.getFullYear()
        };
        
        // If there's a current officer, create closed relationship
        if (officer.currentOfficerId && cstartDate) {
            // Step 4: Create closed officer relationship for current officer
            console.log(`Creating closed relationship for current officer: ${officer.currentOfficerId}`);
            const closedRelationshipData = {
                comment: `Added by ${appState.offname || 'Unknown'}`,
                constituent_id: officer.currentOfficerId,
                is_organization_contact: false,
                is_primary_business: false,
                is_spouse: false,
                do_not_reciprocate: true,
                reciprocal_type: officer.position,
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
        
        // Step 5: Create new officer relationship
        console.log(`Creating new officer relationship for: ${officer.newOfficerId}`);
        const newRelationshipData = {
            comment: `Added by ${appState.offname || 'Unknown'}`,
            constituent_id: officer.newOfficerId,
            is_organization_contact: false,
            is_primary_business: false,
            is_spouse: false,
            reciprocal_type: officer.position,
            relation_id: chapterData.csid,
            start: startDate,
            type: "Collegiate Chapter"
        };
        
        const createRelResponse = await API.makeRateLimitedApiCall(
            '/api/blackbaud?action=create-constituent-relationship',
            'POST',
            newRelationshipData
        );
        
        console.log('Create new officer relationship response:', createRelResponse);
        
        // Step 6: Delete existing officer relationship (if exists)
        if (officer.relationId) {
            console.log(`Deleting existing relationship: ${officer.relationId}`);
            const deleteRelResponse = await API.makeRateLimitedApiCall(
                `/api/blackbaud?action=delete-relationship&endpoint=/constituent/v1/relationships/${officer.relationId}`,
                'DELETE'
            );
            
            console.log('Delete relationship response:', deleteRelResponse);
        }
        
        console.log(`Successfully processed officer position: ${officer.position}`);
    }

    async function getOfficerInfo() {
        const officerPosition = document.getElementById('officerPosition').value;
        
        // This would need to be customized based on your specific API structure
        let endpoint = '/constituents';
        
        // Add filtering for officers
        if (appState.chapter) {
            endpoint += `?chapter=${appState.chapter}&role=officer`;
        }
        
        await API.makeApiCall(endpoint, 'officerResult');
    }
    
    // Public API
    return {
        loadOfficers,
        processOfficerResults,
        reviewOfficerChanges,
        backToOfficers,
        submitOfficerChanges,
        getOfficerInfo,
        OFFICER_POSITIONS
    };
})();

// Make it available globally
window.OfficersModule = OfficersModule;

// Also expose individual functions for backward compatibility
window.loadOfficers = OfficersModule.loadOfficers;
window.processOfficerResults = OfficersModule.processOfficerResults;
window.reviewOfficerChanges = OfficersModule.reviewOfficerChanges;
window.backToOfficers = OfficersModule.backToOfficers;
window.submitOfficerChanges = OfficersModule.submitOfficerChanges;
window.getOfficerInfo = OfficersModule.getOfficerInfo;