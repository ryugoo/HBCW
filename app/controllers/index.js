if (OS_IOS) {
    $.index = $.ios_base;
} else if (OS_ANDROID) {
    $.index = $.android_base;
} else {
    (Ti.UI.createWindow({
        backgroundColor: '#FFFFFF'
    })).open();
}

function getHotEntry(category) {
    'use strict';
    category = category || false;

    var entries = Alloy.Collections.entry,
        dialogs = require('alloy/dialogs');

    entries.getHotEntry(category, function (result) {
        if (result.success) {
            entries.trigger('change');
        } else {
            console.error(result.code);
            dialogs.confirm({
                title: 'エラー',
                message: 'ホットエントリーの取得に失敗しました'
            });
        }
    });
}

function startApplication() {
    'use strict';
    var client = Alloy.Globals.ChatWork,
        queue = Alloy.Collections.queue,
        props = Ti.App.Properties;

    // 登録待ちキューに追加されたら件数をボタンに表示する
    queue.on('add reset', function () {
        var activity;
        if (OS_IOS) {
            // ナビゲーションボタンのタイトルを更新する
            $.queueCount.title = String.format('%d件送る', queue.length);
        } else if (OS_ANDROID) {
            // アクションバーのメニューを作りなおす
            activity = $.index.activity;
            activity.onCreateOptionsMenu = function (e) {
                var menu, category, send;
                menu = e.menu;
                category = menu.add({
                    title: 'カテゴリ',
                    showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS
                });
                category.addEventListener('click', openCategory);

                send = menu.add({
                    title: String.format('%d件送る', queue.length),
                    showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS
                });
                send.addEventListener('click', sendEntry);
            };
            activity.invalidateOptionsMenu();
        }
    });

    // マイチャットの ID を保管していなければ、自分の情報を取得して保存する
    if (!props.hasProperty('MY_CHAT_ID')) {
        client.get('me').done(function (res, data) {
            props.setInt('MY_CHAT_ID', res.room_id);
            Alloy.Globals.MY_CHAT_ID = res.room_id;
            console.log('[初回起動] マイチャットの ID は : ' + Alloy.Globals.MY_CHAT_ID);
            getHotEntry();
        }).fail(function (err) {
            console.error(err);
            var dialogs = require('alloy/dialogs');
            dialogs.confirm({
                title: 'エラー',
                message: '自分の情報の取得に失敗しました'
            });
        });
    } else {
        Alloy.Globals.MY_CHAT_ID = props.getInt('MY_CHAT_ID');
        console.log('[取得済み] マイチャットの ID は : ' + Alloy.Globals.MY_CHAT_ID);
        getHotEntry();
    }
}

function sendEntry(e) {
    'use strict';
    var dialog = require('alloy/dialogs'),
        count = Alloy.Collections.queue.length;

    if (count) {
        dialog.confirm({
            title: '確認',
            message: String.format('%d件送信しますか？', count),
            yes: 'はい',
            no: 'いいえ',
            callback: function (yes) {
                var queue = Alloy.Collections.queue;

                // はいを選択したとき
                if (yes) {
                    queue.send(function (result) {
                        if (result.success) {
                            queue.reset();
                        } else {
                            var dialogs = require('alloy/dialogs');
                            dialogs.confirm({
                                title: 'エラー',
                                message: 'マイチャットへの送信に失敗しました'
                            });
                        }
                    });
                }
            },
            evt: true
        });
    } else {
        alert('先に興味があるエントリをタップしてください');
    }
}

function enqueEntry(e) {
    'use strict';
    var item = e.section.getItemAt(e.itemIndex),
        title = item.title.text,
        link = item.link.text,
        queue = Alloy.Collections.queue;

    queue.add({
        title: title,
        link: link,
        description: '',
        count: 0
    }, {
        merge: true
    });
}

function openCategory() {
    'use strict';
    var category_controller = Alloy.createController('category'),
        category_window = category_controller.getView();

    // カテゴリ選択
    category_controller.on('select', function (e) {
        category_window.close();

        if (OS_IOS) {
            $.window.title = e.title;
        } else if (OS_ANDROID) {
            $.index.activity.actionBar.title = e.title;
        }

        getHotEntry(e.key);
    });

    // ウィンドウを閉じるときにイベントの購読を解除
    category_window.addEventListener('close', function () {
        category_controller.off('select');
    });

    if (OS_IOS) {
        category_window.open({
            modal: true,
            modalTransitionStyle: Ti.UI.iPhone.MODAL_TRANSITION_STYLE_CROSS_DISSOLVE
        });
    } else {
        category_window.open();
    }
}

$.index.open();

$.index.addEventListener('close', function () {
    'use strict';
    var queue = Alloy.Collections.queue;
    queue.off('add reset');
    $.destroy();
});
