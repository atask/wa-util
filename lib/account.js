'use strict';

var sqlite3 = require('sqlite3').verbose(),
    debug = require('debug')('account');

var format = require('string-template');

var user = require('./user'),
    chat = require('./chat'),
    message = require('./message');

    // we only care for actual users, not groups: filter all contacts with no '-'.
var QUERY_GET_USERS = 'SELECT * FROM wa_contacts WHERE is_whatsapp_user=1 AND jid NOT LIKE "%-%"',
    QUERY_GET_CHATS = 'SELECT * FROM chat_list',
    QUERY_GET_MSGS = 'SELECT * FROM messages WHERE key_remote_jid=$jid ORDER BY received_timestamp ASC';

function load(waPath, msgstorePath, callback) {
    var self = this,
        wa = new sqlite3.Database(waPath),
        msgstore = new sqlite3.Database(msgstorePath);
 
    // get users
    this.users = [];
    wa.each(QUERY_GET_USERS, function parseUser(waErr, waUser) {
        if (waErr) {
            callback(waErr);
        }
        var userElem = Object.create(user);
        userElem.parse(waUser);
        self.users.push(userElem);
    });

    // get chats
    this.chats = [];
    msgstore.each(QUERY_GET_CHATS, function parseChat(msgstoreErr, waChat) {
        if (msgstoreErr) {
            callback(msgstoreErr);
        }
        var chatElem = Object.create(chat);
        chatElem.parse(waChat);
        self.chats.push(chatElem);
    });

    // get messages
    this.messages = [];
    msgstore.each(QUERY_GET_MSGS, function parseMessage(msgstoreErr, waMessage) {
        if (msgstoreErr) {
            callback(msgstoreErr);
        }
        var messageElem = Object.create(message);
        messageElem.parse(waMessage);
        self.messages.push(messageElem);
    });

    // all done!
    callback();
}

module.exports = {
    load: load
};
