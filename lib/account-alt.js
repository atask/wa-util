'use strict';

var sqlite3 = require('sqlite3').verbose(),
    debug = require('debug')('account');

var format = require('string-template');

var chat = require('./chat'),
    message = require('./message');

var chats = [],
    chatLoadCounter = 0,
    QUERY_GET_CHAT_IDS = 'SELECT DISTINCT key_remote_jid FROM messages',
    
    // more restrictive selection... add image?
    //QUERY_GET_USERS = 'SELECT * FROM wa_contacts WHERE is_whatsapp_user = 1',
    QUERY_GET_USER = 'SELECT jid, display_name WHERE jid=$jid',
    
    //QUERY_GET_MSG = 'SELECT * FROM messages WHERE key_remote_jid=? ORDER BY _id ASC;',
    QUERY_GET_MSGS = 'SELECT * FROM messages WHERE key_remote_jid=$jid ORDER BY received_timestamp ASC;'

function load(waPath, msgstorePath, callback) {
    var wa = new sqlite3.Database(waPath),
        msgstore = new sqlite3.Database(msgstorePath);
    
    // get chat ids
    msgstore.each(QUERY_GET_CHAT_IDS, function parseChat(msgstoreErr, chat) {
        msgstore.get(QUERY_GET_USER, {
            $jid: chat.key_remote_jid
        },
        function parseChat(err, chat_details) {
            var chatElem = Object.create(chat);
            chatElem.parse(chat_details);
            chats.push(chatElem);
            msgstore.each(QUERY_GET_MSG, {
                $jid: chat.key_remote_jid
            },
            function parsemsg(err, data) {}
            );
        });
    };
}


    /*
    var stmt = msgstore.prepare(QUERY_GET_MSG);

    wa.each(QUERY_GET_USERS, function getChats(waErr, waRow) {
        if(waErr) {
            callback(waErr);
        }

        debug(format('working on chat: {0} [{1}]', waRow.display_name, waRow.jid));

        // init chat object
        var chatElem = Object.create(chat);
        chatElem.name = waRow.display_name;
        chatElem.messages = [];
        chatLoadCounter += 1;

        // extract messages from msgstore
        stmt.each(
            waRow.jid,
            function getMessages(msgstoreErr, msgstoreRow) {
                if(msgstoreErr) {
                    callback(msgstoreErr);
                }

                var messageElem = Object.create(message);
                messageElem.data = msgstoreRow.data;
                chatElem.messages.push(messageElem);

                debug(format('Message: {0}', msgstoreRow.data));
            },
            function messageLoaded(msgstoreErr, msgstoreRow) {

                if (msgstoreErr) {
                    callback(msgstoreErr);
                }

                // messages are present, add chat to chat list
                if (chatElem.messages.length !== 0) {
                    chats.push(chatElem);
                }

                // if all chats are parsed, finish
                if (chatLoadCounter === 0) {
                    callback();
                }
            }
        );
    });
}
*/

module.exports = {
    load: load
};
