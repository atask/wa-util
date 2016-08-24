'use strict'

const waMessage = require('./message')
const waContact = require('./contact')

function addParticipantsFactory (participants) {
  return contact => {
    let parsedParticipants = participants
      .filter(participant => participant.gjid === contact.jid)
      .map(participant => participant.jid)
      .filter(participant => participant !== '')
    if (parsedParticipants.length) {
      contact.participants = parsedParticipants
    }
  }
}

function addMessagesFactory (messages) {
  return contact => {
    let parsedMessages = messages
      .filter(message => message.groupJid === contact.jid)
      .sort((firstMessage, secondMessage) => {
        return firstMessage.timestamp - secondMessage.timestamp
      })
    if (parsedMessages.length) {
      contact.messages = parsedMessages
    }
  }
}

function getActiveContactJids (contacts) {
  return contacts
    .filter(contact => contact.messages && contact.participants)
    .map(contact => contact.participants)
    .reduce((participantsIndex, participants) => {
      let diff = participants
        .filter(paticipant => !participantsIndex.includes(paticipant))
      return participantsIndex.concat(diff)
    }, [])
}

function pruneStaleContacts (contacts) {
  let activeContacts = getActiveContactJids(contacts)
  return contacts
    .filter(contact => {
      return contact.messages || activeContacts.includes(contact.jid)
    })
}

function latestMessageCompare (firstContact, secondContact) {
  let fc = firstContact
  let sc = secondContact
  let fcLength = fc.messages ? fc.messages.length : null
  let scLength = sc.messages ? sc.messages.length : null
  let fcLatest = fcLength ? fc.messages[fcLength - 1].timestamp : -1
  let scLatest = scLength ? sc.messages[scLength - 1].timestamp : -1
  // intentionally inverted order
  return scLatest - fcLatest
}

function parseWaDb (waData) {
  let addParticipants = addParticipantsFactory(waData.waParticipants)
  let messages = waData.waMessages.map(waMessage.parse)
  let addMessages = addMessagesFactory(messages)
  let contacts = waData.waContacts.map(waContact.parse)
  contacts.forEach(addParticipants)
  contacts.forEach(addMessages)
  contacts = pruneStaleContacts(contacts).sort(latestMessageCompare)
  return contacts
}

function getMedia (parsedWaDb = []) {
  return parsedWaDb
    .filter(contact => 'messages' in contact)
    .map(contact => contact.messages)
    .reduce((allMessages, messages) => {
      let diff = messages.filter(message => !allMessages.includes(message))
      return allMessages.concat(diff)
    }, [])
    .filter(message => 'path' in message)
    .map(message => message.path)
}

function getProfileImages (parsedWaDb = []) {
  return parsedWaDb.map(contact => {
    let profilePictureBaseName = contact.jid.split('@')[0]
    return {
      profilePicture: `${profilePictureBaseName}.jpg`,
      avatar: `${contact.jid}.j`
    }
  })
}

function saveSnapshot (loadData, saveData) {
  let parsedData = loadData().then(parseWaDb)
  let media = parsedData.then(getMedia)
  let profileImages = parsedData.then(getProfileImages)

  return Promise
    .all([parsedData, media, profileImages])
    .then(([
      parsedData,
      media,
      profileImages]
    ) => saveData({
      parsedData,
      media,
      profileImages
    }))
}

function listMedia (loadData) {
  let parsedData = loadData().then(parseWaDb)
  let media = parsedData.then(getMedia)
  let profileImages = parsedData.then(getProfileImages)

  return Promise
    .all([media, profileImages])
    .then(([media, profileImages]) => ({
      media,
      profileImages
    }))
}

function dumpWaData (loadData) {
  return loadData().then(parseWaDb)
}

module.exports = {
  saveSnapshot,
  listMedia,
  dumpWaData
}
