/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
/**
 * @author Rizky Bintang Orlando Siahaan
 * @email Rizky.Siahaan@metrodata.co.id
 * @create date 2021-05-05
 * @modify date 2021-05-05
 * @desc Script for amount invoice item and combine into 1 line and then generate e-faktur. 
 */

define(['N/file', "N/ui/serverWidget", "./lib/moment.min.js", "N/search", "N/runtime", "N/url"], function (file, serverWidget, moment, search, runtime, url) {

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
            title: 'Export e-Faktur'
        });

        var scriptObj = runtime.getCurrentScript();
        if (context.request.method === 'GET') {
            form.addSubmitButton({
                label: 'Export'
            });
            var fieldgroup = form.addFieldGroup({
                id: 'fieldgroupid',
                label: 'Range Doc Number'
            });
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


            var startDate = context.request.parameters.custpage_startpage;
            var endDate = context.request.parameters.custpage_endpage;
            // var subsidiary = context.request.parameters.custpage_subsidiary;
            var startNum = context.request.parameters.custpage_numberstart ? context.request.parameters.custpage_numberstart : 0;
            var endNum = context.request.parameters.custpage_numberend > 0 ? context.request.parameters.custpage_numberend : 20000;


            var month = moment().subtract(1, 'months').format('MM');
            // log.debug('month', month);
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
                        scriptId: 'customscript_me_sl_export_efaktur',
                        deploymentId: 'customdeploy_me_sl_export_efaktur'
                    }) + "');"
                })

                context.response.writePage(form);

            } else {
                /**
                 * Define header FK and OF
                 */

                var headerBodyEfaktur = "FK,KD_JENIS_TRANSAKSI,FG_PENGGANTI,NOMOR_FAKTUR,MASA_PAJAK,TAHUN_PAJAK,TANGGAL_FAKTUR,NPWP,NAMA,ALAMAT_LENGKAP,JUMLAH_DPP,JUMLAH_PPN,JUMLAH_PPNBM,ID_KETERANGAN_TAMBAHAN,FG_UANG_MUKA,UANG_MUKA_DPP,UANG_MUKA_PPN,UANG_MUKA_PPNBM,REFERENSI";
                var ltValue = "LT,NPWP,NAMA,JALAN,BLOK,NOMOR,RT,RW,KECAMATAN,KELURAHAN,KABUPATEN,PROPINSI,KODE_POS,NOMOR_TELEPON";
                var headerLineEfaktur = "OF,KODE_OBJEK,NAMA,HARGA_SATUAN,JUMLAH_BARANG,HARGA_TOTAL,DISKON,DPP,PPN,TARIF_PPNBM,PPNBM";

                /**
                 * Creating saved search to get data invoice
                 */

                filters = [
                    search.createFilter({ name: "mainline", operator: search.Operator.IS, values: 'F' }),
                    search.createFilter({ name: "item", operator: search.Operator.NONEOF, values: '@NONE@' }),
                    search.createFilter({ name: "memo", operator: search.Operator.ISNOT, values: 'VAT' }),
                    search.createFilter({ name: "memo", operator: search.Operator.ISNOT, values: 'Cost of Sales' })
                ]
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

                var invoiceSearch = search.create({
                    type: "invoice",
                    filters: filters,
                    columns: ["custbody_me_kd_jenis_transaksi", "custbody_me_fg_pengganti", "custbody_me_nomor_faktur",
                        search.createColumn({ name: "formulatext", formula: "TO_CHAR({trandate},'MM')" }),
                        search.createColumn({ name: "formulatext", formula: "TO_CHAR({trandate},'YYYY')" }),
                        "trandate",
                        search.createColumn({ name: "vatregnumber", join: "customer" }),
                        search.createColumn({ name: "custentity_me_nomor_ktp", join: "customer" }),
                        search.createColumn({ name: "altname", join: "customer" }),
                        search.createColumn({ name: "companyname", join: "customer" }),
                        search.createColumn({ name: "address", join: "customer" }),
                        "amount", "memo", "rate", "quantity", "total", "taxtotal", "transactionname"
                    ]
                });

                var rawContent = "";
                var checkID = null;
                var refId = [];
                var startRow = 0;
                var pageSize = 1000;
                rawContent += headerBodyEfaktur + "\n";
                rawContent += ltValue + "\n";
                rawContent += headerLineEfaktur + "\n";

                do {
                    var invoiceSearchResult = invoiceSearch.run().getRange({
                        start: startRow,
                        end: startRow + pageSize
                    });
                    log.debug('invoiceSearchResult', invoiceSearchResult);
                    log.debug('search length', invoiceSearchResult.length);
                    if (invoiceSearchResult.length > 0) {
                        for (j = 0; j < invoiceSearchResult.length; j++) {
                            log.debug('invoiceSearchResult[' + j + ']', invoiceSearchResult[j])
                            var idInvoice = invoiceSearchResult[j].id;
                            var trandate = invoiceSearchResult[j].getValue('trandate');

                            /**
                             * Define value for FK 
                             */
                            if (invoiceSearchResult[j].getValue('custbody_me_kd_jenis_transaksi') == 1) {
                                var KD_JENIS_PENGGANTI = '01';
                            } else if (invoiceSearchResult[j].getValue('custbody_me_kd_jenis_transaksi') == 2) {
                                var KD_JENIS_PENGGANTI = '03';
                            } else if (invoiceSearchResult[j].getValue('custbody_me_kd_jenis_transaksi') == 3) {
                                var KD_JENIS_PENGGANTI = '04';
                            } else {
                                var KD_JENIS_PENGGANTI = '';
                            }

                            if (invoiceSearchResult[j].getValue('custbody_me_fg_pengganti') == 'F') {
                                var FG_PENGGANTI = "0";
                            } else {
                                var FG_PENGGANTI = "1";
                            }
                            var NOMOR_FAKTUR = formatValue(invoiceSearchResult[j].getValue('custbody_me_nomor_faktur'));
                            var MASA_PAJAK = formatValue(invoiceSearchResult[j].getValue(invoiceSearchResult[j].columns[3]));
                            var TAHUN_PAJAK = formatValue(invoiceSearchResult[j].getValue(invoiceSearchResult[j].columns[4]));
                            var TANGGAL_FAKTUR = trandate;
                            var NPWP = invoiceSearchResult[j].getValue({ name: "vatregnumber", join: "customer" }).replace(/\./g, '').replace('-', '');
                            if (!NPWP || NPWP == "000000000000000") {
                                NPWP = '000000000000000'
                            }
                            if (NPWP != '000000000000000') {
                                var NAMA = invoiceSearchResult[j].getValue({ name: "companyname", join: "customer" });
                            } else {
                                var NAMA = formatValue(invoiceSearchResult[j].getValue({ name: "custentity_me_nomor_ktp", join: "customer" })) + '#NIK ' + 'NAMA ' + invoiceSearchResult[j].getValue({ name: "companyname", join: "customer" });
                            }

                            var ALAMAT_LENGKAP = invoiceSearchResult[j].getValue({ name: "address", join: "customer" });
                            var JUMLAH_PPNBM = '0';
                            var ID_KETERANGAN_TAMBAHAN = '0';
                            var FG_UANG_MUKA = '0';
                            var UANG_MUKA_DPP = '0';
                            var UANG_MUKA_PPN = '0';
                            var UANG_MUKA_PPNBM = '0';
                            var JUMLAH_DPP = formatValue((Number(invoiceSearchResult[j].getValue("total")) - (Number(invoiceSearchResult[j].getValue("taxtotal")) || 0)) / 10);
                            var JUMLAH_PPN = formatValue(JUMLAH_DPP / 10);
                            var REFERENSI = formatValue(invoiceSearchResult[j].getValue("transactionname"));
                            var DISKON = '0';

                            /**
                             * Define value for OF
                             */
                            var KODE_OBJEK = '0';
                            var TARIF_PPNBM = '0';
                            var PPNBM = '0';

                            var NAMA_ITEM = invoiceSearchResult[j].getValue('memo');
                            var HARGA_SATUAN = formatValue(invoiceSearchResult[j].getValue("rate"));
                            var JUMLAH_BARANG = Math.abs(invoiceSearchResult[j].getValue('quantity'));
                            var HARGA_TOTAL = Math.abs(formatValue(invoiceSearchResult[j].getValue("amount")));
                            var DPP = Math.abs(formatValue(invoiceSearchResult[j].getValue("amount")) / 10);
                            var PPN = formatValue(DPP / 10);

                            /**
                             * Define value for LT
                             */
                            if (NPWP != '000000000000000') {
                                var NPWP_LT = NPWP;
                                var NAMA_LT = invoiceSearchResult[j].getValue({ name: "companyname", join: "customer" })
                            } else {
                                var NPWP_LT = '0'
                                var NAMA_LT = ''
                            }


                            if (checkID == null || checkID != idInvoice) {
                                var valueBodyEfaktur = "FK," + KD_JENIS_PENGGANTI + "," + FG_PENGGANTI + "," + NOMOR_FAKTUR + "," + MASA_PAJAK + "," + TAHUN_PAJAK + "," + TANGGAL_FAKTUR + "," + NPWP + "," + NAMA + "," + ALAMAT_LENGKAP + "," + JUMLAH_DPP + "," + JUMLAH_PPN + "," + JUMLAH_PPNBM + "," + ID_KETERANGAN_TAMBAHAN + "," + FG_UANG_MUKA + "," + UANG_MUKA_DPP + "," + UANG_MUKA_PPN + "," + UANG_MUKA_PPNBM + "," + REFERENSI;
                                rawContent += valueBodyEfaktur + "\n";
                                var valueLTEfaktur = "LT," + NPWP_LT + "," + NAMA_LT;
                                rawContent += valueLTEfaktur + "\n";
                                refId.push(REFERENSI);
                            }
                            var valueLineEfaktur = "OF," + KODE_OBJEK + "," + NAMA_ITEM + "," + HARGA_SATUAN + "," + JUMLAH_BARANG + "," + HARGA_TOTAL + "," + DISKON + "," + DPP + "," + PPN + "," + TARIF_PPNBM + "," + PPNBM;
                            rawContent += valueLineEfaktur + "\n";

                            checkID = idInvoice;
                        }
                    }
                    startRow += pageSize
                } while (invoiceSearchResult.length === pageSize);

                var nameFile = refId.length > 0 ? 'e-Faktur' + ' ' + moment().subtract(0, 'months').format('MMMM') + ' ' + refId[0] + '-' + refId[refId.length - 1] + '.csv' : 'e-Faktur ' + moment().subtract(0, 'months').format('MMMM') + '.csv';
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