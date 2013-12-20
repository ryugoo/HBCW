exports.definition = {
    config: {
        columns: {
            'title': 'text',
            'link': 'text',
            'description': 'text',
            'count': 'integer'
        },
        adapter: {
            type: 'sql',
            collection_name: 'entry',
            // URL をモデルの ID として使う
            idAttribute: 'link'
        }
    },
    extendModel: function (Model) {
        _.extend(Model.prototype, {});

        return Model;
    },
    extendCollection: function (Collection) {
        _.extend(Collection.prototype, {
            /**
             * ホットエントリを取得してコレクションに格納する
             * @method getHotEntry
             * @param {String} category カテゴリ名
             * @param {Function} callback コールバック関数
             */
            getHotEntry: function (category, callback) {
                'use strict';

                // カテゴリが指定されていなければホットエントリを選択する
                var that, url, cats, onload;
                if (OS_IOS) {
                    that = this;
                }
                cats = Alloy.CFG.CATEGORIES;
                if (category) {
                    url = cats[category].url;
                } else {
                    url = cats.HOTENTRY.url;
                }

                // RSS を取りに行く
                var http = Ti.Network.createHTTPClient();
                http.open('GET', url);

                onload = function () {
                    var feed = http.responseXML,
                        items = feed.documentElement.getElementsByTagName('item'),
                        arr = [],
                        i = 0,
                        l = items.length,
                        base, obj;

                    while (i < l) {
                        base = items.item(i);
                        obj = {
                            title: base.getElementsByTagName('title').item(0).text,
                            link: base.getElementsByTagName('link').item(0).text,
                            description: base.getElementsByTagName('description').item(0).text,
                            count: base.getElementsByTagName('hatena:bookmarkcount').item(0).text
                        };
                        arr.push(obj);
                        i += 1;
                    }

                    // 取得した結果でリストを入れ替える
                    if (OS_IOS) {
                        that.reset(arr, {
                            merge: true,
                            remove: true,
                            silent: true
                        });
                    } else {
                        this.reset(arr, {
                            merge: true,
                            remove: true,
                            silent: true
                        });
                    }

                    callback({
                        success: true,
                        code: http.status
                    });

                    // GC
                    http.onload = null;
                    http.onreadystatechange = null;
                    http.ondatastream = null;
                    http.onsendstream = null;
                    http.onerror = null;
                    http = null;
                };
                if (OS_ANDROID) {
                    onload = onload.bind(this);
                }
                http.onload = onload;

                http.onerror = function () {
                    callback({
                        success: false,
                        code: http.status
                    });

                    // GC
                    http.onload = null;
                    http.onreadystatechange = null;
                    http.ondatastream = null;
                    http.onsendstream = null;
                    http.onerror = null;
                    http = null;
                };
                http.send();
            },

            /**
             * キューに蓄積されたメッセージを送信する
             * @method send
             * @param {Function} callback コールバック関数
             */
            send: function (callback) {
                'use strict';
                var client = Alloy.Globals.ChatWork,
                    chat_id = Alloy.Globals.MY_CHAT_ID,
                    endpoint = 'rooms/' + chat_id + '/messages',
                    compose = '';

                // 登録された内容でメッセージを組み立てる
                this.each(function (entry) {
                    compose += String.format('%s\n%s\n\n',
                        entry.get('title'),
                        entry.get('link')
                    );
                });

                // 前後の余白、改行を取り除く
                compose = require('alloy/string').trim(compose);

                // 送信
                client.post(endpoint, {
                    body: String.format('[info][title]HBCW で登録しました！(%d件)[/title]%s[/info]',
                        this.length,
                        compose
                    )
                }, function (err, res) {
                    if (err) {
                        console.error(err);
                        console.debug(res);
                        callback({
                            success: false
                        });
                    } else {
                        console.debug(res);
                        callback({
                            success: true
                        });
                    }
                });
            }
        });

        return Collection;
    }
};
