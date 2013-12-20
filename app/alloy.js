// グローバル
Alloy.Globals.ChatWork = require('chatwork')();
Alloy.Globals.ChatWork.init({
    token: Alloy.CFG.CHATWORK_API_TOKEN
});

// シングルコレクション
Alloy.Collections.entry = Alloy.createCollection('entry');
Alloy.Collections.queue = Alloy.createCollection('entry');
