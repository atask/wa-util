var account = require('../lib/account.js');

var should = require('chai').should();

describe('account', function() {
    it('should get somewhere...', function(done) {
        // init an account
	var testAccount = Object.create(account);
	testAccount.load('./test/wa-dbs/wa.db', './test/wa-dbs/msgstore.db', function loaded(err) {
	    should.not.exist(err);
	    done();
	});
    });
});
