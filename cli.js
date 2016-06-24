#!/usr/bin/env node
'use strict'

const snapshot = require('./lib/snapshot')
const argv = require('minimist')(process.argv.slice(2))
const stripIndent = require('common-tags').stripIndent

const HELP = {
  switch: 'h',
  opt: 'help',
  description: 'this help'
}
const TARGET_DATE = {
  switch: 'd',
  opt: 'day',
  description: 'target date'
}
const WA_DB = {
  switch: 'w',
  opt: 'wa',
  description: 'wa.db path'
}
const MSGSTORE_DB = {
  switch: 'm',
  opt: 'msgstore',
  description: 'msgstore.db path'
}

let help = argv[HELP.switch] || argv[HELP.opt]
let targetDayString = argv[TARGET_DATE.switch] || argv[TARGET_DATE.opt]
let waPath = argv[WA_DB.switch] || argv[WA_DB.opt]
let msgstorePath = argv[MSGSTORE_DB.switch] || argv[MSGSTORE_DB.opt]

if (help || [targetDayString, waPath, msgstorePath].includes(undefined)) {
  console.log(stripIndent`
    A basic CLI util for dumping daily data from a WhatsApp database.

    Usage
      wa-snap <options>

    Options
      -${HELP.switch}\t--${HELP.opt}\t\t${HELP.description}
      -${TARGET_DATE.switch}\t--${TARGET_DATE.opt}\t\t${TARGET_DATE.description}
      -${WA_DB.switch}\t--${WA_DB.opt}\t\t${WA_DB.description}
      -${MSGSTORE_DB.switch}\t--${MSGSTORE_DB.opt}\t${MSGSTORE_DB.description}

    Example
      wa-snap -d 2016-01-20 -w wa.db -m msgstore.db
  `)
  process.exitCode = 64
} else {
  let options = { targetDayString, waPath, msgstorePath }
  snapshot.createSnapshot(options)
    .then(res => {
      console.log(JSON.stringify(res, null, 2))
    })
    .catch(err => {
      console.log(JSON.stringify(err, null, 2))
      process.exitCode = 1
    })
}
