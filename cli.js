const snapshot = require('./lib/snapshot')
const argv = require('minimist')(process.argv.slice(2))
const moment = require('moment')

const TARGET_DATE_OPT = 'day'

const WA_DB_OPT = 'wa'
const MSGSTORE_DB_OPT = 'msgstore'

let options = {}

if (argv.d) {
  options.day = moment(argv.s, 'YYYY-MM-DD')
} else if (argv[TARGET_DATE_OPT]) {
  options.day = moment(argv[START_DATE_OPT], 'YYYY-MM-DD')
}

if (argv.w) {
  options.wa = argv.w
} else if (argv[WA_DB_OPT]) {
  options.wa = argv[WA_DB_OPT]
}

if (argv.m) {
  options.msgstore = argv.m
} else if (argv[MSGSTORE_DB_OPT]) {
  options.msgstore = argv[MSGSTORE_DB_OPT]
}

snapshot.createSnapshot(options, (err, res) => {
  if (err) {
    console.log('ERROR...')
    porcess.exit(1)
  }
  console.log(JSON.stringify(res))
  process.exit()
})
