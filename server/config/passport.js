'use strict';

var LocalStrategy   = require('passport-local').Strategy;
var Speaker            = require('../models/speaker');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(id, done) {
        Speaker.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, email, password, done) {
            process.nextTick(function() {

                Speaker.findOne({ 'email' :  email }, function(err, user) {
                    if (err)
                        return done(err, null, err);

                    if (user) {
                        return done(null, false, 'email taken');
                    } else {
                        var newSpeaker       = new Speaker({
                            // Signup fields
                            admin: false,
                            email: email,
                            nameFirst: req.body.firstName,
                            nameLast: req.body.lastName,

                            // Fields to initialize
                            status: 'pending',
                            adminNotes: '',
                            statusNotification: false,
                            mediaWilling: false,
                            costsCoveredByOrg: [
                                {
                                name: 'travel',
                                covered: false
                                },
                                {
                                name: 'lodging',
                                covered: false
                                }
                            ],
                            hasPresentedAtCCAWInPast2years: false
                        });
                        newSpeaker.password  = newSpeaker.generateHash(password);
                        newSpeaker.save(function(err) {
                            if (err) {
                                return done(err, null, err);
                            } else {
                                return done(null, newSpeaker, 'user created successfully');
                            }

                        });
                    }

                });

            });
        }
    ));

    passport.use('local-login', new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, email, password, done) {
            Speaker.findOne({ 'email' :  email }, function(err, user) {
                if (err){
                    return done(err);
                }

                if (!user) {
                    return done(null, false, 'no user found');
                }

                if (!user.validatePassword(password, user.password)) {
                    return done(null, false, 'wrong password');
                }
                return done(null, user, 'logged in successfully');
            });

        }
    ));

};