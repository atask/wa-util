#!/usr/bin/env node
'use strict'

const waUtil = require('../lib/wa-util')
const waDbLoadDir = require('../lib/wa-db-load').waDbLoadDir
const argv = require('minimist')(process.argv.slice(2))
const stripIndent = require('common-tags').stripIndent

const version = require('../package.json').version

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
const WA_DB_DIR = {
  switch: 'w',
  opt: 'wa',
  description: 'directory path containing msgstore.db and wa.db files'
}

let help = argv[HELP.switch] || argv[HELP.opt]
let targetDayString = argv[TARGET_DATE.switch] || argv[TARGET_DATE.opt]
let dbDir = argv[WA_DB_DIR.switch] || argv[WA_DB_DIR.opt]

function printHelp () {
  console.log(stripIndent`
    A basic CLI utility for dumping daily data from a WhatsApp database.

    Version
      ${version}

    Usage
      wa-dump <options>

    Options
      -${HELP.switch}\t--${HELP.opt}\t\t${HELP.description}
      -${TARGET_DATE.switch}\t--${TARGET_DATE.opt}\t\t${TARGET_DATE.description}
      -${WA_DB_DIR.switch}\t--${WA_DB_DIR.opt}\t\t${WA_DB_DIR.description}

    Example
      wa-dump -d 2016-01-20 -w in
  `)
}

if (help) {
  printHelp()
} else {
  // create wa data load function
  let waLoad = waDbLoadDir.bind(null, {dbDir, targetDayString})

  waUtil.dumpWaData(waLoad)
    .then(res => {
      console.log(JSON.stringify(res, null, 2))
    })
    .catch(err => {
      console.error(err)
      process.exitCode = 1
    })
}
