// should be called with each result from 'select * from chat_list'
var chat = {
    parse: function(waChat) {
        var self = this;
        function isGroup() {
            self.isGroup = waChat.key_remote_jid.indexOf('-') !== -1;
        }
        this.jid = waChat.key_remote_jid;
        this.isGroup = isGroup();
        if (this.isGroup) {
            this.subject = waChat.subject;
        }
        this.messages = [];
    }
};

module.exports = chat;
