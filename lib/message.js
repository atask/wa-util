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
    SYSTEM_CREATE = 'system_create',
    SYSTEM_JOIN = 'system_join',
    SYSTEM_EDIT_SUBJECT = 'system_edit_subject',
    SYSTEM_QUIT = 'system_quit',
    SYSTEM_EDIT_ICON = 'system_edit_icon',
    SYSTEM_INVITE = 'system_invite',
    SYSTEM_ADMIN = 'system_admin',
    SYSTEM_KICK = 'system_kick',

/*
media_size field identifies the system message
=11 -> group invite, name in data
=4  -> group join (not sure, but present right in the beginning of the chat)
=1  -> subject edit, new subject in data
=5  -> group leave
=6  -> icon update (data has timestamp?!?)
=12 -> user add: added user in thumb_image blob, inviter in remote_resource
=15 -> user becomes admin: blessed user in blob, admin in remote
=14 -> user kick, victim in blob, kicker in remote
*/

    TYPES_INDEX = [TEXT, IMAGE, AUDIO, VIDEO, VCARD, GPS],
    SYSTEM_INDEX = {
        11: SYSTEM_CREATE,
        4: SYSTEM_JOIN,
        1: SYSTEM_EDIT_SUBJECT,
        5: SYSTEM_QUIT,
        6: SYSTEM_EDIT_ICON,
        12: SYSTEM_INVITE,
        15: SYSTEM_ADMIN,
        14: SYSTEM_KICK
    };


function parseType(waMessage) {
    var type = TYPES_INDEX[waMessage.media_wa_type],
        status = waMessage.status;
    if (type === TEXT && status === SYSTEM_STATUS) {
        type = SYSTEM_INDEX[waMessage.media_size];
    }
    return type;
}

/*
thumb_image contains preview meta, but right now i'm just
interested in the media path: looks like it's stored
at a fixed offset.
*/
function getFilePath(thumbImage) {
    var length = thumbImage[MEDIA_PATH_LENGTH],
        end = MEDIA_PATH_START + length,
        path = thumbImage.toString('ascii', MEDIA_PATH_START, end),
        pathTokenPosition = path.indexOf(MEDIA_PATH_TOKEN);
    // TODO: assert some stuff on path/pathTokenPosition ?
    this.path = path.substring(pathTokenPosition);
}

var message = {
    parse: function(waMessage) {
        var self = this,
            getFileData, getPreview;

        getFileData = function() {
            self.path = getFilePath(waMessage.thumb_image);
            self.size = waMessage.media_size;
            self.mime = waMessage.media_mime_type;
        };

        getPreview = function() {
            if(waMessage.raw_data) {
                self.preview = waMessage.raw_data;
            }
        };

        // will add to the object only interesting values...
        // not sure if timestamp is better of received_timestamp for ordering,
        // but jid + timestamp could be an useful id...
        this.jid = waMessage.key_remote_jid;
        this.timestamp = waMessage.timestamp;
        this.receivedTimestamp = waMessage.received_timestamp;

        this.fromMe = waMessage.key_from_me;
        this.type = parseType(waMessage);

        switch(this.type) {
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
                this.vcard = waMessage.data;
                break;

            case GPS:
                getPreview();
                this.longitude = waMessage.longitude;
                this.latitude = waMessage.latitude;
                break;
        }
    }
};

module.exports = message;
