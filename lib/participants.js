// should be called with each result from
// 'select * from group_participants'

function parse (waGroupParticipants) {
  let participantsMap = {}
  waGroupParticipants.forEach(participation => {
    let groupJid = participation.gjid
    let participantJid = participation.jid
    if (participantJid) {
      if (groupJid in participantsMap) {
        participantsMap[groupJid].push(participantJid)
      } else {
        participantsMap[groupJid] = [participantJid]
      }
    }
  })
  return participantsMap
}

function addParticipants (waContact, participants) {
  let contactJid = waContact.jid
  if (contactJid in participants) {
    waContact.participants = participants[contactJid]
  }
}

module.exports = {
  parse,
  addParticipants
}
