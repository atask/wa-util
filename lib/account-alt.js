'use strict';

var sqlite3 = require('sqlite3').verbose(),
    debug = require('debug')('account');

var format = require('string-template');

var chat = require('./chat'),
    message = require('./message');

var chatLoadCounter = 0,
    // TODO: better off to change this with 'SELECT DISTINCT key_remote_jid FROM messages'
    // and just work off msgstore.db...
    QUERY_GET_CHATS = 'SELECT DISTINCT key_remote_jid FROM messages',
    
    // more restrictive selection... add image?
    //QUERY_GET_USERS = 'SELECT * FROM wa_contacts WHERE is_whatsapp_user = 1',
    QUERY_GET_CHAT = 'SELECT display_name FROM wa_contacts WHERE jid=$jid',
    
    //QUERY_GET_MSG = 'SELECT * FROM messages WHERE key_remote_jid=? ORDER BY _id ASC;',
    QUERY_GET_MSGS = 'SELECT * FROM messages WHERE key_remote_jid=$jid ORDER BY received_timestamp ASC;'

function load(waPath, msgstorePath, callback) {
    var wa = new sqlite3.Database(waPath),
        msgstore = new sqlite3.Database(msgstorePath);
    
    // get chat ids
    this.chats = [];
    msgstore.each(QUERY_GET_CHATS, [], function parseChatId(msgstoreErr, chatIdRow) {
        var jid = chatIdRow.key_remote_jid;
        wa.get(QUERY_GET_CHAT, { $jid: jid }, function parseChat(msgstoreErr, chatInfoRow) {
            
            this.chats = [];
            var chatsElem = Object.create(chat);
            chatsElem.parse(chatInfoRow);

            msgstore.each(QUERY_GET_MSGS, { $jid: jid },
            
                function parseMsg(msgstoreErr, msgRow) {
                    if (msgstoreErr) {
                        callback(msgstoreErr);
                    }
                    
                    var msgElem = Object.create(message);
                    msgElem.parse(msgRow);
                    chatsElem.addMessage(msgElem);
                },

                function completeMsg(msgstoreErr) {
                    if (msgstoreErr) {
                        callback(msgstoreErr);
                    }

                    if(chatsElem.lenght !== 0) {
                        this.chats.push(chatsElem);
                    }
                }
            );
        });
    });
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
