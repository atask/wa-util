const snapshot = require('./lib/snapshot')
const argv = require('minimist')(process.argv.slice(2))
const stripIndent = require('common-tags').stripIndent

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

let targetDayString = argv[TARGET_DATE.switch] || argv[TARGET_DATE.opt]
let waPath = argv[WA_DB.switch] || argv[WA_DB.opt]
let msgstorePath = argv[MSGSTORE_DB.switch] || argv[MSGSTORE_DB.opt]

if ([targetDayString, waPath, msgstorePath].includes(undefined)) {
  console.log(stripIndent`
    wa-snap <options>
      -${TARGET_DATE.switch}\t--${TARGET_DATE.opt}\t\t${TARGET_DATE.description}
      -${WA_DB.switch}\t--${WA_DB.opt}\t\t${WA_DB.description}
      -${MSGSTORE_DB.switch}\t--${MSGSTORE_DB.opt}\t${MSGSTORE_DB.description}
  `)
  process.exitCode = 64
} else {
  let options = { targetDayString, waPath, msgstorePath }
  snapshot.createSnapshot(options, (err, res) => {
    if (err) {
      console.log('ERROR...')
      process.exitCode = 1
    }
    console.log(JSON.stringify(res, null, 2))
    process.exit()
  })
}
