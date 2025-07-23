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
                            relationId: row.dataset.relationId || null
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
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        if (countSpan) countSpan.textContent = changes.length;
        
        if (tbody) {
            tbody.innerHTML = '';
            
            changes.forEach(change => {
                const row = tbody.insertRow();
                
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
        Utils.hideElement('officer-review');
        Utils.showElement('officer-content');
        Utils.resizeIframe();
    }

    function submitOfficerChanges() {
        // For now, just show what would be submitted
        console.log('Officer changes to submit from review');
        Utils.showStatus('Submit functionality coming soon', 'info');
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