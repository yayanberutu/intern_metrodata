/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function (record, search) {

    const ASSET_TYPE = [
        { internalid: 302, numbering: '' },
        { internalid: 303, numbering: '' },
        { internalid: 304, numbering: '' },
        { internalid: 305, numbering: 300001, padding: 6},
        { internalid: 306, numbering: 800001, padding: 6},
        { internalid: 307, numbering: 800001, padding: 6 },
        { internalid: 308, numbering: 210000, padding: 6 },
        { internalid: 309, numbering: 4001, padding:  8},
        { internalid: 310, numbering: 600001, padding: 6 },
        { internalid: 311, numbering: 600001, padding: 6 },
        { internalid: 402, numbering: 800006, padding: 6 },
        { internalid: 403, numbering: '' },
        { internalid: 404, numbering: 300006, padding: 6 },
        { internalid: 405, numbering: 800006, padding: 6 },
        { internalid: 406, numbering: 800006, padding: 6 },
        { internalid: 407, numbering: 800006, padding: 6 },
        { internalid: 408, numbering: 4001, padding: 8},
        { internalid: 409, numbering: 600004, padding: 7 },
        { internalid: 410, numbering: 600004, padding: 7 },
        { internalid: 502, numbering: 800001, padding: 6 },
        { internalid: 602, numbering: 800001, padding: 6 },
        { internalid: 603, numbering: 900001, padding: 6 },
        { internalid: 702, numbering: ''}

    ]

    //Function to get the latest number of record
    function getLatestNumber(format, assetType){
        var customrecord_ncfar_assetSearchObj = search.create({
            type: "customrecord_ncfar_asset",
            filters:
            [
                ["name","startswith", format.toString()] ,
                    "AND", 
                ["custrecord_assettype","anyof", assetType]        
            ],

            columns:
            [
               search.createColumn({name: "name", label: "ID"}),
               search.createColumn({
                  name: "altname",
                  sort: search.Sort.DESC,
                  label: "Name"
               }),      
               search.createColumn({name: "custrecord_assettype", label: "Asset Type"})
            ]
         }).run().getRange({ start: 0, end: 1 });

         log.debug('result_saved_search', customrecord_ncfar_assetSearchObj);
        return customrecord_ncfar_assetSearchObj;   
    }

    /*
        Function to add the leading zero
        Arguments: 
            num: Number that want to add the leading zero
            len: Digit Length of the back number
        Return:
            number with leading zero 
    */
    function addLeadingZero(num, len){
        var digit = len - (num.toString().length);
        var result = num + '';
        for(var i=0; i<digit; i++){
            result = '0' + result;
        }
        return result;
    }

    /*
        Function to create the new numbering
        Arguments: 
            format: front format number that want to construct
            latest_number: end format number that want to construct
            padding: the length of end format number
        Return:
            the newest numbering format

    */
    function createNewestNumbering(format, latest_number, padding){
        log.debug('tipe format', typeof(format));
        log.debug('tipe latest_number', typeof(latest_number));
        var numberInChar = latest_number;
        if(latest_number != '0') numberInChar = latest_number.toString().slice(format.toString().length);
        log.debug('numInChar', numberInChar);
        
        //number after increment
        var numberInInt = Number(numberInChar) + 1;
        log.debug('numInInt', numberInInt);

        //add leading zero to the new increment number
        var end_format = addLeadingZero(numberInInt, padding);
        var newNumbering = format + end_format;
        return newNumbering;
    }

    function afterSubmit(context) {
        if(context.type == 'create'){
            var rec = context.newRecord;
            var assetType = rec.getValue('custrecord_assettype');
            // log.debug('assettype: ',assetType);

            //If the assetType doesn't have the numbering format, the program will end
            if(assetType == 302 || assetType == 303 || assetType == 304 || assetType == 403 || assetType == 702){
                return ;
            }

            var format;
            var padding;
            for(var i=0; i<ASSET_TYPE.length; i++){
                if(ASSET_TYPE[i].internalid == assetType){
                    format = ASSET_TYPE[i].numbering;
                    padding = ASSET_TYPE[i].padding;
                    break;
                }
            }   
            log.debug('format', format);

            //get the latest numbering
            var savedsearch = getLatestNumber(format, assetType);
            var latest_number;
            // log.debug('type of saved search', latest_number);
            try{
                latest_number = savedsearch[0].getValue('altname');
            }catch(err){
                latest_number = '0';
            }
            //assign the newest numbering
            var newNumbering = createNewestNumbering(format, latest_number, padding);
        
            log.debug('newnumbering', newNumbering);
            rec.setValue('altname', newNumbering);
        }
        
    }

    return {
        afterSubmit: afterSubmit
    }
});
