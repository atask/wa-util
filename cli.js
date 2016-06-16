const account = require('./lib/account')
const argv = require('minimist')(process.argv.slice(2))
const moment = require('moment')

const START_DATE_OPT = 'start-date'
const END_DATE_OPT = 'end-date'

let dbLocation = '.'
let options = {}

// parse options, if available
if (argv.f) {
  dbLocation = argv.f
} else if (argv.file) {
  dbLocation = argv.file
}

if (argv.s) {
  options.startDate = moment(argv.s).format('x')
} else if (argv[START_DATE_OPT]) {
  options.startDate = moment(argv[START_DATE_OPT]).format('x')
}

if (argv.e) {
  options.endDate = moment(argv.e).format('x')
} else if (argv[END_DATE_OPT]) {
  options.endDate = moment(argv[END_DATE_OPT]).format('x')
}

let testAccount = Object.create(account)
testAccount.load(dbLocation, err => {
  if (err) {
    console.log('ERROR...')
  }
  console.log(testAccount.getMediaFilesList())
}, options)
