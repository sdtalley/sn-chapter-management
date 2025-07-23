// Fee Status Module for SN Chapter Management
const FeesModule = (function() {
    'use strict';
    
    // Reference to global state and utilities
    const appState = window.appState;
    const Utils = window.Utils;
    const API = window.API;
    const Queries = window.Queries;
    
    // Load fee status data
    async function loadFeeStatus() {
        console.log('=== loadFeeStatus() started ===');
        console.log('Chapter:', appState.chapter);
        
        if (!appState.chapter) {
            Utils.showFeeError('No chapter specified. Please access this page with a chapter parameter.');
            console.error('No chapter parameter found');
            return;
        }

        // Show loading state
        console.log('Showing loading state...');
        Utils.showLoading('fee-loading');
        Utils.hideElement('fee-content');
        Utils.hideElement('fee-error');

        try {
            // Use cached chapter data
            const chapterQuid = appState.chapterData?.quid;
            console.log('Chapter QUID from cache:', chapterQuid);
            
            if (!chapterQuid) {
                throw new Error(`Chapter QUID not found for ${appState.chapter}`);
            }

            // Reuse roster query
            const queryRequest = Queries.buildRosterQuery(chapterQuid, appState.chapter);
            const resultsData = await API.executeQuery(queryRequest, 'fee_status');
            
            // Process results (same as roster)
            const feeData = window.RosterModule.processRosterResults(resultsData);
            console.log('Processed fee data:', feeData);
            
            // Display fee status
            displayFeeStatus(feeData);
            
        } catch (error) {
            console.error('Error loading fee status:', error);
            Utils.showFeeError(`Failed to load fee status: ${error.message}`);
        }
    }

    function displayFeeStatus(feeData) {
        console.log('=== displayFeeStatus() started ===');
        console.log('Number of members to display:', feeData.length);
        
        const chapterSpan = document.getElementById('fee-chapter');
        const tbody = document.getElementById('fee-tbody');
        
        if (chapterSpan) chapterSpan.textContent = appState.chapter || 'Unknown';
        
        // Clear existing rows
        if (tbody) {
            tbody.innerHTML = '';
            
            if (feeData.length === 0) {
                console.log('No members found - showing empty state');
                const row = tbody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 4;
                cell.className = 'empty-state-cell';
                cell.textContent = 'No members found for this chapter.';
            } else {
                console.log('Creating table rows for fee status...');
                feeData.forEach((member, index) => {
                    console.log(`Creating row ${index} for:`, member);
                    
                    const row = tbody.insertRow();
                    
                    // Name
                    const nameCell = row.insertCell();
                    nameCell.textContent = member.name || 'N/A';
                    
                    // Current Status
                    const statusCell = row.insertCell();
                    statusCell.textContent = member.status === '5707' || member.status === 'Candidate' ? 'Candidate' : 
                                           member.status === '5708' || member.status === 'Initiate' ? 'Initiate' : 
                                           member.status;
                    
                    // Candidate Fee Paid
                    const candidateFeeCell = row.insertCell();
                    candidateFeeCell.textContent = member.candidateFeePaid || 'No';
                    if (member.candidateFeePaid === 'Yes') {
                        candidateFeeCell.style.color = '#28a745';
                        candidateFeeCell.style.fontWeight = 'bold';
                    } else {
                        candidateFeeCell.style.color = '#dc3545';
                    }
                    
                    // Initiate Fee Paid
                    const initiateFeeCell = row.insertCell();
                    initiateFeeCell.textContent = member.initiateFeePaid || 'No';
                    if (member.initiateFeePaid === 'Yes') {
                        initiateFeeCell.style.color = '#28a745';
                        initiateFeeCell.style.fontWeight = 'bold';
                    } else {
                        initiateFeeCell.style.color = '#dc3545';
                    }
                });
            }
        }
        
        // Show content
        console.log('Hiding loading state and showing content...');
        Utils.hideElement('fee-loading');
        Utils.showElement('fee-content');
        
        // Trigger resize
        Utils.resizeIframe();
        console.log('=== displayFeeStatus() completed ===');
    }
    
    async function getFeeStatus() {
        const memberId = document.getElementById('memberId').value;
        
        // This would need to be customized based on your specific API structure
        let endpoint = memberId ? `/constituents/${memberId}/fees` : '/fees';
        
        if (appState.chapter && !memberId) {
            endpoint += `?chapter=${appState.chapter}`;
        }
        
        await API.makeApiCall(endpoint, 'feeResult');
    }
    
    // Public API
    return {
        loadFeeStatus,
        displayFeeStatus,
        getFeeStatus
    };
})();

// Make it available globally
window.FeesModule = FeesModule;

// Also expose individual functions for backward compatibility
window.loadFeeStatus = FeesModule.loadFeeStatus;
window.displayFeeStatus = FeesModule.displayFeeStatus;
window.getFeeStatus = FeesModule.getFeeStatus;