            /**
             *@NApiVersion 2.x
            *@NScriptType Suitelet
            */
            define(['N/file', "N/ui/serverWidget", "../lib/moment.min.js", "N/search", "N/runtime", "N/url", "N/redirect"],
            function (file, serverWidget, moment, search, runtime, url, redirect) {

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
                    } else {
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
                    var nameFile = '[' + dest + ']' + date + '_' + norek + '.csv';
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
                    return 'a';
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
                        var fieldgroup = form.addFieldGroup({
                            id: 'fieldgroupid',
                            label: 'Type & Range Doc Number'
                        });
                        
                        var transtype = form.addField({
                            id: 'custpage_type',
                            type: serverWidget.FieldType.SELECT,
                            label: "Transaction Type",
                            source: 'customlist_me_mandiritrans_type',
                            container: 'fieldgroupid'
                        });
                        transtype.isMandatory = true;
                        
                        var startdate = form.addField({
                            id: 'custpage_startdate',
                            type: serverWidget.FieldType.DATE,
                            label: "Start Date",
                            container: 'fieldgroupid'
                        });
                        startdate.isMandatory = true;

                        var enddate = form.addField({
                            id: 'custpage_enddate',
                            type: serverWidget.FieldType.DATE,
                            label: "End Date",
                            container: 'fieldgroupid'
                        });
                        enddate.isMandatory = true;


                        var inlinePrefix3 = form.addField({
                            id: 'custpage_inlineprefix3',
                            type: serverWidget.FieldType.TEXT,
                            label: "START",
                            container: 'fieldgroupid'
                        }).updateLayoutType({
                            layoutType: serverWidget.FieldLayoutType.STARTROW
                        }).updateDisplaySize({
                            height: 5,
                            width: 6
                        }).updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        }).defaultValue = 'CHECK#';

                        var startchecknumber = form.addField({
                            id: 'custpage_startchecknumber',
                            type: serverWidget.FieldType.INTEGER,
                            label: " ",
                            container: 'fieldgroupid'
                        }).updateLayoutType({
                            layoutType: serverWidget.FieldLayoutType.MIDROW
                        }).updateDisplaySize({
                            height: 10, 
                            width: 10
                        });

                        var inlinePrefix4 = form.addField({
                            id: 'custpage_inlineprefix4',
                            type: serverWidget.FieldType.TEXT,
                            label: "END",
                            container: 'fieldgroupid'
                        }).updateLayoutType({
                            layoutType: serverWidget.FieldLayoutType.MIDROW
                        }).updateDisplaySize({
                            height: 5,
                            width: 6
                        }).updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        }).defaultValue = 'CHECK#';

                        var endchecknumber = form.addField({
                            id: 'custpage_endchecknumber',
                            type: serverWidget.FieldType.INTEGER,
                            label: " ",
                            container: 'fieldgroupid'
                        }).updateLayoutType({
                            layoutType: serverWidget.FieldLayoutType.ENDROW
                        }).updateDisplaySize({
                            height: 10,
                            width: 10
                        });

                        context.response.writePage(form);

                    } else {
                        /**
                         * Getting parameter data from page
                         */
                        var transType = context.request.parameters.custpage_type;
                        var startDate = context.request.parameters.custpage_startdate;
                        var endDate = context.request.parameters.custpage_enddate;
                        var startCheckNum = context.request.parameters.custpage_startchecknumber ? context.request.parameters.custpage_startbillnumber : 0;
                        var endCheckNum = context.request.parameters.custpage_endchecknumber > 0 ? context.request.parameters.custpage_endchecknumber : 20000;
                        
                        filters = [
                            //mainline filter
                            search.createFilter({ name: "mainline", operator: search.Operator.IS, values: 'T' })
                        ]
                        
                        //Approval Filter, except Voided/
                        filters.push(search.createFilter({ name : "status", operator: search.Operator.NONEOF, values: "Check:V" }));              
                        //Filter to Payee: not One TIme Vendor
                        filters.push(search.createFilter({ name : "name", operator: search.Operator.NONEOF, values: "637" }));          
                        
                        //COA FILTER
                        filters.push(search.createFilter({ name : "accountmain", operator: search.Operator.ANYOF, values: ["1428","1429", "1997"]}));
                        
                        if(transType == 1){
                            //filter Type is any Bill Payment
                            filters.push(search.createFilter({ name : "type", operator: search.Operator.ANYOF, values: "VendPymt"}));
                            filters.push(search.createFilter({ name : "transactionnumbernumber", operator: search.Operator.BETWEEN, values: [startBillNum, endBillNum]}));
                            // filters.push(search.createFilter({ name : "account", operator: search.Operator.ANYOF, values: ["1206","1045"]}));
                        }
                        else if(transType == 2){    
                            //filter Type is any Check
                            filters.push(search.createFilter({ name : "type", operator: search.Operator.ANYOF, values: "Check"}));
                            filters.push(search.createFilter({ name : "transactionnumbernumber", operator: search.Operator.BETWEEN, values: [startCheckNum, endCheckNum]}));
                            // filters.push(search.createFilter({ name : "account", operator: search.Operator.ANYOF, values: ["1206","1045"]}));
                        }
                        else{
                            //filter Type is Bill Payment and Check
                            filters.push(search.createFilter({ name : "type", operator: search.Operator.ANYOF, values: ["VendPymt","Check"]}));
                        }
                        
                        //CSV Status Filter
                        filters.push(search.createFilter({ name : "custbody_me_custom_body_csvstatus", operator: search.Operator.IS, values: "F"}));

                        //Date Filter
                        filters.push(search.createFilter({ name : "trandate", operator: search.Operator.WITHIN, values: [startDate, endDate]}));

                        var tranSearch = search.create({
                            type: "check",
                            filters: filters ,
                            columns:
                            [
                                
                            
                            search.createColumn({name: "mainline", label: "*"}),

                            search.createColumn({name: "trandate", sort: search.Sort.ASC, label: "Date"}),
                            
                            search.createColumn({name: "mainline", label: "*"}),
                            
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
                            
                            search.createColumn({name: "memo", label: "Memo"})
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
                        var address = ';;';
                        var currency;
                        var gross_amt;
                        var remark_1 = " ";
                        var ref_number = " ";
                        var service = "LBU";
                        var benef_code = " ";
                        var bank_name;
                        var kolom_mp = ';;;';
                        var y = "Y";
                        var email = 'cs.spvleader@anteraja.id';
                        var blankspace = ';;;;;;;;;;;;;;;;;;;;;';
                        var memo;      
                        
                        var var_do = 0;   
                        var files = [];  
                        do {
                            var tranSearchResult = tranSearch.run().getRange({
                                start: startRow,
                                end: startRow + pageSize
                            });
                            log.debug("Search Result", tranSearchResult);
                            // log.debug('var_do', var_do);

                            if(tranSearchResult.length > 0){    
                                log.debug('debet_source', debet_source);
                                var count = 0;
                                var jlh_tf = 0;    
                                var headerRow = '';

                                var bodyRowMandiri = '';
                                var rawContentMandiri = '';

                                var bodyRowNon = '';
                                var rawContentNon = '';
                                
                                var tgl = tranSearchResult[0].getValue('trandate');
                                var acc = tranSearchResult[0].getValue('accountmain');
                                
                                var stat_mandiri = 0;
                                var stat_non = 0;
                                // for(var i = 0; i < tranSearchResult.length; i++){
                                var i = 0;
                                while(i < tranSearchResult.length){
                                // }
                                    // if(checkAccount(tranSearchResult[i].getValue('transactionnumber').substring(5,9)) == 0){
                                    //     log.debug('NOT FOUND', 'TIDAK DITEMUKAN COA');
                                    //     i++;
                                    //     continue;
                                    // }
                            
                                    if(tranSearchResult[i].getValue('trandate') === tgl){
                                        
                                        if(tranSearchResult[i].getValue('accountmain') === acc){
                                            date = tranSearchResult[i].getValue('trandate');
                                            date = dateFormat(date);
                                            date = formatValue(date);
                                            
                                            debet_source = formatValue(tranSearchResult[i].getText('accountmain'));
                                            debet_source = debet_source.substring(debet_source.length - 17, debet_source.length);
                                            debet_source = debet_source.replace(/\./g, '');
                                            log.debug('debet_source[' + i + ']', debet_source);

                                            count++;
                                            
                                            gross_amt = Number(tranSearchResult[i].getValue('grossamount'));
                                            jlh_tf += gross_amt;
                                            
                                            norek_penerima = formatValue(tranSearchResult[i].getValue('custentity_bankaccountno'));
                                            payee = formatValue(tranSearchResult[i].getText('entity'));
                                            currency = formatValue(tranSearchResult[i].getText('currency'));
                                            bank_name = formatValue(tranSearchResult[i].getValue('custentity_bankname'));
                                            memo = formatValue(tranSearchResult[i].getValue('memo'));
                                            
                                            if(bank_name.toLowerCase() == 'mandiri'){
                                                bodyRowMandiri += norek_penerima + ';' +  payee + ';' + address + ';' + 
                                                                currency + ';' +  gross_amt + ';' +  remark_1 + ';' +
                                                                ref_number + ';' + service + ';' + benef_code + ';' +
                                                                bank_name + ';' + kolom_mp + ';' + y + ';' + email + ';' +
                                                                blankspace + ';' + memo + '\n';
                                                stat_mandiri = 1;
                                            }
                                            else{
                                                bodyRowNon += norek_penerima + ';' +  payee + ';' + address + ';' + 
                                                            currency + ';' +  gross_amt + ';' +  remark_1 + ';' +
                                                            ref_number + ';' + service + ';' + benef_code + ';' +
                                                            bank_name + ';' + kolom_mp + ';' + y + ';' + email + ';' +
                                                            blankspace + ';' + memo + '\n';
                                                stat_non = 1;
                                            }
                                        }
                                        else{
                                            headerRow = p + ';' + date + ';' + debet_source + ';' + count + ';' + jlh_tf + '\n';

                                            if(stat_mandiri === 1){
                                                rawContentMandiri += (headerRow + bodyRowMandiri);
                                                files.push(cetakFile(rawContentMandiri, 'InHouse', date, debet_source, context));
                                            } 
                                            if(stat_non === 1){
                                                rawContentNon += (headerRow + bodyRowNon);
                                                files.push(cetakFile(rawContentNon, 'Domestik', date, debet_source, context));
                                            } 
                                        
                                            stat_mandiri = 0;
                                            stat_non = 0;

                                            rawContentMandiri = '';
                                            bodyRowMandiri = '';
                                            
                                            rawContentNon = '';
                                            bodyRowNon = '';

                                            headerRow = '';
                                            count = 0;
                                            jlh_tf = 0;
                                            acc = tranSearchResult[i].getValue('accountmain');
                                            continue;
                                        }
                                    }
                                    else{
                                        headerRow = p + ';' + date + ';' + debet_source + ';' + count + ';' + jlh_tf + '\n';

                                        if(stat_mandiri === 1){
                                            rawContentMandiri += (headerRow + bodyRowMandiri);
                                            files.push(cetakFile(rawContentMandiri, 'InHouse', date, debet_source, context));
                                        } 
                                        if(stat_non === 1){
                                            rawContentNon += (headerRow + bodyRowNon);
                                            files.push(cetakFile(rawContentNon, 'Domestik', date, debet_source, context));
                                        } 
                                        
                                        stat_mandiri = 0;
                                        stat_non = 0;

                                        rawContentMandiri = '';
                                        bodyRowMandiri = '';
                                        
                                        rawContentNon = '';
                                        bodyRowNon = '';

                                        headerRow = '';
                                        count = 0;
                                        jlh_tf = 0;
                                        tgl = tranSearchResult[i].getValue('trandate');
                                        acc = tranSearchResult[i].getValue('accountmain');
                                        continue;
                                    }

                                    if(i == tranSearchResult.length - 1){
                                        headerRow = p + ';' + date + ';' + debet_source + ';' + count + ';' + jlh_tf + '\n';

                                        if(stat_mandiri === 1){
                                            rawContentMandiri += (headerRow + bodyRowMandiri);
                                            files.push(cetakFile(rawContentMandiri, 'InHouse', date, debet_source, context));
                                        } 
                                        if(stat_non === 1){
                                            rawContentNon += (headerRow + bodyRowNon);
                                            files.push(cetakFile(rawContentNon, 'Domestik', date, debet_source, context));
                                        } 
                                    }
                                    i++;
                                }
                                //end of looping
                            }
                            var_do++;
                            startRow += pageSize;
                        }while(tranSearchResult.length === pageSize);
                        
                        //     context.response.writeFile({
                        //         file: files[j],
                        //         isInline: false
                        //     });

                        // for(var j=files.length-1; j>=0; j--){
                        //     context.response.writeFile({
                        //         file: files[j],
                        //         isInline: false
                        //     });
                        //     log.debug('LOOP ke[' + j + ']', 'AKHIR CODE');                        
                        // }
                        // var fileObj_2 = file.create({
                        //     name: 'file2.csv',
                        //     fileType: file.Type.CSV,
                        //     contents: 'b;b;b;b'
                        // });
                        // context.response.writeFile({
                        //     file: fileObj_2,
                        //     isInline: false
                        // });

                        // var fileObj_1 = file.create({
                        //     name: 'file1.csv',
                        //     fileType: file.Type.CSV,
                        //     contents: 'a;a;a;a'
                        // },
                        // {
                        //     name: 'file2.csv',
                        //     fileType: file.Type.CSV,
                        //     contents: 'b;b;b;b'
                        // }
                        // );

                        // context.response.writeFile({
                        //     file: fileObj_1,
                        //     isInline: false
                        // });

                        // var fileObj = file.create({
                        //     name: 'testHelloWorld3.txt',
                        //     fileType: file.Type.PLAINTEXT,
                        //     contents: 'Hello World\nHello World',
                        //     folder: -15,
                        //     isOnline: true
                        // });
                    
                        // // Save the file
                        // var id = fileObj.save();
                    
                        // // Load the same file to ensure it was saved correctly
                        // fileObj = file.load({
                        //     id: id
                        // });
        

         
                        log.debug('AKHIR', 'AKHIR CODE');                        
                    }
                }

                return {
                    onRequest: onRequest
                }
            });