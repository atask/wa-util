const fs = require('fs')
const path = require('path')
const clone = require('lodash/lang').cloneDeep

const loadSync = (recordPath) => {
  let map = {}
  let array
  try {
    fs.accessSync(recordPath)
    array = JSON.parse(fs.readFileSync(recordPath, 'utf8'))
  } catch (e) {
    return map
  }
  array.forEach(entry => {
    let id = entry.id
    delete entry.id
    map[id] = entry
  })
  return map
}

const dumpSync = (recordPath, map, sortBy) => {
  let recordDir = path.dirname(recordPath)
  fs.accessSync(recordDir)
  let array = Object.keys(map)
  if (sortBy) {
    array.sort((firstId, secondId) => {
      let firstValue = map[firstId][sortBy]
      let secondValue = map[secondId][sortBy]
      return firstValue.localeCompare(secondValue)
    })
  }
  let fd = fs.openSync(recordPath, 'w')
  fs.writeSync(fd, '[\n')
  array.forEach(id => {
    let entry = clone(map[id])
    entry.id = id
    fs.writeSync(fd, `\t${JSON.stringify(entry)}\n`)
  })
  fs.writeSync(fd, ']\n')
  fs.closeSync(fd)
}

module.exports = {
  loadSync,
  dumpSync
}
