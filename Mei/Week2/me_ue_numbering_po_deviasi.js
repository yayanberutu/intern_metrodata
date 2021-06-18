/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function (record, search) {

    function afterSubmit(context) {
        var rec = context.newRecord;
        var recId = rec.id
        if (context.type == 'create') {
            var tranid = rec.getValue('tranid');
            // var fullYear = (new Date()).getFullYear().toString()
            // var currentYear = fullYear.substring(2, 4);
            // var leftPad = '';
            var customform = rec.getValue('customform');
            if (customform == 118) {// ME - PO Deviasi
                // var searchPODeviasi = search.create({
                //     type: 'purchaseorder',
                //     filters: [
                //         ["numbertext", "contains", "PO" + currentYear], "AND",
                //         ["mainline", "is", "T"]
                //     ],
                //     columns: search.createColumn({
                //         name: "tranid",
                //         sort: search.Sort.DESC,
                //         label: "Document Number"
                //     })
                // }).run().getRange({ start: 0, end: 1 });

                // if (searchPODeviasi.length > 0) {
                //     tranid = Number((searchPODeviasi[0].getValue('tranid') + 1).substring(13));
                // }
                // var runningNumberCount = 6 - tranid.toString().length;
                // for (var index = 0; index < runningNumberCount; index++) {
                //     leftPad = leftPad + "0";
                // }

                //var newTranId = "PO/DEVIASI/" + currentYear + "" + leftPad + "" + tranid;
                var newTranId = tranid + '/DEVIASI';
                var newRecordPO = record.submitFields({
                    type: 'purchaseorder',
                    id: recId,
                    values: {
                        tranid: newTranId
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});
