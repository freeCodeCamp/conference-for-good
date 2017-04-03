'use strict';

var router = require('express').Router();
const Speaker = require('../models/speaker');
const Conference = require('../models/conference');
const Session = require('../models/session');
const _ = require('lodash');
const multer = require('multer');
const path = require('path');
const json2csv = require('json2csv');
const fs = require('fs');
const Dropbox = require('dropbox');
const csv = require("fast-csv");

// Mailgun setup
const Mailgun = require('mailgun-js');
const mailgun_api = process.env.MAILGUN_API_KEY;
const domain = 'conferencecaw.org';
const mailgun = new Mailgun({apiKey: mailgun_api, domain: domain});
const our_email = 'bmeyer@genesisshelter.org';

/**** Exporting API ****/
// these comments can be removed once we verify this feature is working as needed —
// need notification of change when:

// a) new account created: include info                         -> /signup
// b) new profile created/completed: include info               -> /updatespeaker
// c) new workshop proposal created: include info               -> /updatesession
// d) speaker response form completed: include info             -> /updatespeaker
// e) speaker uploads handout: no info needed (bc Dropbox)      -> /uploadFile
// f) speaker uploads W9: no info needed (bc Dropbox)           -> /uploadFile

// helper function to email notification messages to admin users
function notifyAdmin(message, subject) {
    
    var mailOptions = {
        from: `CCAW Admin Service <${our_email}>`,
        to: our_email,
        subject: `CCAW: ${subject}`,
        html: `<div>${message}</div>`
    };

    mailgun.messages().send(mailOptions, function(err, body){
        if (err) {
            console.log('admin notification email not sent', error);
        } else {
            console.log('admin notification email sent');
        }
    });

};

router.get('/dropbox/:filename/:directory/:speakerName', (req, res) => {

    let { filename, directory, speakerName } = req.params;
    let message = `${speakerName} has uploaded a file: ${filename}`;
    notifyAdmin(message, 'New File Uploaded');

    var dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN });
    let fileDir = path.join(__dirname, '../uploads/' + filename);

    fs.readFile(fileDir, (err, contents) => {
        if (err) {
            console.log('Error: ', err);
        }
        dbx.filesUpload({ path: '/ccaw-uploads/' + directory + '/' + filename, contents: contents })
            .then(response => {
                // File is only needed on the server to upload to dbx, delete it when done
                fs.unlink(fileDir, err => {
                    if (err) console.log('File clear error: ', err);
                });
                let dbxUrl = '';
                dbx.sharingCreateSharedLink({path: response.path_display, short_url: false}).then(dbxRes => {
                    // Set dbx url dl query to 1 to allow direct download
                    dbxUrl = dbxRes.url.slice(0, dbxRes.url.length-1) + '1';
                    res.status(200).json(dbxUrl);
                });
            })
            .catch(error => {
                // Delete file if cannot upload to dropbox
                fs.unlink(fileDir, err => {
                    if (err) console.log('File clear error: ', err);
                });
                res.status(401).json(error);
            });
    });
});

const upload = multer({
      storage: multer.diskStorage({
          filename: (req, file, cb) => {
              cb(null , req.body.userFilename);
          },
        destination: function(req, file, cb){
            cb(null, __dirname + '/../uploads');
        },
      })
  });

router.post('/upload', upload.any(), (req, res) => {
    res.json(req.files.map(file => {
        let ext = path.extname(file.originalname);
        return {
            originalName: file.originalname,
            filename: file.filename
        }
    }));
});

router.post('/uploadFile', upload.any(), (req, res) => {
    res.status(200).json({msg: 'file uploaded'});
});

var responseFromProps = ["completed", "agreedHotel", "bookAuthor", "bookTitle", "bookAvailable", "otherDietary", "whyConflict", "agreedDates", "agreedTransport", "ccawCoveringHotel", "dateDeparture", "dateArrival", "ccawLodging", "otherDietary"];

var mealsArray = ["Speaker/VIP Welcome Reception, 6-8pm- 05/21/17", "Breakfast- 05/22/2017", "Lunch- 05/22/2017", "CCAW Networking Event, 4:30-7pm- 05/22/2017", "Breakfast- 05/23/2017", "Lunch- 05/23/2017", "Breakfast- 05/24/2017", "Lunch- 05/24/2017", "Breakfast- 05/25/2017"]

var mealsObjectsArray = [{"date": "05/21/17", "meal": "Reception"}, { "date": "2017-05-22", "meal": "Breakfast"}, { "date": "2017-05-22", "meal": "Lunch"}, {"date": "2017-05-22", "meal": "Networking"}, {"date": "2017-05-23", "meal": "Breakfast"}, {"date": "2017-05-23", "meal": "Lunch"}, {"date": "2017-05-24", "meal": "Breakfast"}, {"date": "2017-05-24", "meal": "Lunch"}, {"date": "2017-05-25", "meal": "Breakfast"}];

var dietaryNeedsArray = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Other"]

var arrangementsArray = ["associatedConf", "travel", "travelAmount", "lodging", "lodgingAmount", "honorarium", "lodgingConfirmNum", "receivedFlightItin", "arrivalAirport", "arrivalDate", "arrivalAirline", "arrivalFlightNum", "departAirport", "departDate", "departAirline", "departFlightNum"];

router.post('/uploadCsv', upload.any(), (req, res) => {
    var csvData = [];
    fs.createReadStream(__dirname + '/../uploads/' + req.body.userFilename).pipe(csv()).on("data", function(data) {
        csvData.push(data);
    })
    .on("end", function(data) {
        var emailIndex = csvData[0].indexOf("email");
        var counter = 0;
        for (var i = 1; i < csvData.length; i++) {
            counter++;
            updateSpeakerFromImport(req, res, csvData, counter, emailIndex, i);
        }
    })    
});

router.get('/getallconferences', (req, res) => {
    Conference
        .find({})
        .exec()
        .then(conferences => {
            res.status(200).json(conferences);
        });
});

router.get('/getallspeakers', (req, res) => {
    Speaker
        .find({})
        .exec()
        .then(speakers => {
            res.status(200).json(speakers);
        })
});

router.get('/getallsessions', (req, res) => {
    Session
        .find({})
        .exec()
        .then(sessions => {
            res.status(200).json(sessions);
        })
});

router.post('/createconference', (req, res) => {
    let conf = req.body;
    updateActiveConfs(null)
        .then(saveSuccess => {
            if (!saveSuccess) return res.status(500).json({message: 'Conference save error'});
            else return updateDefaultConfs(null);
        }).then(saveSuccess => {
        if (saveSuccess) {
            let newConf = new Conference();
            newConf.lastActive = true;
            newConf.defaultConf = true;
            newConf.title = conf.title;
            newConf.venueName = conf.venueName;
            newConf.venueAddress = conf.venueAddress;
            newConf.dateRange = {
                start: conf.dateRange.start,
                end: conf.dateRange.end
            };
            newConf.save(err => {
                if (err) {
                    res.status(500).json({message: 'Conference save error'});
                }
                else res.status(200).json({message: 'Conference created'});
            });
        } else res.status(500).json({message: 'Conferences updating error'});
    });
});

router.post('/changeactiveconf', (req, res) => {
    let conf = req.body;

    updateActiveConfs(conf).then(saveSuccess => {
        if (saveSuccess) res.status(200).json({message: 'Conferences update'});
        else res.status(500).json({message: 'Conferences updating error'});
    });
});

router.post('/changedefaultconf', (req, res) => {
    let conf = req.body;

    updateDefaultConfs(conf).then(saveSuccess => {
        if (saveSuccess) res.status(200).json({message: 'Conferences update'});
        else res.status(500).json({message: 'Conferences updating error'});
    });
});

router.post('/addtimeslot', (req, res) => {
    let confTitle = req.body.title;
    let newSlot = req.body.newSlot;
    let date = req.body.date;

    Conference
        .findOne({ title: confTitle })
        .exec()
        .then(serverConf => {
            let confDate = _.find(serverConf.days, day => day.date === date);
            if (typeof confDate === 'undefined') {
                if (typeof serverConf.days === 'undefined') serverConf.days = [];
                let newDay = {
                    date: date,
                    timeSlots: [{
                        start: newSlot.start,
                        end: newSlot.end
                    }]
                };
                serverConf.days.push(newDay);
            } else {
                confDate.timeSlots.push({
                                            start: newSlot.start,
                                            end: newSlot.end
                                        });
            }
            serverConf.save(err => {
                if (err) res.status(500).json({message: 'Conference save error'});
                else res.status(200).json(serverConf);
            });
        });
});

router.post('/deletetimeslot', (req, res) => {
    let conf = req.body;

    Conference
        .findOne({ title: conf.title })
        .exec()
        .then(serverConf => {
            serverConf.days = conf.days;
            serverConf.save(err => {
                if (err) res.status(500).json({message: 'Conference save error'});
                else res.status(200).json(serverConf);
            });
        });
});

router.post('/addRoom', (req, res) => {
    let conf = req.body;

    Conference
        .findOne({title: conf.title})
        .exec()
        .then(serverConf => {
            serverConf.rooms = conf.rooms;
            serverConf.save(err => {
                if (err) res.status(500).json({ message: 'Conference room save error'});
                else res.status(200).json({message: 'Conference room saved'});
            });
        });
});

router.post('/deleteRoom', (req, res) => {
    let conf = req.body;

    Conference
        .findOne({title: conf.title})
        .exec()
        .then(serverConf => {
            serverConf.rooms = conf.rooms;
            serverConf.save(err => {
                if (err) res.status(500).json({ message: 'Conference room save error'});
                else res.status(200).json({message: 'Conference room saved'});
            });
        });
});

router.post('/addconfupload', (req, res) => {
    let conf = req.body;

    Conference
        .findOne({ title: conf.title })
        .exec()
        .then(serverConf => {
            serverConf.uploads = conf.uploads;
            serverConf.save(err => {
                if (err) res.status(500).json({ message: 'Upload save failed' });
                else res.status(200).json(serverConf);
            });
        });
});

router.post('/updateconference', (req, res) => {
    let currentTitle = req.body.currentTitle;
    let conf = req.body.conference;

    Conference
        .findOne({ title: currentTitle })
        .exec()
        .then(serverConf => {

            /** Super ugly band aid on a massive oversight I made
             * Conf title is used as an id to search for conf and is used
             * as a reference in sessions to the conf, so changes
             * to the title mess up all the references, so we need to update them all
             * when the title is updated (much simpler than changing all the referencing code)
             */
            Session
                .find({})
                .exec()
                .then(sessions => {
                    for (let i = 0; i < sessions.length; i++) {
                        let needsUpdate = false;
                        if (sessions[i].associatedConf === currentTitle) {
                            sessions[i].associatedConf = conf.title;
                            needsUpdate = true;
                        }
                        if (sessions.statusTimeLocation && sessions.statusTimeLocation.length < 0) {
                            for (let j = 0; j < sessions[i].statusTimeLocation.length; j++) {
                                if (sessions[i].statusTimeLocation[j].conferenceTitle === currentTitle) {
                                    sessions[i].statusTimeLocation[j].conferenceTitl = conf.title;
                                    needsUpdate = true;
                                }
                            }
                        }
                        if (needsUpdate) {
                            sessions[i].save(err => {
                                if (err) console.log('session save error', err);
                            });
                        }
                    }

                    serverConf.title = conf.title;
                    serverConf.venueName = conf.venueName;
                    serverConf.venueAddress = conf.venueAddress;
                    serverConf.save(err => {
                        if (err) res.status(500).json({message: 'Conference save error'});
                        else res.status(200).json({message: 'Conference saved'});
                    });

                });
        });
});

router.post('/archiveconf', (req, res) => {
    let conf = req.body;

    Conference
        .findOne({ title: conf.title })
        .exec()
        .then(serverConf => {
            serverConf.archived = conf.archived;
            serverConf.save(err => {
                if (err) res.status(500).json({message: 'Conference save error'});
                else res.status(200).json({message: 'Conference saved'});
            });
        });
});

router.post('/updateconfrooms', (req, res) => {
    let conf = req.body;

    Conference
        .findOne({ title: conf.title })
        .exec()
        .then(serverConf => {
            serverConf.rooms = conf.rooms;
            serverConf.save(err => {
                if (err) res.status(500).json({message: 'Conference save error'});
                else res.status(200).json({message: 'Conference saved'});
            });
        });
});

router.post('/deleteupload', (req, res) => {
    let conf = req.body;

    Conference
        .findOne({ title: conf.title })
        .exec()
        .then(serverConf => {
            serverConf.uploads = conf.uploads;
            serverConf.save(err => {
                if (err) res.status(500).json({message: 'Conference save error'});
                else res.status(200).json({message: 'Conference saved'});
            });
        });
});


router.post('/updatespeaker/:notify', (req, res) => {
    let notify = req.params.notify;
    let speaker = req.body;

    let name = `${speaker.nameFirst} ${speaker.nameLast}`;

    if (notify === 'true') {

        let message = '';

        if (speaker.profileComplete && !speaker.responseForm.completed) {
            message += `${name}'s profile is now complete.`;
        } else if (speaker.responseForm.completed) {
            message += `${name}'s response form is now complete.`;
        }
        
        notifyAdmin(message, 'Speaker Information Updated');
    }

    Speaker
        .findOneAndUpdate({_id: speaker._id}, speaker, {upsert:true, new: true}, (err, user) => {
            if (err) {
                return res.status(500).json({ alert: 'failed' });
            }
            return res.status(200).json(user);
        });
});

router.post('/updatesession', (req, res) => {
    let session = req.body;
    // Existing sessions have an id
    if (session._id) {
        Session
            .findById(session._id)
            .exec()
            .then(serverSession => {
                if (serverSession === null) {
                    res.status(500).json({message: 'Session not found'});
                } else {
                    // only send additional notification if proposal is now complete
                    if (session.sessionComplete) {
                        // compose a message to notify admins that a speaker has submited a new proposal
                        Speaker.findById(session.speakers.mainPresenter, (err, speaker) => {
                            let name = `${speaker.nameFirst} ${speaker.nameLast}`;
                            let message = `${name} has saved a completed proposal titled <b>${session.title}</b>.
                            The session Website Description is:<br><br><i>${session.descriptionWebsite}</i><br><br>.
                            The session Program Description is:<br><br><i>${session.descriptionProgram}</i>.`
                            notifyAdmin(message, 'Speaker Proposal Complete');
                        });
                    }
                    _.merge(serverSession, session);
                    serverSession.save(err => {
                        if (err) {
                            res.status(500).json({message: 'Session save error'});
                        } else res.status(200).json(serverSession);
                    });
                }
            });
    } else {
        let newSession = new Session();

        // compose a message to notify admins that a speaker has submited a new proposal
        Speaker.findById(session.speakers.mainPresenter, (err, speaker) => {
            let name = `${speaker.nameFirst} ${speaker.nameLast}`;
            let message = `${name} has submited a new session. `

            if (session.title) message += `The Title is: <b>${session.title}</b>. `;
            if (session.descriptionWebsite) message += `The session Website Description is:<br><br><i>${session.descriptionWebsite}</i><br><br>. `;
            if (session.descriptionProgram) message += `The session Program Description is:<br><br><i>${session.descriptionProgram}</i>. `;

            message += `The proposal is currently${session.sessionComplete ? '<b>Complete</b>' : '<b>Incomplete</b>.'}`;

            notifyAdmin(message, 'New Proposal Submission');
        });
              
        _.merge(newSession, session);
        newSession.save(err => {
            if (err) {
                res.status(500).json({message: 'Session save error'});
            } else res.status(200).json(newSession);
        });
    }
});

router.post('/deletesession', (req, res) => {
    const session = req.body;
    Session.findByIdAndRemove(session._id)
        .exec()
        .then(doc => {
            res.status(200).json({message: 'Session deleted'});
        });
});

router.post('/updatesessionspeakers', (req, res) => {
    let session = req.body;

    Session
        .findById(session._id)
        .exec()
        .then(serverSession => {
            if (serverSession === null) {
                res.status(500).json({message: 'Session not found'});
            } else {
                serverSession.speakers = session.speakers;
                serverSession.save(err => {
                    if (err) {
                        res.status(500).json({message: 'Session save error'});
                    } else res.status(200).json(serverSession);
                });
            }
        });
});

router.post('/updatesessionslots', (req, res) => {
    let session = req.body;

    Session
        .findById(session._id)
        .exec()
        .then(serverSession => {
            if (serverSession === null) {
                res.status(500).json({message: 'Session not found'});
            } else {
                serverSession.statusTimeLocation = session.statusTimeLocation;
                serverSession.save(err => {
                    if (err) {
                        res.status(500).json({message: 'Session save error'});
                    } else res.status(200).json(serverSession);
                });
            }
        });
});

router.post('/updatesessionhandout', (req, res) => {
    let session = req.body;

    Session
        .findById(session._id)
        .exec()
        .then(serverSession => {
            if (serverSession === null) {
                res.status(500).json({message: 'Session not found'});
            } else {
                serverSession.handouts = session.handouts;
                serverSession.save(err => {
                    if (err) {
                        res.status(500).json({message: 'Session save error'});
                    } else res.status(200).json(serverSession);
                });
            }
        });
});

/**** Exporting API ****/

router.post('/exportsessions', (req, res) => {
    let exportFields = req.body;
    let desiredFields = [];
    for (let i = 0; i < exportFields.length; i++) {
        if (exportFields[i].checked) desiredFields.push(exportFields[i].name);
    }

    Session
        .find({})
        .exec()
        .then(sessions => {
            Speaker
                .find({})
                .exec()
                .then(speakers => {
                    Conference
                        .find({defaultConf: true})
                        .exec()
                        .then(confs => {
                            let defaultConf = confs[0];
                            let csv = parseSessionData(desiredFields, sessions, speakers, defaultConf);

                            // In case we get sequential requests
                            let filerand = _.random(0, 10000);
                            let filename = `sessions${filerand}.csv`;
                            fs.writeFile(filename, csv, (err) => {
                                if (err) {
                                    res.status(500).end();
                                }
                                else {
                                    res.download(filename, 'sessionsFinal.csv', (err) => {
                                        if (!err) fs.unlink(filename);
                                    });
                                }
                            });
                        });
                });
        });
});

router.post('/exportspeakers', (req, res) => {
    let exportFields = req.body.fields;
    let conf = req.body.conf;
    let desiredFields = [];
    for (let i = 0; i < exportFields.length; i++) {
        if (exportFields[i].checked) desiredFields.push(exportFields[i].name);
    }

    Speaker
        .find({})
        .exec()
        .then(speakers => {
            let csv = parseSpeakerData(desiredFields, speakers, conf);

            // In case we get sequential requests
            let filerand = _.random(0, 10000);
            let filename = `speakers${filerand}.csv`;
            fs.writeFile(filename, csv, (err) => {
                if (err) {
                    res.status(500).end();
                }
                else {
                    res.download(filename, 'speakersFinal.csv', (err) => {
                        if (!err) fs.unlink(filename);
                    });
                }
            });
        });

});

/** Flatten and format nested data for export */
function parseSessionData(desiredFields, sessions, speakers, defaultConf) {
    let exportJson = sessions.slice();
    let wantSpeakers = _.findIndex(desiredFields, field => field === 'speakers') >= 0;
    let wantSchedule = _.findIndex(desiredFields, field => field === 'statusTimeLocation') >= 0;
    let wantTags = _.findIndex(desiredFields, field => field === 'tags') >= 0;

    for (let i = 0; i < exportJson.length; i++) exportJson[i] = exportJson[i].toObject();

    // Speakers are just stored as reference ids on the session, get the full object for more info
    if (wantSpeakers) {
        for (let i = 0; i < sessions.length; i++) {
            if (sessions[i].speakers && sessions[i].speakers.mainPresenter) {
                let leadSpeaker = _.find(speakers, speaker => speaker._id.toString() === sessions[i].speakers.mainPresenter);
                if (leadSpeaker) {
                    exportJson[i].leadSpeakerFirst = leadSpeaker.nameFirst;
                    exportJson[i].leadSpeakerLast = leadSpeaker.nameLast;
                    if (_.findIndex(desiredFields, field => field === 'leadSpeakerFirst') < 0) {
                        desiredFields.push('leadSpeakerFirst');
                        desiredFields.push('leadSpeakerLast');
                    }
                }
            }
            if (sessions[i].speakers && sessions[i].speakers.coPresenters && sessions[i].speakers.coPresenters.length > 0) {
                for (let j = 0; j < sessions[i].speakers.coPresenters.length; j++) {
                    let coPres = _.find(speakers, speaker => speaker._id.toString() === sessions[i].speakers.coPresenters[j]);
                    if (coPres) {
                        exportJson[i][`coSpeakerFirst${j+1}`] = coPres.nameFirst;
                        exportJson[i][`coSpeakerLast${j+1}`] = coPres.nameLast;
                        desiredFields.push(`coSpeakerFirst${j+1}`);
                        desiredFields.push(`coSpeakerLast${j+1}`);
                    }
                }
            }
        }
        // Remove duplicates of copresenter fields
        desiredFields = _.uniq(desiredFields);
        _.remove(desiredFields, field => field === 'speakers');
        delete exportJson.speakers;
    }
    // Schedule timeslots are stored as reference ids, need more info
    if (wantSchedule) {
        for (let i = 0; i < sessions.length; i++) {
            if (sessions[i].statusTimeLocation && sessions[i].statusTimeLocation.length > 0) {
                let refTitle = sessions[i].toObject();
                let watchy = exportJson[i];
                for (let j = 0; j < sessions[i].statusTimeLocation.length; j++) {
                    let slotId = sessions[i].statusTimeLocation[j].timeSlot;
                    let confDay;
                    let slotWeLookinFo;
                    // Find the timeslot by id
                    for (let k = 0; k < defaultConf.days.length; k++) {
                        confDay = defaultConf.days[k].toObject();
                        slotWeLookinFo = _.find(confDay.timeSlots, slot => slot._id.toString() === slotId);
                        if (slotWeLookinFo) break;
                    }
                    if (!slotWeLookinFo) {
                        // This only happens when things are scheduled
                        continue;
                    }
                    if (j === 0) {
                        let refSess = _.clone(sessions[i].toObject());
                        exportJson[i].date = confDay.date;
                        exportJson[i].timeSlot = `${slotWeLookinFo.start}-${slotWeLookinFo.end}`;
                        exportJson[i].room = sessions[i].statusTimeLocation[j].room;
                        delete exportJson[i].statusTimeLocation;
                    } else {
                        // For sessions with multiple schedules, add two colomns for second room and timeslot
                        exportJson[i]["timeSlot 2"] = `${slotWeLookinFo.start}-${slotWeLookinFo.end}`;
                        exportJson[i]["room 2"] = sessions[i].statusTimeLocation[j].room;
                    }
                }
            }
        }
        desiredFields.push('date', 'timeSlot', 'room', 'timeSlot 2', 'room 2');
        _.remove(desiredFields, field => field === 'statusTimeLocation');
    }
    // Flatten tags into comma separated list of tag names that are checked
    if (wantTags) {
        for (let i = 0; i < sessions.length; i++) {
            let tagString = '';
            if (sessions[i].tags && sessions[i].tags.length > 0) {
                for (let j = 0; j < sessions[i].tags.length; j++) {
                    let tag = sessions[i].tags[j].toObject();
                    if (tag.checked) {
                        if (tagString === '') tagString += tag.name
                        else tagString += `, ${tag.name}`;
                    }
                }
            }
            exportJson[i].sessTags = tagString;
        }
        desiredFields.push('sessTags');
        _.remove(desiredFields, field => field === 'tags');
    }

    let csv = json2csv({ data: exportJson, fields: desiredFields });
    return csv;
}

/** Flatten and format nested data for export  */
function parseSpeakerData(desiredFields, speakers, conf) {
    let exportJson = speakers.slice();
    let wantCostsCovered = _.findIndex(desiredFields, field => field === 'costsCoveredByOrg') >= 0;
    let wantResponse = _.findIndex(desiredFields, field => field === 'responseForm') >= 0;
    let wantArrange = _.findIndex(desiredFields, field => field === 'arrangements') >= 0;
    let wantMealDates;
    let wantDietary;
    // Don't need these in speaker exports
    _.remove(desiredFields, field => field === 'sessions');


    // Flattened into main object
    if (wantResponse) {
        _.remove(desiredFields, field => field === 'responseForm');
        wantMealDates = _.findIndex(desiredFields, field => field === 'mealDates') >= 0;
        wantDietary = _.findIndex(desiredFields, field => field === 'dietaryNeeds') >= 0;
        _.remove(desiredFields, field => field === 'mealDates');
        _.remove(desiredFields, field => field === 'dietaryNeeds');
    }
    if (wantArrange) _.remove(desiredFields, field => field === 'arrangements');
    if (wantCostsCovered) desiredFields.push('costsCoveredByOrgn');

    for (let i = 0; i < speakers.length; i++) {
        if (wantCostsCovered) {
            let costsString = '';
            for (let j = 0; j < speakers[i].costsCoveredByOrg.length; j++) {
                let costCovered = speakers[i].costsCoveredByOrg[j].toObject();
                if (costCovered.covered) {
                    if (costsString === '') costsString += costCovered.name;
                    else costsString += `, ${costCovered.name}`;
                }
            }
            exportJson[i].costsCoveredByOrgn = costsString;
            _.remove(desiredFields, field => field === 'costsCoveredByOrg');
        }

        if (wantResponse) {
            // Flatten response form into main export
            let resForm = speakers[i].responseForm.toObject();
            for (let field in resForm) {
                if (resForm.hasOwnProperty(field)) {
                    exportJson[i][field] = resForm[field];
                }
            }

            if (wantMealDates) {
                // Flatten meal dates and dietary needs into main export as individual fields
                for (let j = 0; j < speakers[i].responseForm.mealDates.length; j++) {
                    let meal = speakers[i].responseForm.mealDates[j].toObject();
                    if (meal.attending) {
                        exportJson[i][meal.label] = 1;
                    }
                    if (!_.find(desiredFields, field => field === meal.label)) desiredFields.push(meal.label);
                }
            }
            if (wantDietary) {
                for (let j = 0; j < speakers[i].responseForm.dietaryNeeds.length; j++) {
                    let need = speakers[i].responseForm.dietaryNeeds[j].toObject();
                    if (need.checked) {
                        exportJson[i][need.need] = 1;
                    }
                    if (!_.find(desiredFields, field => field === need.need)) desiredFields.push(need.need);
                }
            }
        }

        if (wantArrange) {
            // Flatten arrangments form into main export
            let arranges = speakers[i].arrangements.toObject();
            // Select the current set of arrangements from list of historic arrangements
            let arrange = _.find(arranges, arrange => arrange.associatedConf === conf);
            for (let field in arrange) {
                if (arrange.hasOwnProperty(field)) {
                    exportJson[i][field] = arrange[field];
                }
            }
        }
    }

    let csv = json2csv({ data: exportJson, fields: desiredFields });
    return csv;
}

function updateActiveConfs(activeConf) {
    // If no active conf passed, make all confs inactive
    if (activeConf === null) activeConf = {title: ''};
    let savePromise = new Promise((resolve, reject) => {
        Conference
            .find({})
            .exec()
            .then(conferences => {
                let allSavesSuccessful = true;
                for (let i = 0; i < conferences.length; i++) {
                    let serverConf = conferences[i];
                    serverConf.lastActive = serverConf.title === activeConf.title;
                    serverConf.save(err => {
                        if (err) {
                            allSavesSuccessful = false;
                        }
                    });
                }
                resolve(allSavesSuccessful);
            });
    });
    return savePromise;
}

function updateDefaultConfs(defaultConf) {
    // If no active conf passed, make all confs inactive
    if (defaultConf === null) defaultConf = {title: ''};
    let savePromise = new Promise((resolve, reject) => {
        Conference
            .find({})
            .exec()
            .then(conferences => {
                let allSavesSuccessful = true;
                for (let i = 0; i < conferences.length; i++) {
                    let serverConf = conferences[i];
                    serverConf.defaultConf = serverConf.title === defaultConf.title;
                    serverConf.save(err => {
                        if (err) {
                            allSavesSuccessful = false;
                        }
                    });
                }
                resolve(allSavesSuccessful);
            });
    });
    return savePromise;
}

function updateSpeakerFromImport(req, res, csvData, counter, emailIndex, i) {
    Speaker
        .find({"email": csvData[i][emailIndex]})
        .exec()
        .then(function(speaker) {
            var proObject = speaker[0];
            if (proObject.arrangements.length == 0) {
                proObject.arrangements[0] = {};
            }

            for (var j = 0; j < csvData[i].length; j++) {
                var currentProperty = csvData[0][j];
                if (responseFromProps.indexOf(currentProperty) > -1) {
                    if (currentProperty != "dateDeparture" && currentProperty != "dateArrival") {
                        if (csvData[i][j] == "FALSE") {
                            proObject["responseForm"][currentProperty] = false;
                        } else if (csvData[i][j] == "") {
                            proObject["responseForm"][currentProperty] = "";
                        } else {
                            proObject["responseForm"][currentProperty] = csvData[i][j];
                        }
                    }
                } else if (mealsArray.indexOf(currentProperty) > -1) {
                    var index = mealsArray.indexOf(currentProperty);
                    
                    var mealObject = {
                        "date": mealsObjectsArray[index]["date"],
                        "meal": mealsObjectsArray[index]["meal"],
                        "label": mealsArray[index]
                    }

                    if (csvData[i][j] == "FALSE" || csvData[i][j] == "" || csvData[i][j] == 0) {
                        mealObject["attending"] = false;
                    } else {
                        mealObject["attending"] = true;
                    }

                    var mealInMeals = false;
                    for (var meal in proObject.responseForm.mealDates) {
                        if (proObject.responseForm.mealDates[meal].label == mealObject.label) {
                            proObject.responseForm.mealDates[meal] = mealObject;
                            mealInMeals = true;
                            break;
                        }
                    }
                    if (!mealInMeals) {
                        proObject.responseForm.mealDates.push(mealObject);
                    }

                } else if (dietaryNeedsArray.indexOf(currentProperty) > -1) {
                    var dietaryObject = {
                        "need": currentProperty
                    }
                    
                    if (csvData[i][j] == "FALSE" || csvData[i][j] == "" || csvData[i][j] == 0) {
                        dietaryObject["checked"] = false;
                    } else {
                        dietaryObject["checked"] = true;
                    }   
                    
                    var needInNeeds = false;
                    for (var need in proObject.responseForm.dietaryNeeds) {
                        if (proObject.responseForm.dietaryNeeds[need].need == dietaryObject.need) {
                            proObject.responseForm.dietaryNeeds[need] = dietaryObject;
                            needInNeeds = true;
                            break;
                        }
                    }
                    if (!needInNeeds) {
                        proObject.responseForm.dietaryNeeds.push(dietaryObject);
                    }

                    if (currentProperty == "Other" && csvData[i][j] == 0) {
                        proObject.responseForm.otherDietary = "";
                    }
                } else if (arrangementsArray.indexOf(currentProperty) > -1) {
                    proObject.arrangements[0][currentProperty] = csvData[i][j];
                    if (currentProperty == "arrivalDate" && csvData[i][j] != "") {
                        proObject.responseForm.dateArrival = csvData[i][j];
                    } else if (currentProperty == "departDate" && csvData[i][j] != "") {
                        proObject.responseForm.dateDeparture = csvData[i][j];
                    }
                } else if (currentProperty == "costsCoveredByOrgn") {
                    if (csvData[i][j] == "") {
                        proObject.costsCoveredByOrg = [{ "name" : "travel", "covered" : false }, { "name" : "lodging", "covered" : false }];
                    } else {
                        var coveredItems = csvData[i][j].split(",");
                        if (coveredItems.length == 2) {
                            proObject.costsCoveredByOrg = [{ "name": "travel", "covered": true }, { "name" : "lodging", "covered": true}];
                        } else {
                            if (coveredItems[0].trim() == "travel") {
                                proObject.costsCoveredByOrg = [{ "name": "travel", "covered": true }, { "name" : "lodging", "covered": false}];
                            } else if (coveredItems[0].trim() == "lodging") {
                                proObject.costsCoveredByOrg = [{ "name": "travel", "covered": false }, { "name" : "lodging", "covered": true}];
                            }
                        } 
                    }
                } else {
                    if (csvData[i][j] == "FALSE") {
                        proObject[currentProperty] = false;
                    } else if (csvData[i][j] == "") {
                        proObject[currentProperty] = "";
                    } else {
                        proObject[currentProperty] = csvData[i][j];
                    }
                }
            }

            Speaker
                .update(
                    {"email": csvData[i][emailIndex]},
                    {"$set": proObject})
                .exec()
                .then(function() {
                    if (counter == csvData.length - 1) {
                        res.status(200);
                        res.end();
                    }
                });
        })
}

module.exports = router;