'use strict';

var router = require('express').Router();
const Speaker = require('../models/speaker');
const Conference = require('../models/conference');
const Session = require('../models/session');
const _ = require('lodash');

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
    updateActiveConfs(null).then(saveSuccess => {
        if (saveSuccess) {
            let newConf = new Conference();
            newConf.lastActive = true;
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

router.post('/changetimeslot', (req, res) => {
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
            serverConf.dateRange = conf.dateRange;
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
    Speaker
        .findOneAndUpdate({email: speaker.email}, speaker, {upsert:true})
        .exec()
        .then( (err, user) => {
            if (err) {
                return res.status(500).json({ alert: 'failed' });
            }
            return res.status(200).json({ alert: 'saved' });
    })

    // Existing speakers have an id
    // if (speaker._id) {
    //     Speaker
    //         .findById(speaker._id)
    //         .exec()
    //         .then(serverSpeaker => {
    //             if (serverSpeaker === null) {
    //                 console.log('Speaker not found');
    //                 res.status(500).json({message: 'Speaker not found'});
    //             } else {
    //                 console.log('found existing speaker');
    //                 _.merge(serverSpeaker, speaker);
    //                 if (serverSpeaker.costsCoveredByOrg !== speaker.costsCoveredByOrg) {
    //                     serverSpeaker.costsCoveredByOrg = speaker.costsCoveredByOrg;
    //                     serverSpeaker.markModified('costsCoveredByOrg');
    //                 }
    //                 serverSpeaker.save(err => {
    //                     if (err) {
    //                         console.log('save error but found speaker');
    //                         console.log(err);
    //                         res.status(500).json({message: 'Speaker save error'});
    //                     } else res.status(200).json(serverSpeaker);
    //                 });
    //             }
    //         });
    // } else {
    //     // TODO this happens when Brooke makes a speaker herself,
    //     // do we need to generate an account for the folks that
    //     // need this done for them?
    //     let newSpeaker = new Speaker({
    //         admin: false,
    //         password: 'password',
    //         status: 'pending',
    //         statusNotification: false,
    //         mediaWilling: false,
    //         costsCoveredByOrg: [],
    //         hasPresentedAtCCAWInPast2years: false,
    //     });
    //     _.merge(newSpeaker, speaker);
    //     newSpeaker.save(err => {
    //         if (err) {
    //             console.log('save error and didnt find speaker');
    //             console.log(err);
    //             res.status(500).json({message: 'Speaker save error'});
    //         } else res.status(200).json(newSpeaker);
    //     });
    // }
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
                        console.log('conf saved');
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