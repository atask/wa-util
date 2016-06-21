const sqlite3 = require('sqlite3')
const moment = require('moment')
const async = require('async')
const waMessage = require('./message')
const waContact = require('./contact')
const waParticipants = require('./participants')

function createSnapshot ({targetDayString, msgstorePath, waPath}, cb) {
  let targetDay = moment(targetDayString, 'YYYY-MM-DD')
  let startLimit = targetDay.startOf('day').valueOf()
  console.log(`startLimit: ${startLimit}`)
  let endLimit = targetDay.endOf('day').valueOf()
  console.log(`endLimit: ${endLimit}`)
  let targetDayISO = targetDay.format('Y-MM-DD')

  let msqQuery = `SELECT * FROM messages WHERE received_timestamp BETWEEN ${startLimit} AND ${endLimit} ORDER BY received_timestamp`
  let contactsQuery = 'SELECT * FROM wa_contacts WHERE is_whatsapp_user=1'
  let participantsQuery = 'SELECT * FROM group_participants'

  let msgstore
  let wastore
  let waMap = {}

  async.autoInject({
    // open message store db connection
    openMsgDb: callback => {
      msgstore = new sqlite3.Database(msgstorePath, sqlite3.OPEN_READONLY, (err) => {
        if (err) callback(err)
        callback(null)
      })
    },
    // open wa db connection
    openWaDb: callback => {
      wastore = new sqlite3.Database(waPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) callback(err)
        callback(null)
      })
    },
    // get wa_contacts
    getWaContacts: (openWaDb, callback) => {
      wastore.all(contactsQuery, (err, rows) => {
        if (err) return callback(err)
        callback(null, rows)
      })
    },
    // get participants
    getParticipants: (openMsgDb, callback) => {
      msgstore.all(participantsQuery, (err, rows) => {
        if (err) return callback(err)
        let participants = waParticipants.parse(rows)
        callback(null, participants)
      })
    },
    // get messages
    getMessages: (openMsgDb, callback) => {
      msgstore.all(msqQuery, (err, rows) => {
        if (err) return callback(err)
        let messages = rows.map(waMessage.parse)
        callback(null, messages)
      })
    },
    // get contacts
    getContacts: (getWaContacts, getParticipants, callback) => {
      let participants = getParticipants
      let contacts = getWaContacts.map(waContact.parse)
      contacts.forEach(contact => waParticipants.addParticipants(contact, participants))
      let contactMap = {}
      // create a contacts map
      contacts.forEach(contact => { contactMap[contact.jid] = contact })
      callback(null, contactMap)
    },
    // create snapshot (contacts and messages in a specific day)
    createSnapshot: (getMessages, getContacts, callback) => {
      let messages = getMessages
      let contactMap = getContacts
      let selectedContacts = {}
      // select only used contacts
      messages.forEach(message => {
        // actual contact that sent the message
        let fromContact = message.fromJid
          ? contactMap[message.fromJid]
          : null
        // group contact the message is stored into
        let groupContact = message.groupJid
          ? contactMap[message.groupJid]
          : null
        if (fromContact === null && groupContact === null) {
          return callback(`Message [${message.receivedTimestamp}] has no valid contact!`)
        }
        // add contact info if needed
        if (fromContact && !(fromContact.jid in selectedContacts)) {
          selectedContacts[fromContact.jid] = fromContact
        }
        // add group info if needed
        if (groupContact && !(groupContact.jid in selectedContacts)) {
          selectedContacts[groupContact.jid] = groupContact
          console.log('groupContact: ' + JSON.stringify(groupContact))
          // add all participants to the contacts
          if (groupContact.participants) {
            groupContact.participants.forEach(participant => {
              if (!(participant in selectedContacts)) {
                selectedContacts[participant] = contactMap[participant]
              }
            })
          }
        }
      })
      // flatten selectedContacts map
      let selectedContactsArray = []
      Object.keys(selectedContacts).forEach(contact => {
        selectedContactsArray.push(selectedContacts[contact])
      })
      // debug
      console.log(`Parsed ${messages.length} messages on ${targetDayISO}:`)
      messages.forEach(message => {
        let previewText = message.type === waMessage.TEXT
          ? message.text.substring(0, 20)
          : ''
        console.log(`\t[${message.receivedTimestamp} - ${message.type}] ${previewText}`)
      })
      console.log(`Parsed ${selectedContactsArray.length} contacts:`)
      selectedContactsArray.forEach(contact => {
        console.log(`\t[${contact.jid}] ${contact.displayName || contact.waName}`)
      })
      waMap[targetDayISO] = {
        messages: getMessages,
        contacts: selectedContactsArray,
        reference: msgstorePath
      }
      callback(null)
    },
    // close message store db connection
    closeMsgDb: (getMessages, callback) => {
      msgstore.close((err) => {
        if (err) callback(err)
        callback(null)
      })
    },
    // close wa db connection
    closeWaDb: (getContacts, callback) => {
      wastore.close((err) => {
        if (err) callback(err)
        callback(null)
      })
    }
  }, cb)
}

module.exports = { createSnapshot }
