'use strict';

var router = require('express').Router();
const Speaker = require('../models/speaker');
const Conference = require('../models/conference');
const Session = require('../models/session');
const _ = require('lodash');
const multer = require('multer');
const path = require('path');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '~/Documents')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now());
    }
});
var upload = multer({ storage: storage, limits: { fileSize: 2000000 } });

const json2csv = require('json2csv');
const fs = require('fs');

router.post('/upload', upload.any(), (req, res) => {
    console.log('upload');
    var originalName = req.body.originalname;
    var newName = req.body.filename;

    res.json({
        originalName: originalName,
        filename: newName
    });
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
    console.log('conf:', conf);
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
            newConf.dateRange = {
                start: conf.dateRange.start,
                end: conf.dateRange.end
            };
            newConf.save(err => {
                if (err) {
                    console.log(err);
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

router.post('/updateconference', (req, res) => {
    let currentTitle = req.body.currentTitle;
    let conf = req.body.conference;

    Conference
        .findOne({ title: currentTitle })
        .exec()
        .then(serverConf => {
            serverConf.title = conf.title;
            serverConf.save(err => {
                if (err) res.status(500).json({message: 'Conference save error'});
                else res.status(200).json({message: 'Conference saved'});
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

router.post('/updatespeaker', (req, res) => {
    let speaker = req.body;

    // TODO When Brooke makes a speaker herself
    //     do we need to generate an account for the folks that
    //     need this done for them?
    Speaker
        .findOneAndUpdate({email: speaker.email}, speaker, {upsert:true, new: true}, (err, user) => {
            if (err) {
                console.log('speaker save error', err);
                return res.status(500).json({ alert: 'failed' });
            }
            console.log('user updated');
            console.log(user);
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
                    console.log('Session not found');
                    res.status(500).json({message: 'Session not found'});
                } else {
                    _.merge(serverSession, session);
                    serverSession.save(err => {
                        if (err) {
                            console.log(err);
                            res.status(500).json({message: 'Session save error'});
                        } else res.status(200).json(serverSession);
                    });
                }
            });
    } else {
        let newSession = new Session();
        _.merge(newSession, session);
        newSession.save(err => {
            if (err) {
                console.log(err);
                res.status(500).json({message: 'Session save error'});
            } else res.status(200).json(newSession);
        });
    }
});

router.post('/updatesessionspeakers', (req, res) => {
    let session = req.body;

    Session
        .findById(session._id)
        .exec()
        .then(serverSession => {
            if (serverSession === null) {
                console.log('Session not found');
                res.status(500).json({message: 'Session not found'});
            } else {
                console.log('found existing session');
                serverSession.speakers = session.speakers;
                serverSession.save(err => {
                    if (err) {
                        console.log(err);
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
                console.log('Session not found');
                res.status(500).json({message: 'Session not found'});
            } else {
                console.log('found existing session');
                serverSession.statusTimeLocation = session.statusTimeLocation;
                serverSession.save(err => {
                    if (err) {
                        console.log(err);
                        res.status(500).json({message: 'Session save error'});
                    } else res.status(200).json(serverSession);
                });
            }
        });
});

/** Exporting API */
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
                                    console.log(err);
                                    res.status(500).end();
                                }
                                else {
                                    console.log('file saved');
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
    let exportFields = req.body;
    let desiredFields = [];
    for (let i = 0; i < exportFields.length; i++) {
        if (exportFields[i].checked) desiredFields.push(exportFields[i].name);
    }

    Speaker
        .find({})
        .exec()
        .then(speakers => {
            let csv = parseSpeakerData(desiredFields, speakers);

            // In case we get sequential requests
            let filerand = _.random(0, 10000);
            let filename = `speakers${filerand}.csv`;
            fs.writeFile(filename, csv, (err) => {
                if (err) {
                    console.log(err);
                    res.status(500).end();
                }
                else {
                    console.log('file saved');
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
                    exportJson[i][`coSpeakerFirst${j+1}`] = coPres.nameFirst;
                    exportJson[i][`coSpeakerLast${j+1}`] = coPres.nameLast;
                    desiredFields.push(`coSpeakerFirst${j+1}`);
                    desiredFields.push(`coSpeakerLast${j+1}`);
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
                        exportJson[i].date = confDay.date;
                        exportJson[i].timeSlot = `${slotWeLookinFo.start}-${slotWeLookinFo.end}`;
                        exportJson[i].room = sessions[i].statusTimeLocation[j].room;
                        delete exportJson[i].statusTimeLocation;
                    } else {
                        // For sessions with multiple schedules, split into dupes with other sched info
                        let dupeSess = _.clone(sessions[i]);
                        dupeSess.date = confDay.date;
                        dupeSess.timeSlot = `${slotWeLookinFo.start}-${slotWeLookinFo.end}`;
                        dupeSess.room = sessions[i].statusTimeLocation[j].room;
                        delete dupeSess.statusTimeLocation;
                        exportJson.splice(i+1, 0, dupeSess);
                    }
                }
            }
        }
        desiredFields.push('date', 'timeSlot', 'room');
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
function parseSpeakerData(desiredFields, speakers) {
    let exportJson = speakers.slice();

    let csv = json2csv({ data: speakers, fields: desiredFields });
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
                            console.log(err);
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
                            console.log(err);
                            allSavesSuccessful = false;
                        }
                    });
                }
                resolve(allSavesSuccessful);
            });
    });
    return savePromise;
}

module.exports = router;