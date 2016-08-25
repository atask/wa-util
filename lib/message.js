'use strict'

const assert = require('assert')
const debug = require('debug')('message')
const parseEmoji = require('emojione').toShort

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

function extractPreview (fromWaMessage, toParsedMessage) {
  if (fromWaMessage.raw_data) {
    toParsedMessage.preview = fromWaMessage.raw_data.toString('base64')
  }
}

/*
thumb_image contains preview meta, but right now i'm just
interested in the media path: looks like it's stored
at a fixed offset.
Note: different versions will use different magic numbers, thus the array
of path offsets
*/
function extractMediaData (fromWaMessage, toParsedMessage) {
  // not always MIME type is available (eg. messages from me)
  if (fromWaMessage.media_mime_type) {
    toParsedMessage.mime = fromWaMessage.media_mime_type
  }
  let thumbImage = fromWaMessage.thumb_image
  MEDIA_PATH_OFFSETS.forEach(offset => {
    if (thumbImage.length <= offset) { return }
    let pathLength = thumbImage[offset]
    let start = offset + 1
    let end = start + pathLength
    let path = thumbImage.toString('ascii', start, end)
    if (MEDIA_PATH_TEST.test(path)) {
      toParsedMessage.path = path
    }
  })
  if (!('path' in toParsedMessage)) {
    debug(`Unavailable media object on msg[${fromWaMessage.received_timestamp}]`)
  }
  toParsedMessage.size = fromWaMessage.media_size
}

function extractType (fromWaMessage, toParsedMessage) {
  let type = toParsedMessage.type = TYPES_INDEX[fromWaMessage.media_wa_type]
  let isSystemStatus = fromWaMessage.status === SYSTEM_STATUS
  if (type === TEXT && isSystemStatus) {
    toParsedMessage.type = SYSTEM
    toParsedMessage.action = ACTION_INDEX[fromWaMessage.media_size]
  }
}

function isFromGroup (fromWaMessage) {
  return fromWaMessage.key_remote_jid.includes('-')
}

function parse (waMessage) {
  let parsedMessage = {}

  // will add to the object only interesting values...
  // not sure if timestamp is better of received_timestamp for ordering,
  // but jid + timestamp could be an useful id...
  parsedMessage.timestamp = waMessage.timestamp
  parsedMessage.receivedTimestamp = waMessage.received_timestamp
  parsedMessage.fromMe = waMessage.key_from_me === 1

  // if message in a group chat sender will be in the remote_resource field,
  // otherwise it will be in the key_remote_jid itself
  if (!parsedMessage.fromMe) {
    parsedMessage.fromJid = isFromGroup(waMessage)
      ? waMessage.remote_resource
      : waMessage.key_remote_jid
  }
  parsedMessage.groupJid = waMessage.key_remote_jid

  extractType(waMessage, parsedMessage)

  switch (parsedMessage.type) {
    case TEXT:
      parsedMessage.text = parseEmoji(waMessage.data)
      break

    case IMAGE:
    case VIDEO:
      extractPreview(waMessage, parsedMessage)
      if (waMessage.media_caption) {
        parsedMessage.caption = parseEmoji(waMessage.media_caption)
      }
      extractMediaData(waMessage, parsedMessage)
      break

    case AUDIO:
      extractMediaData(waMessage, parsedMessage)
      break

    case VCARD:
      extractPreview(waMessage, parsedMessage)
      parsedMessage.vcard = waMessage.data
      break

    case GPS:
      extractPreview(waMessage, parsedMessage)
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
