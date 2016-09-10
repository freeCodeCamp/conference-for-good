'use strict';

/**
 * Seed DB with mock data on server when server starts.
 * To disable, set .env 'SEED_DB' to false
 */

const _ = require('lodash');
const Session = require('./models/session');
const Speaker = require('./models/speaker');
const ipsumObj = require('./ipsumtext.json');
const dummyUsers = require('./dummyusers.json');

function seedSessions() {
  let sessionSeeding = new Promise((resolve, reject) => {
    Session.remove({}, (err) => {
      if (err) console.log(err);
      else {
        Session.create(generateSessions(100)).then(resolve());
      }
    });
  });
  return sessionSeeding;
}

function seedSpeakers() {
  let speakerSeeding = new Promise((resolve, reject) => {
    Speaker.remove({}, (err) => {
      if (err) console.log(err);
      else {
        Speaker.create(generateSpeakers(100)).then(resolve());
      }
    })
  });
  return speakerSeeding;
}

function seedAdmin() {
    Speaker.find({admin: true}).remove().exec(err => {
        if (err) {
            throw err;
        } else {
          var user = new Speaker();
          const hashPass = user.generateHash('password');
            Speaker.create({
                admin: true,
                password: hashPass,
                nameFirst: 'Jane',
                nameLast: 'Doe',
                email: 'admin@gmail.com'
            });
        }
    });
}

function generateSessionTags() {
  return [
    {
      name: 'advocacy',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'campusSafety',
      label: 'Campus Safety',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'ccr',
      label: 'Coordinated Community Response (CCR)',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'culturallySpecific',
      label: 'Culturally-Specific (African American, Faith Groups, Latina, LGBT, etc.)',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'domesticViolence',
      label: 'Domestic Violence',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'forensics',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'humanTrafficking',
      label: 'Human Trafficking',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'lawEnforcement',
      label: 'Law Enforcement/Investigation',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'medical',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'military',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'probation',
      label: 'Probation/Parole',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'prosecution',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'sexualAssault',
      label: 'Sexual Assault',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'stalking',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'survivorStory',
      label: 'Survivor Story',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'technology',
      checked: Math.floor(Math.random()*2) === 0
    },
    {
      name: 'tribalIssues',
      label: 'Tribal Issues',
      checked: Math.floor(Math.random()*2) === 0
    }
  ]
}

function generateSessions(amount) {
  let sessions = [];
  for (let i = 0; i < amount; i++) {
    let randSess = new Session({
      type: 'casestudy',
      length: '90',
      title: ipsumObj.title[_.random(0, ipsumObj.title.length-1)],
      descriptionWebsite: ipsumObj.long[_.random(0, ipsumObj.long.length-1)],
      descriptionProgram: ipsumObj.short[_.random(0, ipsumObj.short.length-1)],
      tags: generateSessionTags(),
      level: 'intermediate',
      willingToBeRecorded: 'audio',
      isMediaOrPressFriendly: 'yesNoPhotos',
      willingToRepeat: Math.floor(Math.random()*2) === 0
    });
    sessions.push(randSess);
  }
  return sessions;
}

function generateSpeakers(amount) {
  let speakers = [];
  for (let i = 0; i < amount; i++) {
    let user = dummyUsers[_.random(0, dummyUsers.length)];
    let randSpeaker = new Speaker({
      admin: false,
      password: 'password',
      salutation: user.name.title,
      nameFirst: user.name.first,
      nameLast: user.name.last,
      email: user.email,
      status: 'pending',
      statusNotification: false,
      title: user.name.title,
      organization: 'Free Code Camp',
      address1: user.location.street,
      city: user.location.city,
      state: user.location.state,
      zip: user.location.postcode,
      phoneWork: user.phone,
      phoneCell: user.cell,
      bioWebsite: ipsumObj.long[_.random(0, ipsumObj.long.length-1)],
      bioProgram: ipsumObj.short[_.random(0, ipsumObj.short.length-1)],
      headshot: user.picture.thumbnail,
      mediaWilling: Math.floor(Math.random()*2) === 0,
      costsCoveredByOrg: [{name: 'travel', covered: Math.floor(Math.random()*2) === 0},
                          {name: 'lodging', covered: Math.floor(Math.random()*2) === 0}],
      speakingFees: 'None',
      hasPresentedAtCCAWInPast2years: Math.floor(Math.random()*2) === 0,
      recentSpeakingExp: 'None',
      speakingReferences: 'Ref1\nRef2',
      adminNotes: ''
    });
    speakers.push(randSpeaker);
  }
  return speakers;
}

seedSessions()
  .then(res => seedSpeakers())
  .then(res => seedAdmin())
  .then(res => console.log('Database seeded!'));