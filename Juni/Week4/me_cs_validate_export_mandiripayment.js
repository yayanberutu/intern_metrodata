/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/url', 'N/search', 'N/record'], function(url, search, record) {

    function checkAccount(tran_number){
        var checkSearchObj = search.create({
            type: "check",  
            filters:
            [
            ["type","anyof","Check"], 
            "AND", 
            ["account","anyof","1206","1045"], 
            "AND", 
            ["transactionnumbernumber","equalto",tran_number]
            ],
            columns:
            [
            search.createColumn({
                name: "ordertype",
                sort: search.Sort.ASC,
                label: "Order Type"
            }),
            search.createColumn({name: "mainline", label: "*"}),
            search.createColumn({name: "trandate", label: "Date"})
            ]
        });
        var searchResultCount = checkSearchObj.runPaged().count;
        log.debug('count checkaccount', searchResultCount);
        return searchResultCount;
    }

    function saveRecord(context) {
        var rec = context.currentRecord;

        var dateFilter = rec.getText("custpage_datefilter");
        var sourceDebet = rec.getValue("custpage_sourcedebet");
        var dest = rec.getValue("custpage_destination");
        var type = rec.getValue("custpage_type");
        // alert(dateFilter + sourceDebet + dest + type);
        log.debug("DATE FILTER", dateFilter);
        log.debug("SOURCE DEBET", sourceDebet);
        log.debug("DEST", dest);
        filters = [
            //mainline filter
            search.createFilter({ name: "mainline", operator: search.Operator.IS, values: 'T' })
        ]
        var tipe = "";
        var tipe_alert;
        if(type == 1){
            tipe = "Check";
            tipe_alert = "Write Check";

            //Approval Filter, only Aprroved for Bill Payment and except Voided for Check 
            filters.push(search.createFilter({ name : "status", operator: search.Operator.NONEOF, values: "Check:V" }));
        }
        else if(type == 2){
            tipe = "VendPymt";
            tipe_alert = "Bill Payment";
            filters.push(search.createFilter({ name : "custbody_me_bulk_payment", operator: search.Operator.ANYOF, values: "1"}));
            //Approval Filter, only Aprroved for Bill Payment and except Voided for Check 
            filters.push(search.createFilter({ name : "status", operator: search.Operator.ANYOF, values: "VendPymt:F" }));
        }

        filters.push(search.createFilter({ name : "type", operator: search.Operator.ANYOF, values: tipe}));
           
        //Filter to Payee: not One TIme Vendor
        filters.push(search.createFilter({ name : "name", operator: search.Operator.NONEOF, values: "637" }));          
        
        //COA FILTER
        filters.push(search.createFilter({ name : "accountmain", operator: search.Operator.ANYOF, values: sourceDebet}));
        
        
        //CSV Status Filter
        // filters.push(search.createFilter({ name : "custbody_me_custom_body_csvstatus", operator: search.Operator.IS, values: "F"}));

        //Date Filter
        filters.push(search.createFilter({ name : "trandate", operator: search.Operator.ON, values: dateFilter}));
        
        if(dest == 'in'){
            filters.push(search.createFilter({ name : "custentity_bankname", join: "vendor", operator: search.Operator.CONTAINS, values: 'mandiri'}));
        }
        else {
            filters.push(search.createFilter({ name : "custentity_bankname", join: "vendor", operator: search.Operator.DOESNOTCONTAIN, values: 'mandiri'}));
        }

        var tranSearch = search.create({
            type: "vendorpayment",
            filters: filters,
            columns:
            [  
            search.createColumn({name: "accountmain", sort: search.Sort.ASC, label: "Account (Main)"}),
            search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
            search.createColumn({
                name: "custentity_bankaccountno",
                join: "vendor",
                label: "Bank Account No."
            }),
            search.createColumn({name: "entity", label: "Name"}),                    
            search.createColumn({name: "currency", label: "Currency"}),
            search.createColumn({name: "grossamount", label: "Amount (Gross)"}),
            search.createColumn({
                name: "custentity_bankname",
                join: "vendor",
                label: "Bank Name"
            }),
            search.createColumn({name: "memo", label: "Memo"}),
            search.createColumn({name: "recordtype", label: "Record Type"}),
            search.createColumn({name: "internalid", label: "Internal ID"}),
            search.createColumn({name: "custbody_me_custom_body_csvstatus", label: "CSV Status"})
            ]
        });

        // /*
        // *   Variable will be written
        // *
        // */
        var startRow = 0; var pageSize = 1000; var debet_source = "";

        var searchResultCount = tranSearch.runPaged().count;
        do{
            var tranSearchResult = tranSearch.run().getRange({
                    start: startRow,
                    end: startRow + pageSize
            });
            log.debug("Search Result", tranSearchResult);
            if(tranSearchResult.length === 0){
                alert(tipe_alert + " doesn't exist!");
                    return false ;
            }
            if(tranSearchResult.length > 0){    
                var count = 0;
                for(var i=0; i<tranSearchResult.length; i++){
                    if(type == 1){
                        if(checkAccount(tranSearchResult[i].getValue('transactionnumber').substring(5,9)) == 0){
                            log.debug('NOT FOUND', 'TIDAK DITEMUKAN COA');
                            continue;
                        }
                    }

                    debet_source = tranSearchResult[i].getText('accountmain');
                    debet_source = debet_source.substring(debet_source.length - 17, debet_source.length);
                    debet_source = debet_source.replace(/\./g, '');
                    var csv_stat = tranSearchResult[i].getValue('custbody_me_custom_body_csvstatus');
                    // alert("CSV STAT WITH DEBET " + debet_source +" IS " + csv_stat);
                    log.debug("CSV STATUS", csv_stat);
                    if(!csv_stat){
                        count++;;
                    }
                }

                if(count === 0){
                    alert(tipe_alert + " with Account Bank Number " + debet_source + " already generated, you cannot generated twice!")
                    return false;
                }
                //end of looping
                startRow += pageSize;
            }
        }
        while(tranSearchResult.length === pageSize);
        // alert("WOI " + searchResultCount);
        return true;
    }


    return {
        saveRecord: saveRecord
    }
});
