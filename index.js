var account = require('./lib/account'),
    argv = require('minimist')(process.argv.slice(2)),
    moment = require('moment');

var START_DATE_OPT = 'start-date',
    END_DATE_OPT = 'end-date';

var dbLocation = '.',
    options = {};

// parse options, if available
if(argv.f) {
    dbLocation = argv.f;
} else if(argv.file) {
    dbLocation = argv.file;
}

if(argv.s) {
    options.startDate = moment(argv.s).format('x');
} else if(argv[START_DATE_OPT]) {
    options.startDate = moment(argv[START_DATE_OPT]).format('x');
}

if(argv.e) {
    options.endDate = moment(argv.e).format('x');
} else if(argv[END_DATE_OPT]) {
    options.endDate = moment(argv[END_DATE_OPT]).format('x');
}

testAccount = Object.create(account);
testAccount.load(dbLocation, function(err) {
    if(err) {
        console.log('ERROR...');
    }
    console.log(testAccount.getMediaFilesList());
}, options);
