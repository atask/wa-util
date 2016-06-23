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
    contact.participants = participants
      .filter(participant => participant.gjid === contact.jid)
  }
}

function addMessagesFactory (messages) {
  return contact => {
    contact.messages = messages
      .filter(message => message.groupJid === contact.jid)
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
    .then(([msgstoreDb, ...other]) => closeSqliteDb(msgstoreDb))

  let closedWaDb = Promise.all([waDb, contacts])
    .then(([waDb, ...other]) => closeSqliteDb(waDb))

  let snapshotRequirements = [
    contacts,
    participants,
    messages,
    closedMsgstoreDb,
    closedWaDb
  ]
  let snapshot = Promise.all(snapshotRequirements)
    .then(([contacts, participants, messages, ...other]) => {
      let addParticipants = addParticipantsFactory(participants)
      let addMessages = addMessagesFactory(messages)
      contacts.forEach(addParticipants)
      contacts.forEach(addMessages)
      contacts = contacts.filter(contact => contact.messages.length > 0)
      let snap = {}
      snap[targetDayString] = contacts
      return snap
    })

  return snapshot
}

module.exports = { createSnapshot }
