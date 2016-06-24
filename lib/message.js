'use strict'

const assert = require('assert')
const debug = require('debug')('message')
const toShort = require('emojione').toShort

// magic numbers for message's thumb_image parse
// in order to obtain the path for a media file
const MEDIA_PATH_OFFSETS = [ 281, 469 ]
const MEDIA_PATH_TEST = /\/WhatsApp/

// message status value for system messages
const SYSTEM_STATUS = 6

// message types
const TEXT = 'text'
const IMAGE = 'image'
const AUDIO = 'audio'
const VIDEO = 'video'
const VCARD = 'vcard'
const GPS = 'gps'
const SYSTEM = 'system'

// available system actions
const ACTION_CREATE = 'action_create'
const ACTION_JOIN = 'action_join'
const ACTION_EDIT_SUBJECT = 'action_edit_subject'
const ACTION_QUIT = 'action_quit'
const ACTION_EDIT_ICON = 'action_edit_icon'
const ACTION_INVITE = 'action_invite'
const ACTION_ADMIN = 'action_admin'
const ACTION_KICK = 'action_kick'

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

const TYPES_INDEX = [TEXT, IMAGE, AUDIO, VIDEO, VCARD, GPS]
const ACTION_INDEX = {
  11: ACTION_CREATE,
  4: ACTION_JOIN,
  1: ACTION_EDIT_SUBJECT,
  5: ACTION_QUIT,
  6: ACTION_EDIT_ICON,
  12: ACTION_INVITE,
  15: ACTION_ADMIN,
  14: ACTION_KICK
}

function parse (waMessage) {
  let parsedMessage = {}

  function getPreview () {
    if (waMessage.raw_data) {
      parsedMessage.preview = waMessage.raw_data.toString('base64')
    }
  }

  /*
  thumb_image contains preview meta, but right now i'm just
  interested in the media path: looks like it's stored
  at a fixed offset.
  Note: different versions will use different magic numbers, thus the arrays
  */
  function getFileData () {
    // not always MIME type is available (eg. messages from me)
    if (waMessage.media_mime_type) {
      parsedMessage.mime = waMessage.media_mime_type
    }
    MEDIA_PATH_OFFSETS.forEach(offset => {
      if (waMessage.thumb_image.length <= offset) { return }
      let pathLength = waMessage.thumb_image[offset]
      let start = offset + 1
      let end = start + pathLength
      let path = waMessage.thumb_image.toString('ascii', start, end)
      if (MEDIA_PATH_TEST.test(path)) {
        parsedMessage.path = path
      }
    })
    if (!('path' in parsedMessage)) {
      debug(`Unavailable media object on msg[${waMessage.received_timestamp}]`)
    }
    parsedMessage.size = waMessage.media_size
  }

  function getType () {
    parsedMessage.type = TYPES_INDEX[waMessage.media_wa_type]
    if (parsedMessage.type === TEXT && waMessage.status === SYSTEM_STATUS) {
      parsedMessage.type = SYSTEM
      parsedMessage.action = ACTION_INDEX[waMessage.media_size]
    }
  }

  function isFromGroup () {
    return waMessage.key_remote_jid.includes('-')
  }

  // will add to the object only interesting values...
  // not sure if timestamp is better of received_timestamp for ordering,
  // but jid + timestamp could be an useful id...
  parsedMessage.timestamp = waMessage.timestamp
  parsedMessage.receivedTimestamp = waMessage.received_timestamp
  parsedMessage.fromMe = waMessage.key_from_me === 1

  // if message in a group chat sender will be in the remote_resource field,
  // otherwise it will be in the key_remote_jid itself
  if (!parsedMessage.fromMe) {
    parsedMessage.fromJid = isFromGroup()
      ? waMessage.remote_resource
      : waMessage.key_remote_jid
  }
  parsedMessage.groupJid = waMessage.key_remote_jid

  getType()

  switch (parsedMessage.type) {
    case TEXT:
      parsedMessage.text = toShort(waMessage.data)
      break

    case IMAGE:
    case VIDEO:
      getPreview()
      if (waMessage.media_caption) {
        parsedMessage.caption = toShort(waMessage.media_caption)
      }
      getFileData()
      break

    case AUDIO:
      getFileData()
      break

    case VCARD:
      getPreview()
      parsedMessage.vcard = waMessage.data
      break

    case GPS:
      getPreview()
      parsedMessage.longitude = waMessage.longitude
      parsedMessage.latitude = waMessage.latitude
      break

    case SYSTEM:
      switch (parsedMessage.action) {
        case ACTION_CREATE:
          assert.ok(waMessage.data, 'SYSTEM_create: no title [id:' + waMessage._id + ']')
          assert.ok(waMessage.remote_resource, 'SYSTEM_create: no remote user [id:' + waMessage._id + ']')
          break

        case ACTION_JOIN:
          if (waMessage.data) {
            assert.fail(waMessage.data, '', 'SYSTEM_JOIN: data present [id:' + waMessage._id + ']')
          }
          assert.ok(waMessage.remote_resource, 'SYSTEM_join: no remote user [id:' + waMessage._id + ']')
          break

        case ACTION_EDIT_SUBJECT:
          assert.ok(waMessage.data, 'SYSTEM_edit_subject: no title [id:' + waMessage._id + ']')
          assert.ok(waMessage.remote_resource, 'SYSTEM_edit_subject: no remote user [id:' + waMessage._id + ']')
          break

        case ACTION_QUIT:
          assert.ok(waMessage.remote_resource, 'SYSTEM_quit: no remote user [id:' + waMessage._id + ']')
          break

        case ACTION_EDIT_ICON:
          assert.ok(/\d+/.test(waMessage.data), 'SYSTEM_edit_icon: no timestamp in data [id:' + waMessage._id + ']')
          break

        case ACTION_INVITE:
        case ACTION_ADMIN:
        case ACTION_KICK:
          assert.ok(waMessage.thumb_image, 'SYSTEM_create: no BLOB [id:' + waMessage._id + ']')
          // assert.ok(waMessage.remote_resource, 'SYSTEM_quit: no remote user [id:' + waMessage._id + ']')
          break
      }
      break
  }

  return parsedMessage
}

module.exports = {
  parse,
  TEXT,
  IMAGE,
  AUDIO,
  VIDEO,
  VCARD,
  GPS,
  SYSTEM
}
