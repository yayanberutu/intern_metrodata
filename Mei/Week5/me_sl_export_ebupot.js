/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet 
 */
/**
 * @author Rizky Bintang Orlando Siahaan
 * @email Rizky.Siahaan@metrodata.co.id
 * @create date 2021-05-05
 * @modify date 2021-05-05
 * @desc Script for amount bill item and combine into 1 line and then generate e-faktur. 
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
                retVal = raw1.replace(',', ';');
            }

            return retVal;
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
                title: 'Export e-Bupot'
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
                var ebupotType = form.addField({
                    id: 'custpage_type',
                    type: serverWidget.FieldType.SELECT,
                    label: "Type",
                    source: 'customlist_me_ebupot_type',
                    container: 'fieldgroupid'
                });
                ebupotType.isMandatory = true;
                var startdate = form.addField({
                    id: 'custpage_startpage',
                    type: serverWidget.FieldType.DATE,
                    label: "Start Date",
                    container: 'fieldgroupid'
                });
                startdate.isMandatory = true;

                var inlinePrefix1 = form.addField({
                    id: 'custpage_inlineprefix1',
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
                }).defaultValue = 'BILL#';

                var startNumber = form.addField({
                    id: 'custpage_numberstart',
                    type: serverWidget.FieldType.INTEGER,
                    label: " ",
                    container: 'fieldgroupid'
                }).updateLayoutType({
                    layoutType: serverWidget.FieldLayoutType.MIDROW
                }).updateDisplaySize({
                    height: 10,
                    width: 10
                });

                var inlinePrefix2 = form.addField({
                    id: 'custpage_inlineprefix2',
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
                }).defaultValue = 'BILL#';

                var endNumber = form.addField({
                    id: 'custpage_numberend',
                    type: serverWidget.FieldType.INTEGER,
                    label: " ",
                    container: 'fieldgroupid'
                }).updateLayoutType({
                    layoutType: serverWidget.FieldLayoutType.ENDROW
                }).updateDisplaySize({
                    height: 10,
                    width: 10
                });

                var enddate = form.addField({
                    id: 'custpage_endpage',
                    type: serverWidget.FieldType.DATE,
                    label: "End Date",
                    container: 'fieldgroupid'
                });
                enddate.isMandatory = true;
                // var subsidiaryField = form.addField({
                //     id: 'custpage_subsidiary',
                //     type: serverWidget.FieldType.SELECT,
                //     label: 'Subsidiary',
                //     source: 'subsidiary',
                //     container: 'fieldgroupid'
                // });
                // subsidiaryField.isMandatory = true;
                var descField = form.addField({
                    id: 'custpage_descfield',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: ' ',
                    container: 'fieldgroupid'
                }).updateLayoutType({
                    layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
                }).defaultValue = '<b> Max Range Number : 20000</b>';

                context.response.writePage(form);

            } else {
                /**
                 * Getting parameter data from page
                 */

                var bupotType = context.request.parameters.custpage_type;
                var startDate = context.request.parameters.custpage_startpage;
                var endDate = context.request.parameters.custpage_endpage;
                var startNum = context.request.parameters.custpage_numberstart ? context.request.parameters.custpage_numberstart : 0;
                var endNum = context.request.parameters.custpage_numberend > 0 ? context.request.parameters.custpage_numberend : 20000;

                log.debug('startNum', startNum);
                log.debug('endNum', endNum);
                if (endNum - startNum > 20000) {
                    var errorField = form.addField({
                        id: 'custpage_errorfield',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: ' ',
                        container: 'fieldgroupid'
                    }).defaultValue = 'Cant generate over 20000 numbers';
                    form.addButton({
                        id: 'custpage_backbuttonn',
                        label: 'Back',
                        functionName: "window.location.assign('" + url.resolveScript({
                            scriptId: 'customscript_me_sl_export_ebupot',
                            deploymentId: 'customdeploy_me_sl_export_ebupot'
                        }) + "');"
                    })
                    context.response.writePage(form);
                } else {
                    /**
                     * Define header FK and OF
                     */

                    if (bupotType == 1) {
                        var headerBodyEfaktur = "No,Masa Pajak,Tahun Pajak,Tgl Pemotongan (DD/MM/YYYY),Ber-NPWP ? (Y/N),NPWP (tanpa format/tanda baca),NIK (tanpa format/tanda baca),Nomor Telp,Kode Objek Pajak,Penanda Tangan BP Pengurus ? (Y/N),Penghasilan Bruto,Mendapatkan Fasilitas ? (N/SKB/DTP),Nomor SKB,Nomor Aturan DTP,NTPN DTP";
                        var eBupotName = "e-Bupot PPh 23"
                    } else {
                        var headerBodyEfaktur = "No,Masa Pajak,Tahun Pajak,Tgl Pemotongan (DD/MM/YYYY),TIN (dengan format/tanda baca),Nama WP Terpotong,Tanggal Lahir WP Terpotong (DD/MM/YYYY),Alamat WP Terpotong,No Paspor WP Terpotong,No Kitas WP Terpotong,Kode Negara,Kode Objek Pajak,Penanda Tangan BP Pengurus? (Y/N),Penghasilan Bruto,Perkiraan Penghasilan Netto (%),Mendapatkan Fasilitas ? (N/SKD/DTP),Nomor Tanda Terima SKD,Tarif SKD,Nomor Aturan DTP,NTPN DTP";
                        var eBupotName = "e-Bupot PPh 26"
                    }
                    /**
                     * Creating saved search to get data bill
                     */
                    filters = [
                        search.createFilter({ name: "mainline", operator: search.Operator.IS, values: 'F' })
                    ]
                    if (bupotType == 1) {
                        filters.push(search.createFilter({ name: "expensecategory", operator: search.Operator.ANYOF, values: 94 }))
                    } else {
                        filters.push(search.createFilter({ name: "expensecategory", operator: search.Operator.ANYOF, values: 95 }))
                    }
                    if (startDate && endDate) {
                        filters.push(
                            search.createFilter({ name: "trandate", operator: search.Operator.WITHIN, values: [startDate, endDate] })
                        )
                    }
                    if (startNum && endNum) {
                        filters.push(
                            search.createFilter({ name: "transactionnumbernumber", operator: search.Operator.BETWEEN, values: [startNum, endNum] })
                        )
                    }

                    var billSearch = search.create({
                        type: "vendorbill",
                        filters: filters,
                        columns: [
                            // 0
                            search.createColumn({ name: "formulatext", formula: "TO_CHAR({trandate},'MM')" }),
                            // 1
                            search.createColumn({ name: "formulatext", formula: "TO_CHAR({trandate},'YYYY')" }),
                            // 2
                            search.createColumn({ name: "trandate", sort: search.Sort.DESC }),
                            // 3
                            search.createColumn({ name: "vatregnumber", join: "vendor" }),
                            // 4
                            search.createColumn({ name: "entityid", join: "vendor" }),
                            // 5        
                            search.createColumn({ name: "address", join: "vendor" }),
                            // 6
                            search.createColumn({ name: "country", join: "vendor" }),
                            // 7
                            search.createColumn({ name: "custbody_me_ebupot_kode_objek_pajak", label: "Kode Objek Pajak" }),
                            // 8
                            search.createColumn({ name: "custbody_me_ebupot_ttd_bp", label: "Tanda Tangan BP Pengurus?" }),
                            // 9
                            search.createColumn({ name: "custcol_me_bruto", label: "Penghasilan Bruto" }),
                            // 10
                            search.createColumn({ name: "custbody_me_ebupot_fasilitas", label: "Fasilitas" }),
                            // 11
                            search.createColumn({ name: "custbody_me_ebupot_no_skd", label: "Nomor Tanda Terima SKD" }),
                            // 12
                            search.createColumn({ name: "custbody_me_ebupot_tarif_skd", label: "Tarif SKD" }),
                            // 13
                            search.createColumn({ name: "custbody_me_ebupot_no_dtp", label: "Nomor Aturan DTP" }),
                            // 14
                            search.createColumn({ name: "custbody_me_ebupot_ntpn_dtp", label: "NTPN DTP" }),
                            // 15
                            search.createColumn({ name: "transactionname" }),
                            //16
                            search.createColumn({ name: "phone", join: "vendor" }),
                            //17
                            search.createColumn({ name: "custentity_me_nomor_ktp", join: "vendor" })
                        ]
                    });


                    var rawContent = "";
                    var NO = 0;
                    var checkID = [];
                    var refId = [];
                    var startRow = 0;
                    var pageSize = 1000;
                    rawContent += headerBodyEfaktur + "\n";

                    do {
                        var billSearchResult = billSearch.run().getRange({
                            start: startRow,
                            end: startRow + pageSize
                        });
                        log.debug('billSearchResult', billSearchResult);
                        log.debug('search length', billSearchResult.length);
                        if (billSearchResult.length > 0) {
                            for (j = 0; j < billSearchResult.length; j++) {
                                if (billSearchResult[j].getValue(billSearchResult[j].columns[9]) != '') {
                                    log.debug('billSearchResult[' + j + ']', billSearchResult[j])
                                    var idBill = billSearchResult[j].id;
                                    var trandate = billSearchResult[j].getValue('trandate');
                                    // log.debug('date', billSearchResult[j].getValue('trandate'));
                                    // trandate.toString();
                                    // var parseDate = moment(trandate, "MM/DD/YYYY");
                                    // var formatTrandate = moment(parseDate).format("DD/MM/YYYY");

                                    /**
                                     * Define value for FK 
                                     */


                                    var MASA_PAJAK = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[0]));
                                    var TAHUN_PAJAK = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[1]));
                                    var TGL_POTONG = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[2]));
                                    var NPWP = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[3]));
                                    if (NPWP.substring(0, 15) == '000000000000000' || !NPWP) {
                                        NPWP = '000000000000000';
                                        var BERNPWP = 'N'
                                    } else {
                                        var BERNPWP = 'Y'
                                    }

                                    var NAMA_WP = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[4]));
                                    var TGL_LAHIR_WP = '';
                                    var ALAMAT_WP = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[5]));
                                    var NO_PASPOR_WP = '';
                                    var NO_KITAS_WP = '';
                                    if (billSearchResult[j].getText(billSearchResult[j].columns[6]) == 'Indonesia') {
                                        var KODE_NEGARA = 'INA';
                                    } else {
                                        var KODE_NEGARA = ''
                                    }
                                    var KODE_OBJEK_PAJAK = billSearchResult[j].getText(billSearchResult[j].columns[7]).substring(0, 9);
                                    log.debug('TDT_BP_PENGURUS', billSearchResult[j].getValue(billSearchResult[j].columns[8]));
                                    if (billSearchResult[j].getValue(billSearchResult[j].columns[8])) {
                                        var TDT_BP_PENGURUS = 'Y'
                                    } else {
                                        var TDT_BP_PENGURUS = 'N';
                                    }
                                    var BRUTTO = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[9]));
                                    var PERSEN_NETTO = '100'
                                    var FASILITAS = formatValue(billSearchResult[j].getText(billSearchResult[j].columns[10]));
                                    var NO_SKD = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[11]));
                                    var TARIF_SKD = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[12]));
                                    var NO_ATURAN_DTP = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[13]));
                                    var NTPN_DTP = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[14]));
                                    var REFERENSI = formatValue(billSearchResult[j].getValue("transactionname"));
                                    var PHONE = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[16]));
                                    var NIK = formatValue(billSearchResult[j].getValue(billSearchResult[j].columns[17]));

                                    NO++;

                                    /**
                                     * Define value for OF
                                     */
                                    if (bupotType == 1) {
                                        var valueBodyEfaktur = NO + "," + MASA_PAJAK + "," + TAHUN_PAJAK + "," + TGL_POTONG + "," + BERNPWP + "," + NPWP + "," + NIK + "," + PHONE + "," + KODE_OBJEK_PAJAK + "," + TDT_BP_PENGURUS + "," + BRUTTO + "," + FASILITAS + "," + NO_SKD + "," + NO_ATURAN_DTP + "," + NTPN_DTP;
                                    } else {
                                        var valueBodyEfaktur = NO + "," + MASA_PAJAK + "," + TAHUN_PAJAK + "," + TGL_POTONG + "," + NPWP + "," + NAMA_WP + "," + TGL_LAHIR_WP + "," + ALAMAT_WP + "," + NO_PASPOR_WP + "," + NO_KITAS_WP + "," + KODE_NEGARA + "," + KODE_OBJEK_PAJAK + "," + TDT_BP_PENGURUS + "," + BRUTTO + "," + PERSEN_NETTO + "," + FASILITAS + "," + NO_SKD + "," + TARIF_SKD + "," + NO_ATURAN_DTP + "," + NTPN_DTP;
                                    }
                                    rawContent += valueBodyEfaktur + "\n";


                                    checkID.push(idBill);
                                     refId.push(REFERENSI);
                                }
                            }
                        }
                        startRow += pageSize
                    } while (billSearchResult.length === pageSize);

                    var nameFile = refId.length > 0 ? eBupotName + ' ' + moment().subtract(0, 'months').format('MMMM') + ' ' + refId[0] + '-' + refId[refId.length - 1] + '.csv' : 'E-faktur ' + moment().subtract(1, 'months').format('MMMM') + '.csv';

                    var fileObj = file.create({
                        name: nameFile,
                        fileType: file.Type.CSV,
                        contents: rawContent
                    });
                    context.response.writeFile({
                        file: fileObj,
                        isInline: false
                    });
                    log.debug("Remaining governance Total : " + scriptObj.getRemainingUsage());
                    return;
                }
            }
        }

        return {
            onRequest: onRequest
        }
    });