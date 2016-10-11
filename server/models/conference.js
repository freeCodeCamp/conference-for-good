'use strict';

const mongoose = require('mongoose');

let conferenceSchema = new mongoose.Schema({
  archived: Boolean,
  lastActive: Boolean,
  defaultConf: Boolean,
  title: String,
  dateRange: {
    _id: false,
    start: String, // 2016-12-30
    end: String
  },
  days: [{
    _id: false,
    date: String,
    timeSlots: [{
      _id: false,
      start: String,
      end: String,
    }]
  }],
  rooms: [String]
});

module.exports = mongoose.model('Conference', conferenceSchema);