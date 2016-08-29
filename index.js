'use strict'

const contact = require('./lib/contact')
const message = require('./lib/message')
const waUtil = require('./lib/wa-util')
const waDbLoad = require('./lib/wa-db-load')
const snapFsSave = require('./lib/snap-fs-save')

waUtil.constact = contact
waUtil.message = message
waUtil.loadWaFromDbs = waDbLoad.waDbLoad
waUtil.loadWaFromDir = waDbLoad.waDbLoadDir
waUtil.saveDataToFs = snapFsSave

module.exports = waUtil
