var assert = require('assert');

// magic numbers for message's thumb_image parse
// in order to obtain the path for a media file
var MEDIA_PATH_LENGTH = 281,
    MEDIA_PATH_START = 282;

// media folder path
var MEDIA_PATH_TOKEN = 'WhatsApp/Media';

// message status value for system messages
var SYSTEM_STATUS = 6;

// message types
var TEXT = 'text',
    IMAGE = 'image',
    AUDIO = 'audio',
    VIDEO = 'video',
    VCARD = 'vcard',
    GPS = 'gps',
    SYSTEM = 'system';

// available system actions
var ACTION_CREATE = 'action_create',
    ACTION_JOIN = 'action_join',
    ACTION_EDIT_SUBJECT = 'action_edit_subject',
    ACTION_QUIT = 'action_quit',
    ACTION_EDIT_ICON = 'action_edit_icon',
    ACTION_INVITE = 'action_invite',
    ACTION_ADMIN = 'action_admin',
    ACTION_KICK = 'action_kick';

/*
media_size field identifies the system message
=11      -> group invite, name in data
=4       -> group join (not sure, but present right in the beginning of the chat)
=1       -> subject edit, new subject in data
=5       -> group leave
=6       -> icon update (data has timestamp?!?)
=12 BLOB -> user add: added user in thumb_image blob, inviter in remote_resource
=15 BLOB -> user becomes admin: blessed user in blob, admin in remote
=14 BLOB -> user kick, victim in blob, kicker in remote
*/

var TYPES_INDEX = [TEXT, IMAGE, AUDIO, VIDEO, VCARD, GPS],
    ACTION_INDEX = {
        11: ACTION_CREATE,
        4: ACTION_JOIN,
        1: ACTION_EDIT_SUBJECT,
        5: ACTION_QUIT,
        6: ACTION_EDIT_ICON,
        12: ACTION_INVITE,
        15: ACTION_ADMIN,
        14: ACTION_KICK
    };

var message = {
    parse: function(waMessage) {
        var self = this;

        function getPreview() {
            if(waMessage.raw_data) {
                self.preview = waMessage.raw_data;
            }
        }

        /*
        thumb_image contains preview meta, but right now i'm just
        interested in the media path: looks like it's stored
        at a fixed offset.
        */
        function getFileData() {
            var length = waMessage.thumb_image[MEDIA_PATH_LENGTH],
                end = MEDIA_PATH_START + length,
                path = waMessage.thumb_image.toString('ascii', MEDIA_PATH_START, end),
                pathTokenPosition = path.indexOf(MEDIA_PATH_TOKEN);
            // TODO: assert some stuff on path/pathTokenPosition ?
            self.path = path.substring(pathTokenPosition);
            self.size = waMessage.media_size;
            self.mime = waMessage.media_mime_type;
        }

        function getType() {
            self.type = TYPES_INDEX[waMessage.media_wa_type];
            if (self.type === TEXT && waMessage.status === SYSTEM_STATUS) {
                self.type = SYSTEM;
                self.action = ACTION_INDEX[waMessage.media_size];
            }
        }

        // will add to the object only interesting values...
        // not sure if timestamp is better of received_timestamp for ordering,
        // but jid + timestamp could be an useful id...
        this.jid = waMessage.key_remote_jid;
        this.timestamp = waMessage.timestamp;
        this.receivedTimestamp = waMessage.received_timestamp;

        this.fromMe = waMessage.key_from_me;
        this.type = getType();

        switch (this.type) {
            case TEXT:
                this.text = waMessage.data;
                break;

            case IMAGE:
            case VIDEO:
                getPreview();
                if (waMessage.media_caption) {
                    this.caption = waMessage.media_caption;
                }
                getFileData();
                break;

            case AUDIO:
                getFileData();
                break;

            case VCARD:
                getPreview();
                this.vcard = waMessage.data;
                break;

            case GPS:
                getPreview();
                this.longitude = waMessage.longitude;
                this.latitude = waMessage.latitude;
                break;

            case SYSTEM:
                switch (this.action) {
                    case ACTION_CREATE:
                        assert.ok(waMessage.data, 'SYSTEM_create: no title [id:' + waMessage._id + ']');
                        assert.ok(waMessage.remote_resource, 'SYSTEM_create: no remote user [id:' + waMessage._id + ']');
                        break;

                    case ACTION_JOIN:
                        if (waMessage.data) {
                            assert.fail(waMessage.data, '', 'SYSTEM_JOIN: data present [id:' + waMessage._id + ']');
                        }
                        assert.ok(waMessage.remote_resource, 'SYSTEM_join: no remote user [id:' + waMessage._id + ']');
                        break;

                    case ACTION_EDIT_SUBJECT:
                        assert.ok(waMessage.data, 'SYSTEM_edit_subject: no title [id:' + waMessage._id + ']');
                        assert.ok(waMessage.remote_resource, 'SYSTEM_edit_subject: no remote user [id:' + waMessage._id + ']');
                        break;

                    case ACTION_QUIT:
                        assert.ok(waMessage.remote_resource, 'SYSTEM_quit: no remote user [id:' + waMessage._id + ']');
                        break;

                    case ACTION_EDIT_ICON:
                        assert.ok(/\d+/.test(waMessage.data), 'SYSTEM_edit_icon: no timestamp in data [id:' + waMessage._id + ']');
                        break;

                    case ACTION_INVITE:
                    case ACTION_ADMIN:
                    case ACTION_KICK:
                        assert.ok(waMessage.thumb_image, 'SYSTEM_create: no BLOB [id:' + waMessage._id + ']');
                        assert.ok(waMessage.remote_resource, 'SYSTEM_quit: no remote user');
                        break;
                }
                break;
        }
    }
};

module.exports = message;
