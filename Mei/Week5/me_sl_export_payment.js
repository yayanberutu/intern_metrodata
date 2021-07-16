/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*/
define(['N/file', "N/ui/serverWidget", "../lib/moment.min.js", "N/search", "N/runtime", "N/url", "N/redirect", "N/record", "N/ui/dialog"],
    function (file, serverWidget, moment, search, runtime, url, redirect, record, dialog) {
    
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
        
        function dateFormat(data){
            data = data.replace('/', '');
            data = data.replace('/', '');
            // log.debug("tanggal first", data);
            // 01 23 4567
            var newdata = data.substring(4,8) + data.substring(2,4) + data.substring(0,2);
            return newdata;
        }

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
                
        function cetakFile(rawContent, dest, date, norek, context){
            var nameFile = dest + date + '_' + norek + '.csv';
            log.debug('CETAK FILE', nameFile);
            log.debug('rawContent', rawContent);
            var fileObj = file.create({
                name: nameFile,
                fileType: file.Type.CSV,    
                contents: rawContent,
            });
            context.response.writeFile({
                file: fileObj,
                isInline: false
            });
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
                title: 'CSV Payment Bank Mandiri'
            });

            var scriptObj = runtime.getCurrentScript();
            if (context.request.method === 'GET') {
                form.addSubmitButton({
                label: 'Export'
            });
            
            form.clientScriptModulePath = 'SuiteScripts/Metrodata/me_cs_validate_export_mandiripayment.js';
                        
            var fieldgroup = form.addFieldGroup({
                id: 'fieldgroupid',
                label: 'Type & Range Doc Number'
            });
            
            var transtype = form.addField({
                id: 'custpage_type',
                type: serverWidget.FieldType.SELECT,
                label: "Transaction Type",
                container: 'fieldgroupid'
            }).addSelectOption({
                value : 1,
                text : 'Write Check' 
            });
                                                
            // 10120100 Cash & Bank : Cash in Bank : JKT HO - IDR - Mandiri 120.001.108.4238 //1428 
            // 10120200 Cash & Bank : Cash in Bank : JKT HO - IDR - Mandiri 120.001.113.7598 //1429
            // 10121300 Cash & Bank : Cash in Bank : JKT HO - IDR - Mandiri 102.000.050.5005 //1997
            var sourcedebet = form.addField({
                id : 'custpage_sourcedebet',
                type : serverWidget.FieldType.SELECT,
                label : 'Debet Source',
                container : 'fieldgroupid'
            });
            
            sourcedebet.addSelectOption(
                {value: 1428, text: '10120100 Cash & Bank : Cash in Bank : JKT HO - IDR - Mandiri 120.001.108.4238'}
            );
            sourcedebet.addSelectOption(
                {value: 1429, text: '10120200 Cash & Bank : Cash in Bank : JKT HO - IDR - Mandiri 120.001.113.7598'}
            );
            sourcedebet.addSelectOption(
                {value: 1997, text: '10121300 Cash & Bank : Cash in Bank : JKT HO - IDR - Mandiri 102.000.050.5005'}
            );

            var datefilter = form.addField({
                id: 'custpage_datefilter',
                type: serverWidget.FieldType.DATE,
                label: "Date",
                container: 'fieldgroupid'
            });
            
            datefilter.isMandatory = true;

            var destination = form.addField({
                id: 'custpage_destination',
                type: serverWidget.FieldType.SELECT,
                label: 'Destination',
                container: 'fieldgroupid'
            });
            destination.addSelectOption({
                value: 'in',
                text: 'In House Transfer'
            })
            destination.addSelectOption({
                value: 'out',
                text: 'Domestic Transfer'
            })                        

            context.response.writePage(form);

            } else {
                /**
                * Getting parameter data from page
                */
                var transType = context.request.parameters.custpage_type;
                var dateFilter = context.request.parameters.custpage_datefilter;
                var sourceDebet = context.request.parameters.custpage_sourcedebet;
                var dest = context.request.parameters.custpage_destination;
                log.debug('DATE FILTER', dateFilter);
                log.debug('SOURCE DEBET', sourceDebet);
                log.debug('DESTINATION', dest);
                filters = [
                    //mainline filter
                    search.createFilter({ name: "mainline", operator: search.Operator.IS, values: 'T' })
                ]
                
                //Approval Filter, except Voided
                filters.push(search.createFilter({ name : "status", operator: search.Operator.NONEOF, values: "Check:V" }));              
                //Filter to Payee: not One TIme Vendor
                filters.push(search.createFilter({ name : "name", operator: search.Operator.NONEOF, values: "637" }));          
                
                //COA FILTER
                filters.push(search.createFilter({ name : "accountmain", operator: search.Operator.ANYOF, values: sourceDebet}));
                filters.push(search.createFilter({ name : "type", operator: search.Operator.ANYOF, values: "Check"}));
                        
                //CSV Status Filter
                filters.push(search.createFilter({ name : "custbody_me_custom_body_csvstatus", operator: search.Operator.IS, values: "F"}));

                //Date Filter
                filters.push(search.createFilter({ name : "trandate", operator: search.Operator.WITHIN, values: [dateFilter, dateFilter]}));
                        
                if(dest == 'in'){
                    filters.push(search.createFilter({ name : "custentity_bankname", join: "vendor", operator: search.Operator.CONTAINS, values: 'mandiri'}));
                }
                else {
                    filters.push(search.createFilter({ name : "custentity_bankname", join: "vendor", operator: search.Operator.DOESNOTCONTAIN, values: 'mandiri'}));
                }

                var tranSearch = search.create({
                    type: "check",
                    filters: filters,
                    columns:
                    [
                    //0
                    search.createColumn({name: "mainline", label: "*"}),
                    //1
                    search.createColumn({name: "trandate", sort: search.Sort.ASC, label: "Date"}),
                    //2
                    search.createColumn({name: "accountmain", sort: search.Sort.ASC, label: "Account (Main)"}),
                    //3
                    search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
                    //4
                    search.createColumn({
                        name: "custentity_bankaccountno",
                        join: "vendor",
                        label: "Bank Account No."
                    }),
                    //5
                    search.createColumn({name: "entity", label: "Name"}),                    
                    //6
                    search.createColumn({name: "currency", label: "Currency"}),
                    //7
                    search.createColumn({name: "grossamount", label: "Amount (Gross)"}),
                    //8
                    search.createColumn({
                        name: "custentity_bankname",
                        join: "vendor",
                        label: "Bank Name"
                    }),
                    //9        
                    search.createColumn({name: "memo", label: "Memo"}),
                    //10
                    search.createColumn({name: "recordtype", label: "Record Type"}),
                    //11
                    search.createColumn({name: "internalid", label: "Internal ID"})
                      
                    ]
                });
                        
                /*
                *   Variable will be written
                *
                */
                var startRow = 0;
                var pageSize = 1000;
                        
                // Baris 1
                var p = "P";
                var date;
                var debet_source = "";
                        
                // Baris 2
                var norek_penerima;
                var payee;
                var address = ',,';
                var currency;
                var gross_amt;
                var remark_1 = " ";
                var ref_number = " ";
                var service = " ";
                var benef_code = " ";
                var bank_name;
                var kolom_mp = ',,,';
                var y = "Y";
                var email = 'cs.spvleader@anteraja.id';
                var blankspace = ',,,,,,,,,,,,,,,,,,,,,';
                var memo;      
                        
                do {
                    var tranSearchResult = tranSearch.run().getRange({
                    start: startRow,
                    end: startRow + pageSize
                    });
                
                log.debug("Search Result", tranSearchResult);
                // if(tranSearchResult.length === 0){
                //     redirect.toSuitelet({
                //         scriptId: '330',
                //         deploymentId: '1'
                //     });
                //     return ;
                // }
                if(tranSearchResult.length > 0){    
                    log.debug('debet_source', debet_source);
                    var count = 0;
                    var jlh_tf = 0;    
                    var headerRow = ''
                    
                    var bodyRow = '';
                    var rawContent = '';

                    var tgl = tranSearchResult[0].getValue('trandate');
                    var acc = tranSearchResult[0].getValue('accountmain');
                                
                    // for(var i = 0; i < tranSearchResult.length; i++){
                    // var i = 0;
                    for(var i=0; i<tranSearchResult.length; i++){
                        if(checkAccount(tranSearchResult[i].getValue('transactionnumber').substring(5,9)) == 0){
                            log.debug('NOT FOUND', 'TIDAK DITEMUKAN COA');
                            continue;
                        }
                        var rec = record.load({
                            type: tranSearchResult[i].getValue('recordtype'),
                            id: tranSearchResult[i].getValue('internalid')
                        });


                        log.debug('RECORD', rec);
                        date = tranSearchResult[i].getValue('trandate');
                        date = dateFormat(date);
                        date = formatValue(date);
                                    
                        debet_source = formatValue(tranSearchResult[i].getText('accountmain'));
                        debet_source = debet_source.substring(debet_source.length - 17, debet_source.length);
                        debet_source = debet_source.replace(/\./g, '');
                        log.debug('debet_source[' + i + ']', debet_source);
                                    
                        gross_amt = Number(tranSearchResult[i].getValue('grossamount'));
                        gross_amt = Math.abs(gross_amt);
                        jlh_tf += gross_amt;
                                    
                        norek_penerima = formatValue(tranSearchResult[i].getValue(tranSearchResult[i].columns[4]));
                        
                        norek_penerima = String(norek_penerima);
                        log.debug('TYPE OF NOREK PENERIMA', typeof(norek_penerima));
                        log.debug('NOREK PENERIMA AwAL', norek_penerima);
                        log.debug('LENGTH', norek_penerima.length);
                        

                        if(norek_penerima === 'null'){
                            norek_penerima = ' ';
                            log.debug('NOREK PENERIMA NULL', norek_penerima);
                        }
                        log.debug('NOREK Penerima setelah pengecekan', norek_penerima);

                        payee = formatValue(tranSearchResult[i].getText('entity'));
                        currency = formatValue(tranSearchResult[i].getText('currency'));
                        bank_name = formatValue(tranSearchResult[i].getValue(tranSearchResult[i].columns[8]));
                                    
                        if(bank_name === 'null'){
                            bank_name = ' ';
                        }

                        memo = formatValue(tranSearchResult[i].getValue('memo'));

                        bodyRow += norek_penerima + ',' +  payee + ',' + address + ',' + 
                            currency + ',' +  gross_amt + ',' +  remark_1 + ',' +
                            ref_number + ',' + service + ',' + benef_code + ',' +
                            bank_name + ',' + kolom_mp + ',' + y + ',' + email + ',' +
                            blankspace + ',' + memo + '\n';
                                    
                        //update rec stat
                        rec.setValue('custbody_me_custom_body_csvstatus', true);
                        rec.save();
                        count++;
                    }

                    // if(count === 0){
                    //     alert("Write Check Already Generated", "Write Check with Account Bank Number " + debet_source + " already generated, you cannot generated twice!")
                    // }
                    log.debug('COUNT', count);
                    headerRow = p + ',' + date + ',' + debet_source + ',' + count + ',' + jlh_tf + '\n';
                    rawContent = headerRow + bodyRow;
                    //end of looping
                }
                startRow += pageSize;
            }while(tranSearchResult.length === pageSize);
            
            if(destination == 'in'){
                var dest = '[IN]';
            }
            else var dest = '[OUT]';

            cetakFile(rawContent,dest,date, debet_source, context);
            
            log.debug('AKHIR', 'AKHIR CODE');
        }
    }
    
    return {
        onRequest: onRequest
    }
});