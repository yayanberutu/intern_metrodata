/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*/
define(['N/file', "N/ui/serverWidget", "N/search", "N/runtime", "N/url", "N/redirect", "N/record", "N/ui/dialog"],
    function (file, serverWidget,  search, runtime, url, redirect, record, dialog) {
    
        /**            
        * This function purpose is to replace null or empty value with 0, and replace ',' with ';'
        *
        * @param {*} data
        * @return {*} 
        */
        function formatValue(data) {
            var retVal = '';
            var newData = String(data);
            if (typeof newData == 'undefined' || !newData) {
                retVal = '0';
            } 
            else {
                raw1 = newData.replace(/(\r\n|\n|\r)/gm, " ");
                retVal = raw1.replace(',',  ';');
            }

            return retVal;
        }
        function changeDateFormat(date){
            var tgl = date.split("/", 3);
            var newDate = tgl[1] + "/" + tgl[0] + "/" + tgl[2];
            return newDate;
        }
        /**
        * This the main function on suitelet. Creating custom page and calculation amount 
        *
        * @param {*} context
        * @return {*} 
        */
        
        function onRequest(context) {
            /**
            * Creating form,filtering,and button on e-faktur page.
            */
            var form = serverWidget.createForm({
                title: 'Export Prepayment'
            });

            var scriptObj = runtime.getCurrentScript();
            if (context.request.method === 'GET') {
                form.addSubmitButton({
                label: 'Export'
            });
                        
            var fieldgroup = form.addFieldGroup({
                id: 'fieldgroupid',
                label: 'Job Order & As of Date'
            });
            

            var joborder = form.addField({
                id : 'custpage_joborder',
                type : serverWidget.FieldType.SELECT,
                label : 'Job Order',
                container : 'fieldgroupid'
            });
            
            var jobOrderResult = search.create({
                type: "classification",
                filters:
                [
                ],
                columns:
                [
                   search.createColumn({
                      name: "name",
                      sort: search.Sort.ASC,
                      label: "Name"
                   }),
                   search.createColumn({name: "internalid", label: "Internal ID"})
                ]
             }).run().getRange({
                start: 0,
                end: 1000
            });
            joborder.addSelectOption({value: 0, text: ""});
            for(var i=0; i<jobOrderResult.length; i++){
                joborder.addSelectOption({value: jobOrderResult[i].getValue("internalid"), text: jobOrderResult[i].getValue("name")});
            }
            var categoryfield = form.addField({
                id : 'custpage_category',
                type : serverWidget.FieldType.SELECT,
                label : 'Category',
                container : 'fieldgroupid'
            });
            categoryfield.addSelectOption({value: 0, text: ""});
            categoryfield.addSelectOption({value: 7, text: "Employee / Swakelola"}); 
            categoryfield.addSelectOption({value: 9, text: "Supplier / Subkon"});
            var datefilter = form.addField({
                id: 'custpage_datefilter',
                type: serverWidget.FieldType.DATE,
                label: "As of Date",
                container: 'fieldgroupid'
            });            
            datefilter.isMandatory = true;


            context.response.writePage(form);

            } else {
                /**
                * Getting parameter data from page
                */

                var jobOrder = context.request.parameters.custpage_joborder;
                var dateFilter = context.request.parameters.custpage_datefilter;
                var categoryField = context.request.parameters.custpage_category;
                filters = [search.createFilter({ name: "type", operator: search.Operator.ANYOF, values: "VPrep" })] //Type Filter must be Vendor Prepayment
                filters.push(search.createFilter({ name: "custbody_me_cti_approval_status", operator: search.Operator.ANYOF, values: 28 })); // must be Final Approved
                filters.push(search.createFilter({ name: "custbody_me_status_payment", operator: search.Operator.ANYOF, values: 1 }));// must be open
                filters.push(search.createFilter({ name: "formulanumeric", formula: "{amount} - {amountpaid}",  operator: search.Operator.GREATERTHAN, values: 0 }));
                filters.push(search.createFilter({ name: "status", operator: search.Operator.NONEOF, values: "VPrep:F" })); 
                if(categoryField != 0){
                    filters.push(search.createFilter({ name: "category", join: "vendor", operator: search.Operator.ANYOF, values: categoryField }));
                }
                if(jobOrder != 0){
                    filters.push(search.createFilter({ name: "class", operator: search.Operator.ANYOF, values: jobOrder }));
                }
                var prepaymentSearch = search.create({
                    type: "vendorprepayment",
                    filters: filters,
                    columns:
                    [
                        //0
                       search.createColumn({
                          name: "trandate",
                          summary: "GROUP",
                          label: "Date"
                       }),
                       //1
                       search.createColumn({
                          name: "altname",
                          join: "vendor",
                          summary: "GROUP",
                          label: "Name"
                       }),
                       //2
                       search.createColumn({
                          name: "class",
                          summary: "GROUP",
                          label: "CTI-Job Order"
                       }),
                       //3
                       search.createColumn({
                          name: "amount",
                          summary: "MAX",
                          label: "Amount"
                       }),
                       //4
                       search.createColumn({
                          name: "amountpaid",
                          summary: "MAX",
                          label: "Amount Paid"
                       }),
                       //5
                       search.createColumn({
                          name: "formulacurrency",
                          summary: "MAX",
                          formula: "MAX({amount}) - MAX({amountpaid})",
                          label: "SISA"
                       }),
                       //6
                       search.createColumn({
                        name: "vendtype",
                        summary: "MAX",
                        label: "Vendor Category"
                        }),
                        //7
                        search.createColumn({
                            name: "transactionnumber",
                            summary: "GROUP",
                            label: "Transaction Number"
                     })
                    ]
                 });

                var startRow = 0;
                var pageSize = 1000;

                //header
                var header = "Vendor;Category;Transaction Number;Job Order;Current;1-30 days;31-45 days;46-60 days;61-90 days; 91-120 days;121-150 days;151-365 days;>365 days;Total\n"
                var bodyRow = "";
                var diff1, diff2, diff3, diff4, diff5, diff6, diff7, diff8;
                var total_amount, total1, total2, total3, total4, total5, total6,total7,total8;
                total_amount = total1 = total2 = total3 = total4 = total5 = total6 = total7 = total8 = 0;

                log.debug("date filter before changes", dateFilter);
                dateFilter = changeDateFormat(dateFilter);
                log.debug("date filter after changes", dateFilter);
                 do{
                    var prepaymentResult = prepaymentSearch.run().getRange({
                        start: startRow,
                        end: startRow + pageSize
                    });

                    log.debug("Search Result", prepaymentResult);
                    log.debug("Banyak data", prepaymentResult.length);

                    var total_sisa_row = 0;
                    var grandtotal = 0;
                    for(var i=0; i<prepaymentResult.length; i++){
                        var tran_number = formatValue(prepaymentResult[i].getValue(prepaymentResult[i].columns[7])); 
                        var category = formatValue(prepaymentResult[i].getValue(prepaymentResult[i].columns[6]));
                        var date = formatValue(prepaymentResult[i].getValue(prepaymentResult[i].columns[0]));
                        date = changeDateFormat(date);
                        var vendor = formatValue(prepaymentResult[i].getValue(prepaymentResult[i].columns[1]));
                        var current_amount = parseInt(formatValue(prepaymentResult[i].getValue(prepaymentResult[i].columns[3])));
                        total_amount += current_amount;
                        // log.debug("vendor pada " + i,  vendor);
                        var jo = formatValue(prepaymentResult[i].getText(prepaymentResult[i].columns[2]));
                        var sisa = parseInt(formatValue(prepaymentResult[i].getValue(prepaymentResult[i].columns[5])));
                        // log.debug("sisa pada " + i,  sisa);
                        var diffDate = (new Date(dateFilter) -  new Date(date)) / (1000 * 60 * 60 * 24);
                        log.debug("Diff Date", diffDate);

                        diff1 = diff2 = diff3 = diff4 = diff5 = diff6 = diff7 = diff8 = 0;
                        total_sisa_row = 0;
                        if((diffDate >= 0) && (diffDate <=30)){
                            diff1 = sisa;
                            total1 += diff1;
                        }
                        if((diffDate >= 31) && (diffDate <=45)){
                            diff2 = sisa;
                            total2 += diff2;
                        }
                        if((diffDate >= 46) && (diffDate <=60)){
                            diff3 = sisa;
                            total3 += diff3;
                        }
                        if((diffDate >= 61) && (diffDate <=90)){
                            diff4 = sisa;
                            total4 += diff4;
                        }
                        if((diffDate >= 91) && (diffDate <=120)){
                            diff5 = sisa;
                            total5 += diff5;
                        } 
                        if((diffDate >= 121) && (diffDate <=150)){
                            diff6 = sisa;
                            total6 += diff6;
                        } 
                        if((diffDate >= 151) && (diffDate <=365)){
                            diff7 = sisa;
                            total7 += diff7;
                        } 
                        if(diffDate > 365){
                            diff8 = sisa;
                            total8 += diff8;
                        }
                        total_sisa_row += diff1 + diff2 + diff3 + diff4 + diff5 + diff6 + diff7 + diff8 ;
                        grandtotal += total_sisa_row;
                        bodyRow += vendor + ";" + category + ";"+ tran_number + ";" + jo + ";" + current_amount + ";" +
                                    diff1 + ";" + diff2 + ";" + diff3 + ";" + diff4 + ";" +
                                    diff5 + ";" + diff6 + ";" + diff7 + ";" + diff8 + ";" +
                                    total_sisa_row + "\n";
                    }   

                    startRow += pageSize;
                }
                while(prepaymentResult.length === pageSize);
                
                var footer = "";
                footer += "TOTAL;;;;" + total_amount + ";" + 
                            total1 + ";" + total2 + ";" + total3 + ";" + total4 + ";" +
                            total5 + ";" + total6 + ";" + total7 + ";" + total8 + ";" + grandtotal;
                var rawContent = header + bodyRow + footer;

                var fileName = "Report Uang Muka Aging -"+ dateFilter + ".csv";
                
                var fileObj = file.create({
                    name: fileName,
                    fileType: file.Type.CSV,
                    contents: rawContent
                });
                context.response.writeFile({
                    file: fileObj,
                    isInline: false
                });

            }   
    }
    
    return {
        onRequest: onRequest
    }
});