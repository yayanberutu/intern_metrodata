/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([], function() {

    function beforeLoad(context) {
        if(context.type == 'create'){
            var rec = context.newRecord;
            rec.setValue("custbody_me_custom_body_csvstatus", false);
        }
    }

    return {
        beforeLoad: beforeLoad
        // beforeSubmit: beforeSubmit
    }
});
