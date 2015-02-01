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
            // thumb_image contains preview meta, and the pic path
            // depending on how sqlite extracts it, should be enough
            // just some string manipulation...
            // while raw_data holds the actual preview (jfif format, works
            // as a regular jpeg)
            // media_size just for checking?
            this.path = waMessage.thumb_image;
            this.preview = waMessage.raw_data;
            this.size = waMessage.media_size;
        }
        
        // preview, path and size are also ok for video/mp4 and audio/aac
        // (preview not for aac files)
};

module.exports = message;
