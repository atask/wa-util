var account = require('./lib/account');

testAccount = Object.create(account);
testAccount.load('./test/wa-dbs', function(err) {
    if(err) {
        console.log('ERROR...');
    }
    console.log(testAccount.getMediaFilesList());
});
