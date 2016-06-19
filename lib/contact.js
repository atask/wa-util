// should be called with each result from
// 'select * from wa_contacts where is_whatsapp_user=1'

// notes:
// contact can be an actual contact or a chat, depending if the jid has a
// hiphen...

const path = require('path')

// default folder name for storing profile pics
const PROFILE_PIC_FOLDER = 'Profile Picures'
const PROFILE_PIC_EXT = '.jpg'

function parse (waContact) {
  let parsedContact = {}

  function getThumbPath () {
    const jidAtPosition = waContact.jid.indexOf('@')
    const jidLocalPart = waContact.jid.substring(0, jidAtPosition)
    parsedContact.thumb = path.join(PROFILE_PIC_FOLDER, jidLocalPart + PROFILE_PIC_EXT)
  }

  parsedContact.jid = waContact.jid
  parsedContact.status = waContact.status
  parsedContact.displayName = waContact.display_name
  parsedContact.waName = waContact.wa_name
  parsedContact.thumb = getThumbPath()

  return parsedContact
}

function isGroup (waContact) {
  return waContact.jid.includes('-')
}

module.exports = {
  parse,
  isGroup
}
