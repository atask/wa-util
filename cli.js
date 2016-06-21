const snapshot = require('./lib/snapshot')
const argv = require('minimist')(process.argv.slice(2))
const moment = require('moment')

const TARGET_DATE_OPT = 'day'

const WA_DB_OPT = 'wa'
const MSGSTORE_DB_OPT = 'msgstore'

let options = {}

if (argv.d) {
  options.targetDayString = argv.d
} else if (argv[TARGET_DATE_OPT]) {
  options.targetDayString = argv[TARGET_DATE_OPT]
}

if (argv.w) {
  options.waPath = argv.w
} else if (argv[WA_DB_OPT]) {
  options.waPath = argv[WA_DB_OPT]
}

if (argv.m) {
  options.msgstorePath = argv.m
} else if (argv[MSGSTORE_DB_OPT]) {
  options.msgstorePath = argv[MSGSTORE_DB_OPT]
}

snapshot.createSnapshot(options, (err, res) => {
  if (err) {
    console.log('ERROR...')
    porcess.exit(1)
  }
  console.log(JSON.stringify(res, null, 2))
  process.exit()
})
