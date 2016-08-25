'use strict'

const path = require('path')

const sqlite3 = require('sqlite3')
const moment = require('moment')
const oneLine = require('common-tags').oneLine

const todayIsoString = moment().format('YMMDD')
const defaultDbDir = path.join(process.cwd(), 'in')
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

function getWaContacts (waDb) {
  return new Promise((resolve, reject) => {
    waDb.all(contactsQuery, (err, rows) => {
      err ? reject(err) : resolve(rows)
    })
  })
}

function getWaParticipants (msgstoreDb) {
  return new Promise((resolve, reject) => {
    msgstoreDb.all(participantsQuery, (err, rows) => {
      err ? reject(err) : resolve(rows)
    })
  })
}

function getWaMessagesFactory (targetDayISOString) {
  let targetDay = moment(targetDayISOString, 'YYYY-MM-DD')
  let $start = targetDay.startOf('day').valueOf()
  let $end = targetDay.endOf('day').valueOf()
  return msgstoreDb => {
    return new Promise((resolve, reject) => {
      msgstoreDb.all(msqQuery, { $start, $end }, (err, rows) => {
        err ? reject(err) : resolve(rows)
      })
    })
  }
}

function waDbLoad ({
  dbDir = defaultDbDir,
  targetDayString = todayIsoString
}) {
  let msgstorePath = path.join(dbDir, 'msgstore.db')
  let waPath = path.join(dbDir, 'wa.db')

  let msgstoreDb = openSqliteDb(msgstorePath)
  let waDb = openSqliteDb(waPath)

  let waContacts = waDb.then(getWaContacts)
  let waParticipants = msgstoreDb.then(getWaParticipants)

  let getWaMessages = getWaMessagesFactory(targetDayString)
  let waMessages = msgstoreDb.then(getWaMessages)

  let closedMsgstoreDb = Promise.all([msgstoreDb, waMessages, waParticipants])
    .then(([msgstoreDb, ...sync]) => closeSqliteDb(msgstoreDb))

  let closedWaDb = Promise.all([waDb, waContacts])
    .then(([waDb, ...sync]) => closeSqliteDb(waDb))

  let dataFetched = Promise.all([
    waContacts,
    waMessages,
    waParticipants,
    closedMsgstoreDb,
    closedWaDb
  ])

  return dataFetched.then(([
    waContacts,
    waMessages,
    waParticipants,
    ...sync
  ]) => ({
    waContacts,
    waMessages,
    waParticipants
  }))
}

module.exports = waDbLoad
