// magic numbers for message's thumb_image parse
// in order to obtain the path for a media file
var MEDIA_PATH_LENGTH = 281,
    MEDIA_PATH_START = 282;

// media folder path
var MEDIA_PATH_TOKEN = 'WhatsApp/Media';

// message types
var TEXT = 'text',
    IMAGE = 'image',
    AUDIO = 'audio',
    VIDEO = 'video,
    VCARD = 'vcard',
    GPS = 'gps',
    TYPES_INDEX = [TEXT, IMAGE, AUDIO, VIDEO, VCARD, GPS];

function parseType(mediaWaType) {
    return TYPES_INDEX[mediaWaType);
}

function hasFile(messageType) {
    return messageType === IMAGE || messageType === AUDIO || messageType === VIDEO;
}

// thumb_image contains preview meta, but right now i'm just
// interested in the media path: looks like it's stored
// at a fixed offset
// extract media path
function getFile(thumbImage) {
    var length = thumbImage[MEDIA_PATH_LENGTH],
        end = MEDIA_PATH_START + length,
        path = thumbImage.toString('ascii', MEDIA_PATH_START, end),
        pathTokenPosition = path.indexOf(MEDIA_PATH_TOKEN);
    // TODO: assert some stuff on path/pathTokenPosition ?
    this.path = path.substring(pathTokenPosition);
}

function hasPreview(rawData) {
     return rawData;
}

var message = {
    parse: function(waMessage) {
        // will add to the object only interesting values...
        // not sure if timestamp is better of received_timestamp for ordering,
        // but jid + timestamp could be an useful id...
        this.jid = waMessage.key_remote_jid;
        this.timestamp = waMessage.timestamp;

        this.fromMe = waMessage.key_from_me;
        this.type = parseType(waMessage.media_wa_type);

        if (hasFile(this.type)) {
            this.path = getFile(waMessage.thumb_image);
            this.size = waMessage.media_size;
            this.mime = waMessage.media_mime_type;
        }

        if (hasPreview(waMessage.raw_data)) {
            this.preview = waMessage.raw_data;
        }

        switch(this.type) {
            case TEXT:
                this.text = waMessage.data;
                break;

            case IMAGE:
            case VIDEO:
                if (waMessage.media_caption) {
                    this.caption = waMessage.media_caption;
                }
                break;

            case VCARD:
                this.vcard = waMessage.data;
                break;

            case GPS:
                this.longitude = waMessage.longitude;
                this.latitude = waMessage.latitude;
                break;
        }
    }
};

module.exports = message;
