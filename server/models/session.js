'use strict';

const mongoose = require('mongoose');

let sessionSchema = new mongoose.Schema({
  approval: String, // pending, approved, denied (by brooke) 
  type: String, // Case study or workshop - structure of multiple choice fields? in front end, dropdown or radio fields
  length: String, // 90 minutes, 3 hours (parts 1 and 2)
  title: String,
  descriptionWebsite: String, // To appear on CCAW website and conference appear 150 word limit
  descriptionProgram: String, // To be printed on pamphlet? 60 word limit
  tags: [{ // Option to add tags after MVP
    name: String,
    label: String, // Optional, for long tag names
    checked: Boolean
  }], 
  level: String, // beginner, intermediate or advanced - dropdown on frontend
  willingToBeRecorded: String, // audio, audioVisual, no
  isMediaOrPressFriendly: String, // yes, yesNophotos, yesNoAudioRecOrPhotos, no
  willingToRepeat: Boolean,
  hasCopresentor: Boolean,
  speakers: { // _id's of presentor and copresenters
    mainPresenter: String,
    coPresenters: [String]
  },
  statusTimeLocation: [{
    conferenceTitle: String,
    timeSlot: String,
    part: String, // 1 or 2 - for two parters, which part is being scheduled else 0
    room: String
  }],
  miscRequirements: String
});

module.exports = mongoose.model('Session', sessionSchema);