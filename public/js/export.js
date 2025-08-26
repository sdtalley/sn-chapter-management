// Export Contact Sheet Module for SN Chapter Management
const ExportModule = (function() {
    'use strict';
    
    // Reference to global state and utilities
    const appState = window.appState;
    const Utils = window.Utils;
    const API = window.API;
    const Queries = window.Queries;
    
    // Main export function (called by button onclick)
    async function exportContactSheet() {
        console.log('=== exportContactSheet() started ===');
        
        // Check prerequisites
        if (!appState.chapter || appState.chapter === 'Not provided') {
            Utils.showStatus('Please select a chapter first', 'error');
            return;
        }
        
        if (!appState.chapterData || !appState.chapterData.csid) {
            Utils.showStatus('Chapter data not loaded. Please refresh the page.', 'error');
            return;
        }
        
        // Show processing modal
        showProcessingModal();
        
        try {
            // Step 1: Get custom fields for chapter
            console.log('Step 1: Fetching custom fields...');
            const customFields = await getChapterCustomFields(appState.chapterData.csid);
            
            // Extract required values from custom fields
            const division = extractCustomFieldValue(customFields, 'Chapter - Division');
            const consultantStartDate = extractCustomFieldValue(customFields, 'Chapter - Consultant Visit (Start)');
            const consultantEndDate = extractCustomFieldValue(customFields, 'Chapter - Consultant Visit (End)');
            
            console.log('Division:', division);
            console.log('Consultant Start:', consultantStartDate);
            console.log('Consultant End:', consultantEndDate);
            
            if (!division) {
                throw new Error('Division information not found for this chapter');
            }
            
            // Step 2: Get contact sheet data
            console.log('Step 2: Fetching contact sheet data...');
            const contactSheetData = await getContactSheetData(appState.chapter);
            
            // Step 3: Get division commander data
            console.log('Step 3: Fetching division commander data...');
            const divisionCommanderData = await getDivisionCommanderData(division);
            
            // Step 4: Combine the arrays
            console.log('Step 4: Combining data...');
            const combinedData = [...contactSheetData, ...divisionCommanderData];
            console.log(`Total records: ${combinedData.length}`);
            
            // Step 5: Build and download Excel file
            console.log('Step 5: Building Excel file...');
            buildAndDownloadExcel(combinedData, consultantStartDate, consultantEndDate);
            
            // Hide modal and show success
            hideProcessingModal();
            Utils.showStatus('Contact sheet exported successfully!', 'success');
            
        } catch (error) {
            console.error('Export failed:', error);
            hideProcessingModal();
            Utils.showStatus(`Export failed: ${error.message}`, 'error');
        }
    }
    
    // Get chapter custom fields from Blackbaud API
    async function getChapterCustomFields(csid) {
        const endpoint = `/constituent/v1/constituents/${csid}/customfields`;
        
        const response = await API.makeRateLimitedApiCall(
            `/api/blackbaud?action=api&endpoint=${encodeURIComponent(endpoint)}&token=${appState.accessToken}`,
            'GET'
        );
        
        return response.value || [];
    }
    
    // Extract value from custom fields array by category name
    function extractCustomFieldValue(customFields, categoryName) {
        const field = customFields.find(f => f.category === categoryName);
        if (!field || !field.value) return null;
        
        // For date fields, format them nicely
        if (field.type === 'Date' && field.value) {
            return formatDate(field.value);
        }
        
        return field.value;
    }
    
    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric' 
        });
    }
    
    // Get contact sheet data via query
    async function getContactSheetData(chapter) {
        const queryRequest = buildContactSheetQuery(chapter);
        const results = await API.executeQuery(queryRequest, 'contact_sheet_export');
        return results || [];
    }
    
    // Get division commander data via query
    async function getDivisionCommanderData(division) {
        const queryRequest = buildDivisionCommanderQuery(division);
        const results = await API.executeQuery(queryRequest, 'division_commander_export');
        return results || [];
    }
    
    // Build contact sheet query
    function buildContactSheetQuery(chapter) {
        return {
            "query": {
                "advanced_processing_options": {
                    "use_alternate_sql_code_table_fields": false,
                    "use_alternate_sql_multiple_attributes": false
                },
                "constituent_filters": {
                    "include_deceased": false,
                    "include_inactive": true,
                    "include_no_valid_addresses": true
                },
                "filter_fields": [
                    {
                        "compare_type": "None",
                        "filter_values": [
                            "2528", "5784", "2422", "2425", "2496", "2411", "2408", "2439",
                            "2507", "2414", "2429", "2442", "2423", "2426", "2510", "2412",
                            "2490", "2431", "2427", "2428", "2430", "2424", "7204"
                        ],
                        "left_parenthesis": false,
                        "operator": "OneOf",
                        "query_field_id": 40924,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "left_parenthesis": false,
                        "operator": "Blank",
                        "query_field_id": 40927,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "left_parenthesis": false,
                        "operator": "Blank",
                        "query_field_id": 40882,
                        "right_parenthesis": false,
                        "unique_id": "594"
                    },
                    {
                        "compare_type": "And",
                        "filter_values": ["2963"],
                        "operator": "Equals",
                        "query_field_id": 40881
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [chapter],
                        "operator": "Equals",
                        "query_field_id": 40880
                    }
                ],
                "select_fields": [
                    { "query_field_id": 40941 },
                    { "query_field_id": 40966 },
                    { "query_field_id": 40968 },
                    { "query_field_id": 131769, "unique_id": "1525" },
                    { "query_field_id": 131769, "unique_id": "6782" },
                    { "query_field_id": 131769, "unique_id": "1520" },
                    { "query_field_id": 40924, "user_alias": "Position" }
                ],
                "sort_fields": [],
                "suppress_duplicates": true,
                "type_id": 40,
                "sql_generation_mode": "Query"
            },
            "ux_mode": "Synchronous",
            "output_format": "Json",
            "formatting_mode": "UI",
            "results_file_name": "contactsheet",
            "time_zone_offset_in_minutes": 120
        };
    }
    
    // Build division commander query
    function buildDivisionCommanderQuery(division) {
        return {
            "query": {
                "advanced_processing_options": {
                    "use_alternate_sql_code_table_fields": false,
                    "use_alternate_sql_multiple_attributes": false
                },
                "constituent_filters": {
                    "include_deceased": false,
                    "include_inactive": true,
                    "include_no_valid_addresses": true
                },
                "filter_fields": [
                    {
                        "compare_type": "None",
                        "filter_values": [division],
                        "operator": "Equals",
                        "query_field_id": 40918
                    },
                    {
                        "compare_type": "And",
                        "filter_values": ["2406"],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 40924,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "left_parenthesis": false,
                        "operator": "Blank",
                        "query_field_id": 40927,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "left_parenthesis": false,
                        "operator": "Blank",
                        "query_field_id": 40882,
                        "right_parenthesis": false,
                        "unique_id": "594"
                    }
                ],
                "select_fields": [
                    { "query_field_id": 40941 },
                    { "query_field_id": 40966 },
                    { "query_field_id": 40968 },
                    { "query_field_id": 131769, "unique_id": "1525" },
                    { "query_field_id": 131769, "unique_id": "6782" },
                    { "query_field_id": 131769, "unique_id": "1520" },
                    { "query_field_id": 40924, "user_alias": "Position" }
                ],
                "sort_fields": [],
                "suppress_duplicates": true,
                "type_id": 40,
                "sql_generation_mode": "Query"
            },
            "ux_mode": "Synchronous",
            "output_format": "Json",
            "formatting_mode": "UI",
            "results_file_name": "divisioncommander",
            "time_zone_offset_in_minutes": 120
        };
    }
    
    // Build and download Excel file
    function buildAndDownloadExcel(data, consultantStart, consultantEnd) {
        // Prepare data for Excel
        const excelData = data.map(row => {
            // Determine which email to use based on position and availability
            let email = row['Email #1 (Personal) Number'] || '';
            
            if (!email) {
                const position = row['Position'] || '';
                const businessEmailPositions = [
                    'Alumni Advisory Board Chairman',
                    'Alumni Advisory Board Co-Chairman', 
                    'Chapter Advisor',
                    'Co-Advisor',
                    'Faculty Advisor',
                    'Greek Advisor',
                    'House Corp. President',
                    'Co-Chapter Advisor',
                    'Division Commander'
                ];
                
                if (businessEmailPositions.some(p => position === p || position.includes(p))) {
                    email = row['Email #1 (Business) Number'] || '';
                } else {
                    email = row['Email (School) Number'] || '';
                }
            }
            
            return {
                'Constituent ID': row['Constituent ID'] || '',
                'First Name': row['First Name'] || '',
                'Last Name': row['Last Name'] || '',
                'Email': email,
                'Position': row['Position'] || '',
                'Chapter': appState.chapter,
                'Consultant Start Date': consultantStart || '',
                'Consultant End Date': consultantEnd || ''
            };
        });
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths for better readability
        const colWidths = [
            { wch: 15 }, // Constituent ID
            { wch: 15 }, // First Name
            { wch: 15 }, // Last Name
            { wch: 30 }, // Email
            { wch: 25 }, // Position
            { wch: 15 }, // Chapter
            { wch: 18 }, // Consultant Start Date
            { wch: 18 }  // Consultant End Date
        ];
        ws['!cols'] = colWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Contact Sheet');
        
        // Generate filename with chapter name
        const filename = `${appState.chapter} Contact Sheet.xlsx`;
        
        // Write and download the file
        XLSX.writeFile(wb, filename);
    }
    
    // Show processing modal
    function showProcessingModal() {
        // Remove existing modal if present
        hideProcessingModal();
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'export-processing-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        `;
        
        modalContent.innerHTML = `
            <div class="spinner" style="margin: 0 auto 20px;"></div>
            <h3 style="margin: 0 0 10px;">Preparing Download</h3>
            <p style="margin: 0; color: #666;">Gathering contact information...</p>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }
    
    // Hide processing modal
    function hideProcessingModal() {
        const modal = document.getElementById('export-processing-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    // Public API
    return {
        exportContactSheet
    };
})();

// Make it available globally
window.ExportModule = ExportModule;