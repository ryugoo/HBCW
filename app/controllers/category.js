var args = arguments[0] || {},
    cats = Alloy.CFG.CATEGORIES;

_.each(cats, function (value, key) {
    'use strict';
    var section, row;
    section = $.section;
    row = Ti.UI.createTableViewRow({
        title: value.title,
        _url: value.url,
        _key: key
    });
    if (OS_ANDROID) {
        row.applyProperties({
            width: Ti.UI.FILL,
            height: '44dp',
            color: '#333333',
            font: {
                fontSize: '18sp',
                fontWeight: 'bold'
            }
        });
    }
    section.add(row);
});

function dismiss() {
    'use strict';
    $.window.close();
}

function select(e) {
    'use strict';

    var data = OS_IOS ? e.rowData : e.source;

    $.trigger('select', {
        title: data.title,
        url: data._url,
        key: data._key
    });
}
