/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search', 'N/ui/serverWidget', 'N/log', 'N/task', 'N/redirect', 'N/url', 'N/format', './lib/moment.min', 'N/redirect', 'N/record'],
    function (search, serverWidget, log, task, redirect, url, format, moment, redirect, record) {

        function onRequest(context) {
            if (context.request.method === 'GET') {
                var filtersList = [
                    search.createFilter({
                        name: 'custrecord_me_ras_il_closed',
                        join: 'custrecord_me_ras_il_rlt_field',
                        operator: search.Operator.IS,
                        values: 'F'
                    }),
                    search.createFilter({
                        name: 'formulanumeric',
                        operator: search.Operator.GREATERTHAN,
                        values: 0,
                        formula: "{custrecord_me_ras_il_rlt_field.custrecord_me_ras_il_qty} - (CASE WHEN {custrecord_me_ras_il_rlt_field.custrecord_me_ras_il_requested} IS NULL THEN 0 ELSE {custrecord_me_ras_il_rlt_field.custrecord_me_ras_il_requested} END)"
                    }),
                ];
                var getIdRAS = context.request.parameters.idRAS;
                var getDepartment = context.request.parameters.department;
                var getClass = context.request.parameters.classification;
                var getLocation = context.request.parameters.location;
                // var getDeviasi = context.request.parameters.deviasi;
                var form = serverWidget.createForm({ title: 'Summarize RAS' });
                form.addSubmitButton({ label: 'Summarize' });

                var fieldgroup1 = form.addFieldGroup({
                    id: 'fieldgroup1',
                    label: 'Set Body Fields'
                });
                var bodyRequestor = form.addField({
                    id: 'custpage_body_requestor',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Requestor',
                    source: 'employee',
                    container: 'fieldgroup1'
                });
                bodyRequestor.isMandatory = true;
                var bodyRcvContact = form.addField({
                    id: 'custpage_body_rcvcontact',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Receiver Contact',
                    source: 'customlist96',
                    container: 'fieldgroup1'
                });
                bodyRcvContact.isMandatory = true;
                var bodyDueDate = form.addField({
                    id: 'custpage_body_duedate',
                    type: serverWidget.FieldType.DATE,
                    label: 'Receive By',
                    container: 'fieldgroup1'
                });
                var bodyDate = form.addField({
                    id: 'custpage_body_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'Date',
                    container: 'fieldgroup1'
                });
                bodyDate.defaultValue = new Date();
                bodyDate.isMandatory = true;
                var bodyMemo = form.addField({
                    id: 'custpage_body_memo',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Memo',
                    container: 'fieldgroup1'
                });
                bodyMemo.isMandatory = true;
                var bodyDepartment = form.addField({
                    id: 'custpage_body_department',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Department',
                    source: 'department',
                    container: 'fieldgroup1'
                });
                bodyDepartment.isMandatory = true;
                var bodyClass = form.addField({
                    id: 'custpage_body_class',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Class',
                    source: 'classification',
                    container: 'fieldgroup1'
                });
                bodyClass.isMandatory = true;
                var bodyDeviasi = form.addField({
                    id: 'custpage_body_deviasi',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Deviasi',
                    container: 'fieldgroup1'
                });
                var bodyAlasanDev = form.addField({
                    id: 'custpage_body_alasandev',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'Alasan Deviasi',
                    container: 'fieldgroup1'
                });

                var fieldgroup2 = form.addFieldGroup({
                    id: 'fieldgroup2',
                    label: 'Filters'
                });
                var filterIdRAS = form.addField({
                    id: 'custpage_filter_id',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ID RAS',
                    container: 'fieldgroup2'
                });
                if (getIdRAS) {
                    filterIdRAS.defaultValue = getIdRAS;
                    filtersList.push(
                        search.createFilter({
                            name: 'idtext',
                            operator: search.Operator.IS,
                            values: getIdRAS
                        })
                    );
                }
                var filterDepartment = form.addField({
                    id: 'custpage_filter_department',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Department',
                    source: 'department',
                    container: 'fieldgroup2'
                });
                if (getDepartment) {
                    filterDepartment.defaultValue = getDepartment;
                    filtersList.push(
                        search.createFilter({
                            name: 'custrecord_me_ras_dept',
                            operator: search.Operator.ANYOF,
                            values: getDepartment
                        })
                    );
                }
                var filterClass = form.addField({
                    id: 'custpage_filter_class',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Class',
                    source: 'classification',
                    container: 'fieldgroup2'
                });
                if (getClass) {
                    filterClass.defaultValue = getClass;
                    filtersList.push(
                        search.createFilter({
                            name: 'custrecord_me_ras_class',
                            operator: search.Operator.ANYOF,
                            values: getClass
                        })
                    );
                }
                var filterLocation = form.addField({
                    id: 'custpage_filter_location',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Location',
                    source: 'location',
                    container: 'fieldgroup2'
                });
                if (getLocation) {
                    filterLocation.defaultValue = getLocation;
                    filtersList.push(
                        search.createFilter({
                            name: 'custrecord_me_ras_il_location',
                            join: 'CUSTRECORD_ME_RAS_IL_RLT_FIELD',
                            operator: search.Operator.ANYOF,
                            values: getLocation
                        })
                    );
                }
                // var filterDeviasi = form.addField({
                //     id: 'custpage_filter_deviasi',
                //     type: serverWidget.FieldType.CHECKBOX,
                //     label: 'Deviasi',
                //     container: 'fieldgroup2'
                // });
                // if (getDeviasi === true) {
                //     filterDeviasi.defaultValue = getDeviasi;
                //     filtersList.push(
                //         search.createFilter({
                //             name: 'custrecord_me_ras_deviasi',
                //             operator: search.Operator.IS,
                //             values: getDeviasi
                //         })
                //     );
                // } else if (getDeviasi === false) {
                //     filterDeviasi.defaultValue = getDeviasi;
                //     filtersList.push(
                //         search.createFilter({
                //             name: 'custrecord_me_ras_deviasi',
                //             operator: search.Operator.IS,
                //             values: getDeviasi
                //         })
                //     );
                // }

                var sublist = form.addSublist({
                    id: 'custpage_raslist',
                    type: serverWidget.SublistType.LIST,
                    label: 'RAS'
                });
                sublist.addMarkAllButtons();

                sublist.addField({
                    id: 'custpage_ras_checkbox',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'CHECK'
                });


                sublist.addField({
                    id: 'custpage_ras_ecmno',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ECM RAS No.'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                sublist.addField({
                    id: 'custpage_ras_id',
                    type: serverWidget.FieldType.SELECT,
                    label: 'ID',
                    source: 'customrecord_me_ras'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                sublist.addField({
                    id: 'custpage_ras_requestor',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Requestor',
                    source: 'employee'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                sublist.addField({
                    id: 'custpage_ras_trandate',
                    type: serverWidget.FieldType.DATE,
                    label: 'Date'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                sublist.addField({
                    id: 'custpage_ras_deviasi',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Deviasi'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                sublist.addField({
                    id: 'custpage_ras_department',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Department',
                    source: 'department'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                sublist.addField({
                    id: 'custpage_ras_class',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Class',
                    source: 'classification'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                var sublistLocation = sublist.addField({
                    id: 'custpage_ras_location',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Location',
                    source: 'location'
                });
                sublistLocation.isMandatory = true;
                var deliveryLoc = sublist.addField({
                    id: 'custpage_ras_deliveryloc',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Delivery Location',
                    source: 'customlist95'
                });
                deliveryLoc.isMandatory = true;

                sublist.addField({
                    id: 'custpage_ras_item',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Item',
                    source: 'item'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                sublist.addField({
                    id: 'custpage_ras_description',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Description'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                });
                sublist.addField({
                    id: 'custpage_ras_quantity',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Quantity'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                });

                var estRate = sublist.addField({
                    id: 'custpage_ras_estrate',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Estimated Rate'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                });
                estRate.isMandatory = true;

                // sublist.addField({
                //     id: 'custpage_ras_units',
                //     type: serverWidget.FieldType.SELECT,
                //     label: 'Unit',
                //     source: 'units'
                // }).updateDisplayType({
                //     displayType: serverWidget.FieldDisplayType.INLINE
                // });

                sublist.addField({
                    id: 'custpage_ras_lineid',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Line ID'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                var rasResult = search.create({
                    type: "customrecord_me_ras",
                    filters: filtersList,
                    columns: [
                        "name", "custrecord_me_ras_requestor", "custrecord_me_ras_date", "custrecord_me_ras_deviasi", "custrecord_me_ras_dept", "custrecord_me_ras_class",
                        search.createColumn({
                            name: "custrecord_me_ras_il_requested",
                            join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                        }),
                        search.createColumn({
                            name: "custrecord_me_ras_il_location",
                            join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                        }),
                        search.createColumn({ name: "custrecord_me_ras_no", label: "RAS No." }),
                        search.createColumn({
                            name: "custrecord_me_ras_il_item",
                            join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                        }),
                        search.createColumn({
                            name: "custrecord_me_ras_il_description",
                            join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                        }),
                        search.createColumn({
                            name: "custrecord_me_ras_il_qty",
                            join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                        }),
                        search.createColumn({
                            name: "custrecord_me_ras_il_units",
                            join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                        }),
                        search.createColumn({
                            name: "custrecord_me_ras_il_lineid",
                            join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                        })
                    ]
                }).run().getRange({
                    start: 0,
                    end: 1000
                });
                log.debug('rasResult', rasResult);
                var j = 0;

                for (var i = 0; i < rasResult.length; i++) {
                    var id = rasResult[i].id;
                    var requestor = rasResult[i].getValue({
                        name: 'custrecord_me_ras_requestor'
                    });
                    var date = rasResult[i].getValue('custrecord_me_ras_date');
                    //log.debug('date', date + ' ' + typeof date);
                    var deviasi = rasResult[i].getValue({
                        name: 'custrecord_me_ras_deviasi'
                    }) ? 'T' : 'F';
                    var department = rasResult[i].getValue({
                        name: 'custrecord_me_ras_dept'
                    });
                    var classification = rasResult[i].getValue({
                        name: 'custrecord_me_ras_class'
                    });
                    var location = rasResult[i].getValue({
                        name: "custrecord_me_ras_il_location",
                        join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                    });
                    var item = rasResult[i].getValue({
                        name: "custrecord_me_ras_il_item",
                        join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                    });
                    var description = rasResult[i].getValue({
                        name: "custrecord_me_ras_il_description",
                        join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                    });
                    var initialQty = rasResult[i].getValue({
                        name: "custrecord_me_ras_il_qty",
                        join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                    }) || 0;
                    var requestedQty = rasResult[i].getValue({
                        name: "custrecord_me_ras_il_requested",
                        join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                    }) || 0;
                    var quantity = initialQty - requestedQty
                    // var units = rasResult[i].getValue({
                    //     name: "custrecord_me_ras_il_units",
                    //     join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                    // });
                    var lineid = rasResult[i].getValue({
                        name: "custrecord_me_ras_il_lineid",
                        join: "CUSTRECORD_ME_RAS_IL_RLT_FIELD"
                    });
                    var ecmRASNo = rasResult[i].getValue("custrecord_me_ras_no");
                    sublist.setSublistValue({
                        id: 'custpage_ras_id',
                        line: j,
                        value: id
                    });
                    sublist.setSublistValue({
                        id: 'custpage_ras_requestor',
                        line: j,
                        value: requestor
                    });
                    sublist.setSublistValue({
                        id: 'custpage_ras_trandate',
                        line: j,
                        value: date
                    });
                    sublist.setSublistValue({
                        id: 'custpage_ras_deviasi',
                        line: j,
                        value: deviasi
                    });
                    sublist.setSublistValue({
                        id: 'custpage_ras_department',
                        line: j,
                        value: department
                    });
                    sublist.setSublistValue({
                        id: 'custpage_ras_class',
                        line: j,
                        value: classification
                    });
                    sublist.setSublistValue({
                        id: 'custpage_ras_location',
                        line: j,
                        value: location
                    });
                    sublist.setSublistValue({
                        id: 'custpage_ras_item',
                        line: j,
                        value: item
                    });
                    if (description) {
                        sublist.setSublistValue({
                            id: 'custpage_ras_description',
                            line: j,
                            value: description
                        });
                    }
                    sublist.setSublistValue({
                        id: 'custpage_ras_quantity',
                        line: j,
                        value: quantity
                    });
                    // if (units) {
                    //     sublist.setSublistValue({
                    //         id: 'custpage_ras_units',
                    //         line: j,
                    //         value: units
                    //     });
                    // }
                    sublist.setSublistValue({
                        id: 'custpage_ras_lineid',
                        line: j,
                        value: lineid
                    });
                    sublist.setSublistValue({
                        id: 'custpage_ras_ecmno',
                        line: j,
                        value: ecmRASNo
                    });
                    j++;
                }

                j = 0;
                var lineCount = sublist.lineCount;
                if (sublist.lineCount + 1 == 0) lineCount += 1;

                var totalReversal = form.addField({
                    id: 'custpage_totalrasfield',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Total RAS Records',
                    container: 'fieldgroup2'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                }).defaultValue = lineCount;

                form.insertField({
                    field: totalReversal,
                    nextfield: 'custpage_countfield'
                });
                form.clientScriptModulePath = 'SuiteScripts/Metrodata/me_cs_behavior_summarize_ras.js';
                context.response.writePage({
                    pageObject: form
                });
            }

            else {
                log.debug('context', context);
                var requestedRASData = [];
                var lineCount = context.request.getLineCount({
                    group: 'custpage_raslist',
                });
                var requestor = context.request.parameters.custpage_body_requestor;
                var rcvContact = context.request.parameters.custpage_body_rcvcontact;
                var rawDate = context.request.parameters.custpage_body_date
                var date = format.parse({
                    value: rawDate,
                    type: format.Type.DATE
                });
                if (context.request.parameters.custpage_body_duedate) {
                    var dueDate = format.parse({
                        value: context.request.parameters.custpage_body_duedate,
                        type: format.Type.DATE
                    });
                }
                var memo = context.request.parameters.custpage_body_memo;
                var department = context.request.parameters.custpage_body_department;
                var classification = context.request.parameters.custpage_body_class;
                var deviasi = context.request.parameters.custpage_body_deviasi;
                log.debug('deviasi', deviasi);

                for (i = 0; i < lineCount; i++) {
                    var count = 0;
                    var itemCheck = context.request.getSublistValue({
                        group: 'custpage_raslist',
                        name: 'custpage_ras_checkbox',
                        line: i
                    });
                    log.debug('itemCheck', itemCheck);
                    if (itemCheck == "T") {
                        var id = context.request.getSublistValue({
                            group: 'custpage_raslist',
                            name: 'custpage_ras_id',
                            line: i
                        });
                        var itemItem = context.request.getSublistValue({
                            group: 'custpage_raslist',
                            name: 'custpage_ras_item',
                            line: i
                        });
                        var itemLineid = context.request.getSublistValue({
                            group: 'custpage_raslist',
                            name: 'custpage_ras_lineid',
                            line: i
                        });
                        var itemQuantity = context.request.getSublistValue({
                            group: 'custpage_raslist',
                            name: 'custpage_ras_quantity',
                            line: i
                        });
                        var itemLocation = context.request.getSublistValue({
                            group: 'custpage_raslist',
                            name: 'custpage_ras_location',
                            line: i
                        });
                        var itemDescription = context.request.getSublistValue({
                            group: 'custpage_raslist',
                            name: 'custpage_ras_description',
                            line: i
                        });
                        var itemEcmRASNo = context.request.getSublistValue({
                            group: 'custpage_raslist',
                            name: 'custpage_ras_ecmno',
                            line: i
                        });
                        var itemDelivery = context.request.getSublistValue({
                            group: 'custpage_raslist',
                            name: 'custpage_ras_deliveryloc',
                            line: i
                        });
                        var itemRate = context.request.getSublistValue({
                            group: 'custpage_raslist',
                            name: 'custpage_ras_estrate',
                            line: i
                        });

                        for (var y = 0; y < requestedRASData.length; y++) {
                            var existedId = requestedRASData[y].id;
                            if (id == existedId) {
                                requestedRASData[y].item.push(itemItem);
                                requestedRASData[y].lineid.push(itemLineid);
                                requestedRASData[y].quantity.push(itemQuantity);
                                requestedRASData[y].rate.push(itemRate);
                                requestedRASData[y].location.push(itemLocation);
                                requestedRASData[y].delivery.push(itemDelivery);
                                requestedRASData[y].description.push(itemDescription);
                                count++;
                                break;
                            }
                        }
                        if (count == 0) {
                            requestedRASData.push({
                                id: id,
                                rasno: itemEcmRASNo,
                                item: [itemItem],
                                lineid: [itemLineid],
                                quantity: [itemQuantity],
                                rate: [itemRate],
                                location: [itemLocation],
                                delivery: [itemDelivery],
                                description: [itemDescription]
                            });
                        }
                    }
                }
                log.debug('requestedRASData', requestedRASData);

                for (var i = 0; i < requestedRASData.length; i++) {
                    var rasRec = record.load({
                        type: 'customrecord_me_ras',
                        id: requestedRASData[i].id
                    });
                    var rasItemLineCount = rasRec.getLineCount("recmachcustrecord_me_ras_il_rlt_field");
                    for (var y = 0; y < rasItemLineCount; y++) {
                        var rasLineId = rasRec.getSublistValue({ sublistId: 'recmachcustrecord_me_ras_il_rlt_field', fieldId: 'custrecord_me_ras_il_lineid', line: y });
                        for (var x = 0; x < requestedRASData[i].lineid.length; x++) {
                            log.debug('rasLineId', rasLineId);
                            log.debug('requestedRASData[i].lineid[x]', requestedRASData[i].lineid[x]);
                            log.debug('rasLineId == requestedRASData[i].lineid[x]', rasLineId == requestedRASData[i].lineid[x]);
                            if (rasLineId == requestedRASData[i].lineid[x]) {
                                var rasRequestedQty = rasRec.getSublistValue({
                                    sublistId: 'recmachcustrecord_me_ras_il_rlt_field',
                                    fieldId: 'custrecord_me_ras_il_requested',
                                    line: y
                                }) || 0;
                                rasRec.setSublistValue({
                                    sublistId: 'recmachcustrecord_me_ras_il_rlt_field',
                                    fieldId: 'custrecord_me_ras_il_requested',
                                    line: y,
                                    value: Number(requestedRASData[i].quantity[x]) + Number(rasRequestedQty)
                                });
                                break;
                            }
                        }
                    }
                    rasRec.save();
                }
 
                var prRec = record.create({
                    type: 'purchaserequisition',
                    isDynamic: true
                });

                if (deviasi == 'T') {
                    prRec.setValue('customform', 117) // ME - PR Deviasi
                    if (context.request.parameters.custpage_body_alasandev) {
                        prRec.setValue('custbody_me_alasan_deviasi', context.request.parameters.custpage_body_alasandev);
                    } else {
                        prRec.setValue('custbody_me_alasan_deviasi', "-");
                    }
                } else if (deviasi == 'F') {
                    prRec.setValue('customform', 105) // TAB Requisition
                }

                prRec.setValue('entity', requestor);
                prRec.setValue('trandate', date);
                if (dueDate) {
                    prRec.setValue('duedate', dueDate);
                }
                prRec.setValue('custbody12', rcvContact);
                prRec.setValue('memo', memo);
                prRec.setValue('department', department);
                prRec.setValue('class', classification);

                for (var i = 0; i < requestedRASData.length; i++) {
                    for (var y = 0; y < requestedRASData[i].lineid.length; y++) {
                        prRec.selectNewLine('item');
                        prRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: requestedRASData[i].item[y]
                        });
                        prRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: requestedRASData[i].quantity[y]
                        });
                        prRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'estimatedrate',
                            value: requestedRASData[i].rate[y]
                        });
                        prRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_me_custom_location',
                            value: requestedRASData[i].location[y]
                        });
                        if (requestedRASData[i].description[y]) {
                            prRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'description',
                                value: requestedRASData[i].description[y]
                            });
                        }
                        prRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'department',
                            value: department
                        });
                        prRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'class',
                            value: classification
                        });
                        prRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_me_line_ras_no',
                            value: requestedRASData[i].rasno
                        });
                        prRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_me_delivery_location',
                            value: requestedRASData[i].delivery[y]
                        });
                        prRec.commitLine('item');
                    }
                }
                var prId = prRec.save({
                    ignoreMandatory: true
                });

                redirect.toRecord({
                    type: record.Type.PURCHASE_REQUISITION,
                    id: prId
                });
            }
        }

        return {
            onRequest: onRequest
        }
    });