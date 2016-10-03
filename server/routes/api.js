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
            let csv = json2csv({ data: sessions, fields: desiredFields });
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