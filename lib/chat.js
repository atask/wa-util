// should be called with each result from 'select * from chat_list'
function parse (waChat) {
  let parsedChat = {}

  parsedChat.jid = waChat.key_remote_jid
  parsedChat.isGroup = waChat.key_remote_jid.indexOf('-') !== -1
  if (parsedChat.isGroup) {
    parsedChat.subject = waChat.subject
  }

  return parsedChat
}

module.exports = { parse }
