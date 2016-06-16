// should be called with each result from
// 'select * from wa_contacts where is_whatsapp_user=1 and jid NOT LIKE '%-%''

const path = require('path')

// default folder name for storing profile pics
const PROFILE_PIC_FOLDER = 'Profile Picures'
const PROFILE_PIC_EXT = '.jpg'

function parse (waContact, basePath) {
  let parsedContact = {}

  function getThumbPath () {
    const jidAtPosition = waContact.jid.indexOf('@')
    const jidLocalPart = waContact.jid.substring(0, jidAtPosition)
    const relativePath = path.join(PROFILE_PIC_FOLDER, jidLocalPart + PROFILE_PIC_EXT)
    parsedContact.thumb = basePath ? path.join(basePath, relativePath) : relativePath
  }

  parsedContact.jid = waContact.jid
  parsedContact.status = waContact.status
  parsedContact.displayName = waContact.display_name
  parsedContact.waName = waContact.wa_name
  parsedContact.thumb = getThumbPath()

  return parsedContact
}

module.exports = { parse }
