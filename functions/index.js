const functions = require('firebase-functions');
const admin = require('firebase-admin');
const _ = require('underscore');

admin.initializeApp(functions.config().firebase);

exports.slogan = functions.https.onRequest((req, res) => {
    const db = admin.database();
    const ref = db.ref("/slogan");

    if(_.isEmpty(req.body.text)) {
        ref.limitToFirst(100).once('value', (snapshot) => {
            res.json({response_type: "in_channel", text: _.sample(snapshot.val())});
        });
    } else {
        switch (true) {
        case /^add[\s]+.*$/.test(req.body.text):
            const [_add, text] = req.body.text.match(/add[\s]*(.*)$/);
            ref.push().set(text);

            ref.limitToFirst(100).once('value', (snapshot) => {
                const list = _.map(snapshot.val(), function(v, k) { return '[' + k + ']: ' + v}).join("\n")
                res.json({response_type: "in_channel", text: "追加しました\n" + list});
            });
            break;
        case /^list[\s]*$/.test(req.body.text):
            ref.limitToFirst(100).once('value', (snapshot) => {
                res.json({
                    response_type: "in_channel",
                    text: _.map(snapshot.val(), function(v, k) { return '[' + k + ']: ' + v}).join("\n")
                });
            });
            break;
        case /^remove[\s]+.*$/.test(req.body.text):
            const [_remove, key] = req.body.text.match(/remove[\s]*(.*)$/);

            ref.child(key).remove();
            ref.limitToFirst(100).once('value', (snapshot) => {
                const list = _.map(snapshot.val(), function(v, k) { return '[' + k + ']: ' + v}).join("\n")
                res.json({response_type: "in_channel", text: list});
            });

            break;
        default:
            res.status(404).end('error!: ' + req.body.text);
            break;
        }
    }
});
