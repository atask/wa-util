'use strict'

const sqlite3 = require('sqlite3')
const moment = require('moment')
const waMessage = require('./message')
const waContact = require('./contact')
const oneLine = require('common-tags').oneLine

const contactsQuery = 'SELECT * FROM wa_contacts WHERE is_whatsapp_user=1'
const participantsQuery = 'SELECT * FROM group_participants'
const msqQuery = oneLine`SELECT * FROM messages WHERE received_timestamp
BETWEEN $start AND $end ORDER BY received_timestamp`

function openSqliteDb (dbPath) {
  let mode = sqlite3.OPEN_READONLY
  return new Promise((resolve, reject) => {
    let sqliteDb = new sqlite3.Database(dbPath, mode, (err) => {
      err ? reject(err) : resolve(sqliteDb)
    })
  })
}

function closeSqliteDb (sqliteDb) {
  return new Promise((resolve, reject) => {
    sqliteDb.close(err => {
      err ? reject(err) : resolve()
    })
  })
}

function getContacts (waDb) {
  return new Promise((resolve, reject) => {
    waDb.all(contactsQuery, (err, rows) => {
      err ? reject(err) : resolve(rows.map(waContact.parse))
    })
  })
}

function getParticipants (msgstoreDb) {
  return new Promise((resolve, reject) => {
    msgstoreDb.all(participantsQuery, (err, rows) => {
      err ? reject(err) : resolve(rows)
    })
  })
}

function getMessagesFactory (targetDayISOString) {
  let targetDay = moment(targetDayISOString, 'YYYY-MM-DD')
  let $start = targetDay.startOf('day').valueOf()
  let $end = targetDay.endOf('day').valueOf()
  return msgstoreDb => {
    return new Promise((resolve, reject) => {
      msgstoreDb.all(msqQuery, { $start, $end }, (err, rows) => {
        err ? reject(err) : resolve(rows.map(waMessage.parse))
      })
    })
  }
}

function addParticipantsFactory (participants) {
  return contact => {
    let parsedParticipants = participants
      .filter(participant => participant.gjid === contact.jid)
      .map(participant => participant.jid)
      .filter(participant => participant !== '')
    if (parsedParticipants.length) {
      contact.participants = parsedParticipants
    }
  }
}

function addMessagesFactory (messages) {
  return contact => {
    let parsedMessages = messages
      .filter(message => message.groupJid === contact.jid)
      .sort((firstMessage, secondMessage) => {
        return firstMessage.timestamp - secondMessage.timestamp
      })
    if (parsedMessages.length) {
      contact.messages = parsedMessages
    }
  }
}

function createSnapshot ({targetDayString, msgstorePath, waPath}) {
  let msgstoreDb = openSqliteDb(msgstorePath)
  let waDb = openSqliteDb(waPath)

  let contacts = waDb.then(getContacts)
  let participants = msgstoreDb.then(getParticipants)

  let getMessages = getMessagesFactory(targetDayString)
  let messages = msgstoreDb.then(getMessages)

  let closedMsgstoreDb = Promise.all([msgstoreDb, participants, messages])
    .then(([msgstoreDb, ...sync]) => closeSqliteDb(msgstoreDb))

  let closedWaDb = Promise.all([waDb, contacts])
    .then(([waDb, ...sync]) => closeSqliteDb(waDb))

  let snapshotRequirements = [
    contacts,
    participants,
    messages,
    closedMsgstoreDb,
    closedWaDb
  ]
  let snapshot = Promise.all(snapshotRequirements)
    .then(([contacts, participants, messages, ...sync]) => {
      let addParticipants = addParticipantsFactory(participants)
      let addMessages = addMessagesFactory(messages)
      contacts.forEach(addParticipants)
      contacts.forEach(addMessages)
      let activeContacts = contacts
        .filter(contact => contact.messages && contact.participants)
        .map(contact => contact.participants)
        .reduce((participantsIndex, participants) => {
          let diff = participants
            .filter(paticipant => !participantsIndex.includes(paticipant))
          return participantsIndex.concat(diff)
        }, [])
      contacts = contacts
        .filter(contact => {
          return contact.messages || activeContacts.includes(contact.jid)
        })
        .sort((firstContact, secondContact) => {
          let fc = firstContact
          let sc = secondContact
          let fcLength = fc.messages ? fc.messages.length : null
          let scLength = sc.messages ? sc.messages.length : null
          let fcLatest = fcLength ? fc.messages[fcLength - 1].timestamp : -1
          let scLatest = scLength ? sc.messages[scLength - 1].timestamp : -1
          // intentionally inverted order
          return scLatest - fcLatest
        })
      return {
        [targetDayString]: {
          contacts: contacts,
          msgstore: msgstorePath,
          wa: waPath
        }
      }
    })

  return snapshot
}

module.exports = { createSnapshot }
