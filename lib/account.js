var sqlite3 = require('sqlite3').verbose(),
    format = require('string-template'),
    debug = require('debug')('account'),
    chat = require('./chat');

var chats = [],
    QUERY_GET_USERS = 'SELECT * FROM wa_contacts WHERE is_whatsapp_user = 1',
    QUERY_GET_MSG = 'SELECT * FROM messages WHERE key_remote_jid=? ORDER BY _id ASC;';

var account = {
    init: function(waPath, msgstorePath, callback) {
        var wa = new sqlite3.Database(waPath),
	    msgstore = new sqlite3.Database(msgstorePath),
            stmt = msgstore.prepare(QUERY_GET_MSG);

	wa.each(QUERY_GET_USERS, function getChats(waErr, waRow) {
	    if(waErr) {
	        callback(waErr);
	    }
	    
	    debug(format('working on chat: {0} [{1}]', waRow.display_name, waRow.jid));

	    // init chat object
	    var chatElem = Object.create(chat);
	    chatElem.name = waRow.display_name;
	    chatElem.messages = [];

	    // extract messages from msgstore
	    stmt.each(waRow.jid, function getMessages(msgstoreErr, msgstoreRow) {
	        if(msgstoreErr) {
	            callback(msgstoreErr);
	        }
		debug(format('Message: {0}', msgstoreRow.data));
	    });

	    // add chat only if it has messages
	    if(chatElem.messages.length !== 0) {
	        chats.push(chatElem);
            }
	}, callback);
    }
};

module.exports = account;
