'use strict'

const toShort = require('emojione').toShort
// should be called with each result from
// 'select * from wa_contacts where is_whatsapp_user=1'

// notes:
// contact can be an actual contact or a chat, depending if the jid has a
// hiphen...

function parse (waContact) {
  let jid = waContact.jid
  let waName
  let displayName = waContact.display_name
    ? toShort(waContact.display_name)
    : null
  let status

  if (!isGroup(waContact)) {
    status = waContact.status ? toShort(waContact.status) : null
    waName = waContact.wa_name ? toShort(waContact.wa_name) : null
  }

  return {
    jid,
    waName,
    displayName,
    status
  }
}

function isGroup (waContact) {
  return waContact.jid.includes('-')
}

module.exports = {
  parse,
  isGroup
}
