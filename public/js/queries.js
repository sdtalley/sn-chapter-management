// Query Builder Functions for SN Chapter Management
const Queries = (function() {
    'use strict';
    
    // Build query for Verify Candidates page
    function buildCandidatesQuery(chapterQuid) {
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
                        "filter_values": ["6985"],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 2217,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [String(chapterQuid)],
                        "operator": "Equals",
                        "query_field_id": 656,
                        "unique_id": "120"
                    }
                ],
                "gift_processing_options": {
                    "matching_gift_credit_option": "MatchingGiftCompany",
                    "soft_credit_option": "Donor",
                    "use_gross_amount_for_covenants": false
                },
                "select_fields": [
                    {
                        "query_field_id": 349,
                        "user_alias": "ID"
                    },
                    {
                        "query_field_id": 597
                    },
                    {
                        "query_field_id": 2217,
                        "user_alias": "Code"
                    },
                    {
                        "query_field_id": 2216,
                        "user_alias": "CodeID"
                    }
                ],
                "sort_fields": [
                    {
                        "query_field_id": 597,
                        "sort_order": "Ascending"
                    }
                ],
                "suppress_duplicates": true,
                "type_id": 18,
                "sql_generation_mode": "Query"
            }
        };
    }
    
    // Build query for Verify Initiates page
    function buildInitiatesQuery(chapterQuid, chapterName) {
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
                        "filter_values": ["5707"],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 2217,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [String(chapterQuid)],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 656,
                        "right_parenthesis": false,
                        "unique_id": "120"
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [chapterName],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 4123,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": ["1694"],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 4151,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "left_parenthesis": false,
                        "operator": "Blank",
                        "query_field_id": 4148,
                        "right_parenthesis": false
                    }
                ],
                "gift_processing_options": {
                    "matching_gift_credit_option": "MatchingGiftCompany",
                    "soft_credit_option": "Donor",
                    "use_gross_amount_for_covenants": false
                },
                "select_fields": [
                    {
                        "query_field_id": 349,
                        "user_alias": "ID"
                    },
                    {
                        "query_field_id": 597
                    },
                    {
                        "query_field_id": 656,
                        "unique_id": "38",
                        "user_alias": "Candidate_Ceremony_Date"
                    },
                    {
                        "query_field_id": 2217,
                        "user_alias": "Code"
                    },
                    {
                        "query_field_id": 2216,
                        "user_alias": "CodeID"
                    },
                    {
                        "query_field_id": 4127,
                        "user_alias": "Relation_ID"
                    },
                    {
                        "query_field_id": 659,
                        "unique_id": "119",
                        "user_alias": "SNCImpID"
                    }
                ],
                "sort_fields": [
                    {
                        "query_field_id": 597,
                        "sort_order": "Ascending"
                    }
                ],
                "suppress_duplicates": true,
                "type_id": 18,
                "sql_generation_mode": "Query"
            }
        };
    }
    
    // Build query to get top badge number
    function buildTopBadgeQuery(chapterMemcatid) {
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
                        "filter_values": [String(chapterMemcatid)],
                        "operator": "Equals",
                        "query_field_id": 21792
                    }
                ],
                "gift_processing_options": {
                    "matching_gift_credit_option": "MatchingGiftCompany",
                    "soft_credit_option": "Donor"
                },
                "select_fields": [
                    {
                        "query_field_id": 21801,
                        "user_alias": "Badge"
                    }
                ],
                "sort_fields": [
                    {
                        "query_field_id": 21801,
                        "sort_order": "Descending"
                    }
                ],
                "type_id": 18,
                "sql_generation_mode": "Query"
            }
        };
    }
    
    // Build query for Roster Information page
    function buildRosterQuery(chapterQuid, chapterName) {
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
                        "filter_values": ["5707"],
                        "left_parenthesis": true,
                        "operator": "Equals",
                        "query_field_id": 2217,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [String(chapterQuid)],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 656,
                        "right_parenthesis": false,
                        "unique_id": "120"
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [chapterName],
                        "operator": "Equals",
                        "query_field_id": 4123
                    },
                    {
                        "compare_type": "And",
                        "filter_values": ["1694"],
                        "operator": "Equals",
                        "query_field_id": 4151
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "operator": "Blank",
                        "query_field_id": 4148
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "operator": "Blank",
                        "query_field_id": 14682,
                        "right_parenthesis": true,
                        "unique_id": "594"
                    },
                    {
                        "compare_type": "Or",
                        "filter_values": ["5708"],
                        "left_parenthesis": true,
                        "operator": "Equals",
                        "query_field_id": 2217
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [String(chapterQuid)],
                        "operator": "Equals",
                        "query_field_id": 656,
                        "unique_id": "120"
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [chapterName],
                        "operator": "Equals",
                        "query_field_id": 4123
                    },
                    {
                        "compare_type": "And",
                        "filter_values": ["1700", "6676", "6714"],
                        "operator": "OneOf",
                        "query_field_id": 4151
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "operator": "Blank",
                        "query_field_id": 4148
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "operator": "Blank",
                        "query_field_id": 14682,
                        "right_parenthesis": true,
                        "unique_id": "594"
                    }
                ],
                "gift_processing_options": {
                    "matching_gift_credit_option": "MatchingGiftCompany",
                    "soft_credit_option": "Donor",
                    "use_gross_amount_for_covenants": false
                },
                "select_fields": [
                    {
                        "query_field_id": 349,
                        "user_alias": "ID"
                    },
                    {
                        "query_field_id": 597
                    },
                    {
                        "query_field_id": 2217,
                        "user_alias": "Code"
                    },
                    {
                        "query_field_id": 4125,
                        "user_alias": "From_Date"
                    },
                    {
                        "query_field_id": 4127,
                        "user_alias": "Relation_ID"
                    },
                    {
                        "query_field_id": 4151,
                        "user_alias": "Recip"
                    },
                    {
                        "query_field_id": 656,
                        "unique_id": "37",
                        "user_alias": "Candidate_Fee_Paid"
                    },
                    {
                        "query_field_id": 656,
                        "unique_id": "42",
                        "user_alias": "Initiate_Fee_Paid"
                    },
                    {
                        "query_field_id": 2216,
                        "user_alias": "CodeID"
                    }
                ],
                "sort_fields": [
                    {
                        "query_field_id": 2217,
                        "sort_order": "Ascending"
                    },
                    {
                        "query_field_id": 597,
                        "sort_order": "Ascending"
                    }
                ],
                "suppress_duplicates": true,
                "type_id": 18,
                "sql_generation_mode": "Query"
            }
        };
    }
    
    // Build query for Officer Information page
    function buildOfficerQuery(chapterQuid, chapterName) {
        return {
            "query": {
                "advanced_processing_options": {
                    "use_alternate_sql_code_table_fields": false,
                    "use_alternate_sql_multiple_attributes": false
                },
                "constituent_filters": {
                    "include_deceased": true,
                    "include_inactive": true,
                    "include_no_valid_addresses": true
                },
                "filter_fields": [
                    {
                        "compare_type": "None",
                        "filter_values": ["5707", "5708"],
                        "left_parenthesis": false,
                        "operator": "OneOf",
                        "query_field_id": 41225,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [String(chapterQuid)],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 41217,
                        "right_parenthesis": false,
                        "unique_id": "120"
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [chapterName],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 40918,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [
                            "2422", "2425", "2408", "2429", "2442", "2423", 
                            "2426", "2510", "2412", "2490", "2432", "2431", 
                            "2427", "2428", "2430", "2424"
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
                    }
                ],
                "gift_processing_options": {
                    "matching_gift_credit_option": "MatchingGiftCompany",
                    "soft_credit_option": "Donor",
                    "use_gross_amount_for_covenants": false
                },
                "select_fields": [
                    {
                        "query_field_id": 40924,
                        "user_alias": "Position"
                    },
                    {
                        "query_field_id": 40961,
                        "user_alias": "ID"
                    },
                    {
                        "query_field_id": 40967
                    },
                    {
                        "query_field_id": 40906,
                        "user_alias": "From_Date"
                    },
                    {
                        "query_field_id": 40907,
                        "user_alias": "Relation_ID"
                    },
                    {
                        "query_field_id": 104952,
                        "user_alias": "Org_ImpID"
                    }
                ],
                "sort_fields": [],
                "suppress_duplicates": true,
                "type_id": 40,
                "sql_generation_mode": "Query"
            }
        };
    }
    
    // Build query for Chapter Contact Information page
    function buildChapterContactQuery(chapterName) {
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
                        "query_field_id": 14300
                    }
                ],
                "gift_processing_options": {
                    "matching_gift_credit_option": "MatchingGiftCompany",
                    "soft_credit_option": "Donor"
                },
                "select_fields": [
                    {
                        "query_field_id": 349,
                        "user_alias": "ID"
                    },
                    {
                        "query_field_id": 14300,
                        "user_alias": "Name"
                    },
                    {
                        "query_field_id": 863,
                        "unique_id": "2829",
                        "user_alias": "Postal_Address_Line_1"
                    },
                    {
                        "query_field_id": 864,
                        "unique_id": "2829",
                        "user_alias": "Postal_Address_Line_2"
                    },
                    {
                        "query_field_id": 706,
                        "unique_id": "2829",
                        "user_alias": "Postal_City"
                    },
                    {
                        "query_field_id": 790,
                        "unique_id": "2829",
                        "user_alias": "Postal_State"
                    },
                    {
                        "query_field_id": 708,
                        "unique_id": "2829",
                        "user_alias": "Postal_ZIP"
                    },
                    {
                        "query_field_id": 95453,
                        "unique_id": "2829",
                        "user_alias": "Postal_ImpID"
                    },
                    {
                        "query_field_id": 863,
                        "unique_id": "2830",
                        "user_alias": "Shipping_Address_Line_1"
                    },
                    {
                        "query_field_id": 864,
                        "unique_id": "2830",
                        "user_alias": "Shipping_Address_Line_2"
                    },
                    {
                        "query_field_id": 706,
                        "unique_id": "2830",
                        "user_alias": "Shipping_City"
                    },
                    {
                        "query_field_id": 790,
                        "unique_id": "2830",
                        "user_alias": "Shipping_State"
                    },
                    {
                        "query_field_id": 708,
                        "unique_id": "2830",
                        "user_alias": "Shipping_ZIP"
                    },
                    {
                        "query_field_id": 95453,
                        "unique_id": "2830",
                        "user_alias": "Shipping_ImpID"
                    },
                    {
                        "query_field_id": 131226,
                        "unique_id": "1697",
                        "user_alias": "Phone"
                    },
                    {
                        "query_field_id": 131226,
                        "unique_id": "1698",
                        "user_alias": "Email"
                    }
                ],
                "sort_fields": [],
                "type_id": 36,
                "sql_generation_mode": "Query"
            }
        };
    }
    
    // Build query for Returning Students page
    function buildReturningStudentsQuery(chapterQuid, chapterName) {
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
                        "filter_values": ["5733"],
                        "left_parenthesis": true,
                        "operator": "Equals",
                        "query_field_id": 2217,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [String(chapterQuid)],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 656,
                        "right_parenthesis": false,
                        "unique_id": "120"
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [chapterName],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 4123,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": ["1762"],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 4151,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "left_parenthesis": false,
                        "operator": "Blank",
                        "query_field_id": 4148,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "left_parenthesis": false,
                        "operator": "Blank",
                        "query_field_id": 14682,
                        "right_parenthesis": true,
                        "unique_id": "594"
                    },
                    {
                        "compare_type": "Or",
                        "filter_values": ["5737"],
                        "left_parenthesis": true,
                        "operator": "Equals",
                        "query_field_id": 2217,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [String(chapterQuid)],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 656,
                        "right_parenthesis": false,
                        "unique_id": "120"
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [chapterName],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 4123,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": ["1708"],
                        "left_parenthesis": false,
                        "operator": "Equals",
                        "query_field_id": 4151,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [
                            {
                                "year": 2022,
                                "day": 30,
                                "month": 6
                            }
                        ],
                        "operator": "GreaterThan",
                        "query_field_id": 4125
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "left_parenthesis": false,
                        "operator": "Blank",
                        "query_field_id": 4148,
                        "right_parenthesis": false
                    },
                    {
                        "compare_type": "And",
                        "filter_values": [],
                        "left_parenthesis": false,
                        "operator": "Blank",
                        "query_field_id": 14682,
                        "right_parenthesis": true,
                        "unique_id": "594"
                    }
                ],
                "gift_processing_options": {
                    "matching_gift_credit_option": "MatchingGiftCompany",
                    "soft_credit_option": "Donor",
                    "use_gross_amount_for_covenants": false
                },
                "select_fields": [
                    {
                        "query_field_id": 349,
                        "user_alias": "ID"
                    },
                    {
                        "query_field_id": 597
                    },
                    {
                        "query_field_id": 2217,
                        "user_alias": "Code"
                    },
                    {
                        "query_field_id": 4125,
                        "user_alias": "From_Date"
                    },
                    {
                        "query_field_id": 4127,
                        "user_alias": "Relation_ID"
                    },
                    {
                        "query_field_id": 4151,
                        "user_alias": "Recip"
                    },
                    {
                        "query_field_id": 656,
                        "unique_id": "37",
                        "user_alias": "Candidate_Fee_Paid"
                    },
                    {
                        "query_field_id": 656,
                        "unique_id": "42",
                        "user_alias": "Initiate_Fee_Paid"
                    },
                    {
                        "query_field_id": 2216,
                        "user_alias": "CodeID"
                    }
                ],
                "sort_fields": [
                    {
                        "query_field_id": 2217,
                        "sort_order": "Ascending"
                    },
                    {
                        "query_field_id": 597,
                        "sort_order": "Ascending"
                    }
                ],
                "suppress_duplicates": true,
                "type_id": 18,
                "sql_generation_mode": "Query"
            }
        };
    }
    
    // Public API
    return {
        buildCandidatesQuery,
        buildInitiatesQuery,
        buildTopBadgeQuery,
        buildRosterQuery,
        buildOfficerQuery,
        buildChapterContactQuery,
        buildReturningStudentsQuery
    };
})();

// Make it available globally
window.Queries = Queries;

// Also expose functions globally for backward compatibility
window.buildCandidatesQuery = Queries.buildCandidatesQuery;
window.buildInitiatesQuery = Queries.buildInitiatesQuery;
window.buildTopBadgeQuery = Queries.buildTopBadgeQuery;
window.buildRosterQuery = Queries.buildRosterQuery;
window.buildOfficerQuery = Queries.buildOfficerQuery;
window.buildChapterContactQuery = Queries.buildChapterContactQuery;
window.buildReturningStudentsQuery = Queries.buildReturningStudentsQuery;