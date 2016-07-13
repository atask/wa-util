'use strict'

const fs = require('fs')
const shelljs = require('shelljs')
const path = require('path')
const sqlite3 = require('sqlite3')
const moment = require('moment')
const waMessage = require('./message')
const waContact = require('./contact')
const oneLine = require('common-tags').oneLine

const todayISO = moment().format('YMMDD')
const defaultDbDir = path.join(process.cwd(), 'in')
const defaultMediaDir = path.join(defaultDbDir, 'Media')
const defaultDestDir = path.join(process.cwd(), 'out')

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

function getActiveContactJids (contacts) {
  return contacts
    .filter(contact => contact.messages && contact.participants)
    .map(contact => contact.participants)
    .reduce((participantsIndex, participants) => {
      let diff = participants
        .filter(paticipant => !participantsIndex.includes(paticipant))
      return participantsIndex.concat(diff)
    }, [])
}

function pruneStaleContacts (contacts) {
  let activeContacts = getActiveContactJids(contacts)
  return contacts
    .filter(contact => {
      return contact.messages || activeContacts.includes(contact.jid)
    })
}

function latestMessageCompare (firstContact, secondContact) {
  let fc = firstContact
  let sc = secondContact
  let fcLength = fc.messages ? fc.messages.length : null
  let scLength = sc.messages ? sc.messages.length : null
  let fcLatest = fcLength ? fc.messages[fcLength - 1].timestamp : -1
  let scLatest = scLength ? sc.messages[scLength - 1].timestamp : -1
  // intentionally inverted order
  return scLatest - fcLatest
}

function parseWaDb ({
  targetDayString = todayISO,
  msgstorePath = 'msgstore.db',
  waPath = 'wa.db'
}) {
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
      contacts = pruneStaleContacts(contacts).sort(latestMessageCompare)
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

function getMedia ({
  targetDayString = todayISO,
  msgstorePath = 'msgstore.db',
  waPath = 'wa.db'
}) {
  let media = parseWaDb({targetDayString, msgstorePath, waPath})
    .then(parsedWaDb => {
      return parsedWaDb
        .filter(message => 'path' in message)
        .map(message => message.path)
    })

  return media
}

function createSnapshot ({
  targetDayString = todayISO,
  dbDir = defaultDbDir,
  mediaDir = defaultMediaDir,
  destDir = defaultDestDir
}) {
  let snapshotDir = path.join(destDir, `snapshot-${targetDayString}`)
  let snapshotPath = path.join(snapshotDir, `snapshot-${targetDayString}.json`)
  let msgstorePath = path.join(dbDir, 'msgstore.db')
  let waPath = path.join(dbDir, 'wa.db')

  shelljs.mkdir('-p', snapshotDir)

  let snapshot = parseWaDb({targetDayString, msgstorePath, waPath})
  let savedSnapshot = snapshot.then(snapshot => {
    let formattedJSON = JSON.stringify(snapshot, null, 2)
    fs.writeFileSync(snapshotPath, formattedJSON)
  })

  let copiedMedia = snapshot
    .then(getMedia)
    .then(mediaList => {
      mediaList.forEach(media => {
        let src = path.join(mediaDir, media)
        let dest = path.join(snapshotDir, media)
        shelljs.cp(src, dest)
      })
    })

  return Promise.all([savedSnapshot, copiedMedia])
}

module.exports = {
  createSnapshot,
  parseWaDb,
  getMedia
}
