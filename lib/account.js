'use strict';

var sqlite3 = require('sqlite3').verbose(),
    path = require('path'),
    async = require('async'),
    debug = require('debug')('account');

var format = require('string-template');

var user = require('./user'),
    chat = require('./chat'),
    message = require('./message');

// default names for wa.db and msgstore.db
var WA_FILE = 'wa.db',
    MSGSTORE_FILE = 'msgstore.db';

// we only care for actual users, not groups: filter out all contacts with '-' inside.
var QUERY_GET_USERS = 'SELECT * FROM wa_contacts WHERE is_whatsapp_user=1 AND jid NOT LIKE "%-%"',
    QUERY_GET_CHATS = 'SELECT * FROM chat_list',
    QUERY_GET_MSGS = 'SELECT * FROM messages ORDER BY received_timestamp ASC';

function load(baseDir, callback) {
    var self = this,
        waPath = path.join(baseDir, WA_FILE),
        msgstorePath = path.join(baseDir, MSGSTORE_FILE),
        wa = new sqlite3.Database(waPath),
        msgstore = new sqlite3.Database(msgstorePath);

    async.series([
        function fetchUsers(asyncCallback) {
            // get users
            self.users = [];
            wa.each(QUERY_GET_USERS, function parseUser(waErr, waUser) {
                if (waErr) {
                    asyncCallback(waErr);
                }
                var userElem = Object.create(user);
                userElem.parse(waUser);
                self.users.push(userElem);
            }, asyncCallback);
        },

        function fetchChats(asyncCallback) {
            // get chats
            self.chats = [];
            msgstore.each(QUERY_GET_CHATS, function parseChat(msgstoreErr, waChat) {
                if (msgstoreErr) {
                    asyncCallback(msgstoreErr);
                }
                var chatElem = Object.create(chat);
                chatElem.parse(waChat);
                self.chats.push(chatElem);
            }, asyncCallback);
        },

        function fetchMessages(asyncCallback) {
            // get messages
            self.messages = [];
            msgstore.each(QUERY_GET_MSGS, function parseMessage(msgstoreErr, waMessage) {
                if (msgstoreErr) {
                    asyncCallback(msgstoreErr);
                }
                var messageElem = Object.create(message);
                messageElem.parse(waMessage);
                self.messages.push(messageElem);
            }, asyncCallback);
        }],

        // all done!
        callback
    );
}

function getMediaFilesList() {
    var mediaFilesList = [];
    this.messages.forEach(function checkIfMediaFile(msg) {
        var type = msg.type;
        if (type === message.IMAGE || type === message.VIDEO || type === message.AUDIO) {
            mediaFilesList.push(msg.path);
        }
    });
    return mediaFilesList;
}

module.exports = {
    load: load,
    getMediaFilesList: getMediaFilesList
};
