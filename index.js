'use strict'

const contact = require('./lib/contact')
const message = require('./lib/message')
const waUtil = require('./lib/wa-util')

waUtil.constact = contact
waUtil.message = message

module.exports = waUtil
