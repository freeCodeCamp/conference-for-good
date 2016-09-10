'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

let speakerSchema = new mongoose.Schema({

  // Credentials
  admin: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: true
  },
  nameFirst: {
    type: String,
    required: true
  },
  nameLast: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  salutation: String,
  profileComplete: {
    type: Boolean,
    default: false
  },

  // Speaker information
  status: {
    type: String,
    default: 'pending'
  }, // pending, accepted, denied, notifed: boolean
  statusNotification: Boolean,  // After accepting/denying, whether they were notified
  title: String,
  organization: String,
  address1: String,
  address2: String,
  city: String,
  state: String,
  zip: String,
  phoneWork: String,
  phoneCell: String,
  assistantOrCC: String, // Not sure what this is, not required
  bioWebsite: String, // For website/app, 125 word limit
  bioProgram: String, // For pamphlet/printed program, 60 word limit
  headshot: String, // file handling ourselves (typeform has drag/drop file selection) sanitize extensions after MVP, min/max size
  mediaWilling: Boolean,
  costsCoveredByOrg: [{ // In form: Travel/Lodging/None check all that apply
    name: String,
    covered: Boolean
  }],
  speakingFees: String, // Not sure if we need a number? Selectable from dropdown?
  hasPresentedAtCCAWInPast2years: Boolean,
  recentSpeakingExp: String,
  speakingReferences: String, // At least 2
  adminNotes: String,

  // Session ids that the speaker is involved in
  sessions: [String]
});

speakerSchema.methods.generateHash = password => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

speakerSchema.methods.validatePassword = (enteredPass, actualPassHash) => {
  return bcrypt.compareSync(enteredPass, actualPassHash);
};

module.exports = mongoose.model('Speaker', speakerSchema);