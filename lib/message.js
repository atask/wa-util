// magic numbers for message's thumb_image parse
// in order to obtain the path for a media file
var MEDIA_PATH_LENGTH = 281,
    MEDIA_PATH_START = 282;

// media folder path
var MEDIA_PATH_TOKEN = 'WhatsApp/Media';

var message = {
    parse: function(waMessage) {
        // will add to the object only interesting values...
        // not sure if timestamp is better of received_timestamp for ordering,
        // but jid + timestamp could be an useful id...
        this.jid = waMessage.key_remote_jid;
        this.timestamp = waMessage.timestamp;

        this.fromMe = waMessage.key_from_me;
        this.type = 'text';
        // test if message is an image
        if (waMessage.media_mime_type === 'image/jpeg') {
            this.type = 'image';

            // thumb_image contains preview meta, but right now i'm just
            // interested in the media path: looks like it's stored
            // at a fixed offset
            // extract media path
            var length = waMessage.thumb_image[MEDIA_PATH_LENGTH],
                end = MEDIA_PATH_START + length,
                path = waMessage.thumb_image.toString('ascii', MEDIA_PATH_START, end),
                pathTokenPosition = path.indexOf(MEDIA_PATH_TOKEN);
            // TODO: assert some stuff on path/pathTokenPosition ?
            this.path = path.substring(pathTokenPosition);

            // raw_data holds the actual preview (jfif format, works
            // as a regular jpeg)
            this.preview = waMessage.raw_data;

            // media_size just for checking?
            this.size = waMessage.media_size;
        }
        
        // preview, path and size are also ok for video/mp4 and audio/aac
        // (preview not for aac files)
};

module.exports = message;
