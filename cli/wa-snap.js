#!/usr/bin/env node
'use strict'

const waUtil = require('../lib/wa-util')
const waDbLoad = require('../lib/wa-db-load')
const snapFsSave = require('../lib/snap-fs-save')
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
  description: 'directory path containing WhatsApp related files'
}
const OUT_DIR = {
  switch: 'o',
  opt: 'out',
  description: 'output directory path'
}

let help = argv[HELP.switch] || argv[HELP.opt]
let targetDayString = argv[TARGET_DATE.switch] || argv[TARGET_DATE.opt]
let dbDir = argv[WA_DB_DIR.switch] || argv[WA_DB_DIR.opt]
let outDir = argv[OUT_DIR.switch] || argv[OUT_DIR.opt]

function printHelp () {
  console.log(stripIndent`
    A basic CLI utility for snapshotting daily data from a WhatsApp database.

    Version
      ${version}

    Usage
      wa-snap <options>

    Options
      -${HELP.switch}\t--${HELP.opt}\t\t${HELP.description}
      -${TARGET_DATE.switch}\t--${TARGET_DATE.opt}\t\t${TARGET_DATE.description}
      -${WA_DB_DIR.switch}\t--${WA_DB_DIR.opt}\t\t${WA_DB_DIR.description}
      -${OUT_DIR.switch}\t--${OUT_DIR.opt}\t\t${OUT_DIR.description}

    Example
      wa-snap -d 2016-01-20 -w in -o out
  `)
}

if (help) {
  printHelp()
} else {
  // create wa data load function
  let waLoad = waDbLoad.bind(null, {dbDir, targetDayString})

  // create snap save function
  let snapSave = snapFsSave.bind(null, {
    targetDayString,
    dbDir,
    outDir
  })

  // create the snapshot
  waUtil.saveSnapshot(waLoad, snapSave)
    .then(res => {
      console.log('Snapshot created successfully!')
    })
    .catch(err => {
      console.error(err)
      process.exitCode = 1
    })
}
