/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/url', 'N/search', 'N/record'], function (url, search, record) {

    function pageInit(context) {
        console.log('context', context);
        var rec = context.currentRecord;
        console.log('rec', rec);
    }
    function fieldChanged(context) {
        var rec = context.currentRecord;
        if (context.fieldId == 'custpage_filter_id' || context.fieldId == 'custpage_filter_department' || context.fieldId == 'custpage_filter_class' || context.fieldId == 'custpage_filter_location') {
            //|| context.fieldId == 'custpage_filter_deviasi'
            console.log('context.fieldId', context.fieldId);
            console.log('custpage_filter_id', rec.getValue('custpage_filter_id'));

            var output = url.resolveScript({
                scriptId: '306',
                deploymentId: '1',
                params: {
                    idRAS: rec.getValue('custpage_filter_id'), 
                    department: rec.getValue('custpage_filter_department'),
                    classification: rec.getValue('custpage_filter_class'),
                    location: rec.getValue('custpage_filter_location'),
                    // deviasi: rec.getValue('custpage_filter_deviasi')
                }
            });
            window.location.replace(output);
        }
        return true;
    }

    function saveRecord(context) {
        var rec = context.currentRecord;
        var lineCount = rec.getLineCount('custpage_raslist');
        console.log('lineCount', lineCount);
        var count = 0;

        var itemDept = rec.getValue('custpage_body_department');
        if (!itemDept) {
            alert('Please enter value(s) for: Department');
            return false;
        }
        var trandate = rec.getText('custpage_body_date');
        if (!trandate) {
            alert('Please enter value(s) for: Date')
            return false;
        }
        var year = trandate.substring(trandate.length - 4);
        var period = String(trandate.substring(3, 5));
        if (period.charAt(0) == "0") period = period.replace("0", "");
        period = parseInt(period);

        for (var i = 0; i < lineCount; i++) {
            var checkmark = rec.getSublistValue({
                sublistId: 'custpage_raslist',
                fieldId: 'custpage_ras_checkbox',
                line: i
            })
            console.log('checkmark', checkmark);
            console.log('i', i);
            if (checkmark) {
                count++;
                var itemLineId = rec.getSublistValue({ sublistId: 'custpage_raslist', fieldId: 'custpage_ras_lineid', line: i });
                var itemItem = rec.getSublistValue({ sublistId: 'custpage_raslist', fieldId: 'custpage_ras_item', line: i });
                var itemAcc = search.lookupFields({ type: 'item', id: itemItem, columns: 'expenseaccount' }).expenseaccount[0].value;

                var itemQty = rec.getSublistValue({ sublistId: 'custpage_raslist', fieldId: 'custpage_ras_quantity', line: i }) || 0;
                if (itemQty <= 0) {
                    alert('Quantity value, at item line ' + itemLineId + ", can't be equal or less than 0!");
                    return false;
                }
                var itemRate = rec.getSublistValue({ sublistId: 'custpage_raslist', fieldId: 'custpage_ras_estrate', line: i }) || 0;
                if (itemRate <= 0) {
                    alert('Rate value, at item line ' + itemLineId + ", can't be equal or less than 0!");
                    return false;
                }
                var itemAmt = itemQty * itemRate

                var BDSearch = search.create({
                    type: 'customrecord_me_budget_detail',
                    filters: [
                        ['custrecord_me_bd_department', 'anyof', itemDept], 'AND',
                        ['custrecord_me_bd_account', 'anyof', itemAcc], 'AND',
                        ['custrecord_me_bd_year', 'contains', year], 'AND',
                        ["custrecord_me_bd_variance_related.custrecord_me_bd_variance_period", "equalto", period]
                    ],
                    columns: ['internalid']
                }).run().getRange({ start: 0, end: 1 }); // cost 1+10
                if (BDSearch.length > 0) {
                    var recBD = record.load({
                        type: 'customrecord_me_budget_detail',
                        id: BDSearch[0].id
                    });

                    var varianceLineCount = recBD.getLineCount('recmachcustrecord_me_bd_variance_related');
                    var availableVariance = 0;
                    for (var y = 0; y < varianceLineCount; y++) {
                        var variancePeriod = recBD.getSublistValue({
                            sublistId: 'recmachcustrecord_me_bd_variance_related',
                            fieldId: 'custrecord_me_bd_variance_period',
                            line: y
                        });
                        if (variancePeriod >= period) {
                            availableVariance += (recBD.getSublistValue({
                                sublistId: 'recmachcustrecord_me_bd_variance_related',
                                fieldId: 'custrecord_me_bd_variance_variance',
                                line: y
                            }) || 0);
                        }
                    }
                    if (itemAmt > availableVariance) {
                        return confirm('The amount you trying to submit for item line ' + itemLineId + ' is over the budget, with the difference of ' + (availableVariance - itemAmt) + ' from the remaining available funds!');
                    }
                }
            }
        }
        console.log('count', count)
        if (count == 0) {
            alert('You need to tick at least one item line to create a PR record from this page!');
            return false;
        }
        return true;
    }

    return {
        //pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    }
});
