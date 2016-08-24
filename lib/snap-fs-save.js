'use strict'

const PromiseProxyNode = require('promiseproxy-node')
const fs = PromiseProxyNode('fs')
const path = require('path')
const moment = require('moment')
const shelljs = require('shelljs')

const todayISO = moment().format('YMMDD')
const defaultDbDir = path.join(process.cwd(), 'in')
const defaultDestDir = path.join(process.cwd(), 'out')

function copyFile (src, dest) {
  return fs.access(src, fs.constants.R_OK).then(err => {
    if (!err) {
      shelljs.mkdir('-p', path.dirname(dest))
      shelljs.cp(src, dest)
    }
  })
}

function snapFsSave (
  {
    targetDayString = todayISO,
    dbDir = defaultDbDir,
    outDir = defaultDestDir
  },
  {
    parsedData = [],
    media = [],
    profileImages = []
  }
) {
  let mediaDir = dbDir
  let profilePicturesDir = path.join(dbDir, 'Profile Pictures')
  let avatarDir = path.join(dbDir, 'Avatars')
  let snapshotDir = path.join(outDir, `snapshot-${targetDayString}`)
  let snapshotPath = path.join(snapshotDir, `snapshot-${targetDayString}.json`)

  shelljs.mkdir('-p', snapshotDir)

  // save snapshot + some meta data
  let snapshotMeta = {
    [targetDayString]: {
      contacts: parsedData
    }
  }
  let formattedJSON = JSON.stringify(snapshotMeta, null, 2)
  let savedSnapshot = fs.writeFileSync(snapshotPath, formattedJSON)

  // copy media files
  let copiedMedia = Promise.all(media.map(medium => {
    let src = path.join(mediaDir, medium)
    let dest = path.join(snapshotDir, medium)
    return copyFile(src, dest)
  }))

  // copy profile images
  let copiedProfileImages = profileImages.map(profileImage => {
    let profilePictureSrc = path.join(profilePicturesDir,
      profileImage.profilePicture)
    let profilePictureDest = path.join(snapshotDir, 'Profile Pictures',
      profileImage.profilePicture)
    let copiedProfilePicture = copyFile(profilePictureSrc, profilePictureDest)

    let avatarSrc = path.join(avatarDir, profileImage.avatar)
    let avatarDest = path.join(snapshotDir, 'Avatars', profileImage.avatar)
    let copiedAvatar = copyFile(avatarSrc, avatarDest)

    return Promise.all([copiedProfilePicture, copiedAvatar])
  })

  return Promise
    .all([savedSnapshot, copiedMedia, copiedProfileImages])
    .then(() => {})
}

module.exports = snapFsSave
