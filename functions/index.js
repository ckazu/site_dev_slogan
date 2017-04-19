const functions = require('firebase-functions');
const admin = require('firebase-admin');
const _ = require('underscore');

admin.initializeApp(functions.config().firebase);

const formattedAttachments = (key, value) => {
    return {
        callback_id: "remove",
        text: value,
        actions: [{
            name: "remove",
            text: "削除",
            type: "button",
            style: "danger",
            value: key,
            confirm: {
                title: "確認",
                text: "このデータを削除しますか？",
                ok_text: "はい",
                dismiss_text: "いいえ"
            }
        }]
    }
}

exports.slogan = functions.https.onRequest((req, res) => {
    const db = admin.database();
    const ref = db.ref("/slogan");

    if(req.body.payload) {
        const payload = JSON.parse(req.body.payload);
        if (payload.actions[0].name == "remove") {
            ref.child(payload.actions[0].value).remove();

            ref.limitToFirst(100).once('value', (snapshot) => {
                const attachments = _.map(snapshot.val(), (value, key) => { return formattedAttachments(key, value); });
                res.json({response_type: "ephemeral", text: "削除しました", attachments: attachments});
            });
        }

    } else if(_.isEmpty(req.body.text)) {
        ref.limitToFirst(100).once('value', (snapshot) => {
            res.json({response_type: "in_channel", text: _.sample(snapshot.val())});
        });

    } else {
        switch (true) {
        case /^add[\s]+.*$/.test(req.body.text):
            const text = req.body.text.match(/add[\s]*(.*)$/)[1];
            ref.push().set(text);
            res.json({response_type: "ephemeral", text: "`" + text + "`を追加しました"});
            break;

        case /^list[\s]*$/.test(req.body.text):
            ref.limitToFirst(100).once('value', (snapshot) => {
                const attachments = _.map(snapshot.val(), (value, key) => { return formattedAttachments(key, value); });
                res.json({response_type: "ephemeral", attachments: attachments});
            });
            break;

        default:
            res.status(404).end('error!: ' + req.body.text);
            break;
        }
    }
});
