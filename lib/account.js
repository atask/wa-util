'use strict'

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const async = require('async')
// const debug = require('debug')('account')

const format = require('string-template')

const contact = require('./contact')
const message = require('./message')

// default names for wa.db and msgstore.db
const WA_FILE = 'wa.db'
const MSGSTORE_FILE = 'msgstore.db'

// we only care for actual users, not groups: filter out all contacts with '-' inside.
const QUERY_GET_USERS = 'SELECT * FROM wa_contacts WHERE is_whatsapp_user=1 AND jid NOT LIKE "%-%"'
const QUERY_GET_CHATS = 'SELECT * FROM chat_list'

const QUERY_GET_MSGS = 'SELECT * FROM messages ORDER BY received_timestamp ASC'
const QUERY_GET_MSGS_START = 'SELECT * FROM messages ' +
  'WHERE received_timestamp >= {startDate} ' +
  'ORDER BY received_timestamp ASC'
const QUERY_GET_MSGS_END = 'SELECT * FROM messages ' +
  'WHERE received_timestamp <= {endDate} ' +
  'ORDER BY received_timestamp ASC'
const QUERY_GET_MSGS_RANGE = 'SELECT * FROM messages ' +
  'WHERE received_timestamp >= {startDate} AND received_timestamp <= {endDate} ' +
  'ORDER BY received_timestamp ASC'

function load (baseDir, callback, options) {
  let self = this
  let waPath = path.join(baseDir, WA_FILE)
  let msgstorePath = path.join(baseDir, MSGSTORE_FILE)
  let wa = new sqlite3.Database(waPath)
  let msgstore = new sqlite3.Database(msgstorePath)
  let opt = options || {}

  // use console to log if no logger provided
  if (!opt.logger) {
    opt.logger = console
  }

  async.series([
    function fetchUsers (asyncCallback) {
      // get users
      self.users = []
      wa.each(QUERY_GET_USERS, function parseUser (waErr, waUser) {
        if (waErr) {
          asyncCallback(waErr)
        }
        let userElem = Object.create(user)
        userElem.parse(waUser)
        self.users.push(userElem)
      }, asyncCallback)
    },

    function fetchMessages (asyncCallback) {
      // get messages
      self.messages = []

      // select the message query depending on the date options provided
      let msgQuery = QUERY_GET_MSGS
      if (opt.startDate && !opt.endDate) {
        msgQuery = format(QUERY_GET_MSGS_START, {
          startDate: opt.startDate
        })
      }
      if (opt.endDate && !opt.startDate) {
        msgQuery = format(QUERY_GET_MSGS_END, {
          endDate: opt.endDate
        })
      }
      if (opt.endDate && opt.startDate) {
        msgQuery = format(QUERY_GET_MSGS_RANGE, {
          endDate: opt.endDate,
          startDate: opt.startDate
        })
      }

      msgstore.each(msgQuery, function parseMessage (msgstoreErr, waMessage) {
        if (msgstoreErr) {
          asyncCallback(msgstoreErr)
        }
        let messageElem = Object.create(message)
        messageElem.parse(waMessage)
        self.messages.push(messageElem)
      }, asyncCallback)
    }],

    // all done!
    callback
  )
}

function getMediaFilesList () {
  let mediaFilesList = []
  this.messages.forEach(function checkIfMediaFile (msg) {
    let type = msg.type
    if (type === message.IMAGE || type === message.VIDEO || type === message.AUDIO) {
      mediaFilesList.push(msg.path)
    }
  })
  return mediaFilesList
}

module.exports = {
  load,
  getMediaFilesList
}
