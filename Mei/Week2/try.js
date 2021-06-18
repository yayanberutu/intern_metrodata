/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([], function() {
    const ASSET_TYPE = [
        { name: 'land', internalid: 302, numbering: '' },
        { name: 'Building', internalid: 303, numbering: '' },
        { name: 'Owned Building Renovation', internalid: 304, numbering: '' },
        { name: 'Leasehold Improvement	', internalid: 305, numbering: 300001, padding: 5},
        { name: 'Furniture', internalid: 306, numbering: 800001, padding: 5},
        { name: 'Office Equipment	', internalid: 307, numbering: '', padding: 5 },
        { name: 'Building Equipment	', internalid: 308, numbering: 210000, padding: 5 },
        { name: 'Vehicle', internalid: 309, numbering: 4001, padding:  7},
        { name: 'IT Equipment', internalid: 310, numbering: 600001, padding: 5 },
        { name: 'Courier Equipment', internalid: 311, numbering: 600001, padding: 5 },
        { name: 'Hub & SP - Operational Building', internalid: 402, numbering: 800006, padding: 5 },
        { name: 'Hub & SP - Owned Building Renovation', internalid: 403, numbering: '' },
        { name: 'Hub & SP - Leasehold Improvement', internalid: 404, numbering: 300006, padding: 5 },
        { name: 'Hub & SP - Furniture', internalid: 405, numbering: 800006, padding: 5 },
        { name: 'Hub & SP - Office Equipment', internalid: 406, numbering: 800006, padding: 5 },
        { name: 'Hub & SP - Building Equipment', internalid: 407, numbering: 800006, padding: 5 },
        { name: 'Hub & SP - Operational Vehicle', internalid: 408, numbering: 4001, padding: 7},
        { name: 'Hub & SP - IT Equipment', internalid: 409, numbering: 600004, padding: 6 },
        { name: 'Hub & SP - Courier Equipment', internalid: 410, numbering: 600004, padding: 6 },
        { name: 'Hub & SP LVA', internalid: 502, numbering: 800001, padding: 5 },
        { name: 'LVA', internalid: 602, numbering: 800001, padding: 5 },
        { name: 'Intangible Assets', internalid: 603, numbering: 900001, padding: 5 },
        { name: 'CIP- Building', internalid: 702, numbering: ''}

    ]

    
    document.writeln(parseInt(asset));
    function beforeLoad(context) {
        
    }

    function beforeSubmit(context) {
        var assetType = 'Hub & SP - Building Equipment';
        var asset = ASSET_TYPE.find(asset => asset.name === assetType).numbering;        
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    }
});
