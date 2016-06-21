// should be called with each result from
// 'select * from wa_contacts where is_whatsapp_user=1'

// notes:
// contact can be an actual contact or a chat, depending if the jid has a
// hiphen...

function parse (waContact) {
  let parsedContact = {}

  parsedContact.jid = waContact.jid
  parsedContact.displayName = waContact.display_name

  if (!isGroup(waContact)) {
    parsedContact.status = waContact.status
    parsedContact.waName = waContact.wa_name
  }

  return parsedContact
}

function isGroup (waContact) {
  return waContact.jid.includes('-')
}

module.exports = {
  parse,
  isGroup
}
