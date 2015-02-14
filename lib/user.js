// should be called with each result from
// 'select * from wa_contacts where is_whatsapp_user=1 and jid NOT LIKE '%-%''

var path = require('path');

// default folder name for storing profile pics
var PROFILE_PIC_FOLDER = 'Profile Picures',
    PROFILE_PIC_EXT = '.jpg';

var user = {
    parse: function(waUser, basePath) {
        var self = this;
        function getThumbPath() {
            var jidAtPosition = waUser.jid.indexOf('@'),
                jidLocalPart = waUser.jid.substring(0, jidAtPosition);
            self.thumb = path.join(PROFILE_PIC_FOLDER, jidLocalPart + PROFILE_PIC_EXT);
        }

        this.jid = waUser.jid;
        this.status = waUser.status;
        this.displayName = waUser.display_name;
        this.waName = waUser.wa_name;
        this.thumb = getThumbPath();
    }
};

module.exports = user;
