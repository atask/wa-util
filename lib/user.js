// should be called with each result from
// 'select * from wa_contacts where is_whatsapp_user=1 and jid NOT LIKE '%-%''

const path = require('path')

// default folder name for storing profile pics
const PROFILE_PIC_FOLDER = 'Profile Picures'
const PROFILE_PIC_EXT = '.jpg'

function parse (waUser, basePath) {
  let parsedUsed = {}
  function getThumbPath () {
    const jidAtPosition = waUser.jid.indexOf('@')
    const jidLocalPart = waUser.jid.substring(0, jidAtPosition)
    const relativePath = path.join(PROFILE_PIC_FOLDER, jidLocalPart + PROFILE_PIC_EXT)
    parsedUsed.thumb = basePath ? path.join(basePath, relativePath) : relativePath
  }

  parsedUsed.jid = waUser.jid
  parsedUsed.status = waUser.status
  parsedUsed.displayName = waUser.display_name
  parsedUsed.waName = waUser.wa_name
  parsedUsed.thumb = getThumbPath()

  return parsedUsed
}

module.exports = { parse }
