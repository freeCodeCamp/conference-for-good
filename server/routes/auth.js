'use strict';

const router = require('express').Router();
const passport = require('passport');
const Speaker = require('../models/speaker');
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
     user: process.env.EMAIL,
     pass: process.env.PASSWORD
    }
});

function generateRandomPassword() {
    let chars = "abcdefghijklmnopqrstuvwxyz123456789";
    let newPass = '';

    for (var i = 0; i < 10; i++){
        newPass += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return newPass;
}

router.get('/checkSession', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({user: req.user});
    } else {
        res.status(200).json({user: null});
    }
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local-login', (err, user, info) => {
        if (err) return res.status(500).json({alert: err});
        if (!user) return res.status(401).json({alert: info});
        return res.status(200).json(user);
    })(req, res, next);
});

router.post('/signup', (req, res, next) => {
    // If lead presenter signs up, generate a random password and email them info
    if (req.body.leadPres) {
        let formData = req.body.formData;
        console.log('data', formData);
        req.body.email = formData.email;
        req.body.firstName = formData.firstName;
        req.body.lastName = formData.lastName;
        req.body.password = generateRandomPassword();

        let leadPresName = `${req.body.leadPres.nameFirst} ${req.body.leadPres.nameLast}`

        var mailOptions = {
            from: 'Jennifer Bland <ratracegrad@gmail.com>', // TODO update with CCAW sender address
            to: req.body.email,
            subject: `Copresenter with ${leadPresName} at CCAW`, // Subject line
            html: `
                <div>You've been signed up as a copresenter for a presentation at Conference for Crimes Against Women by ${leadPresName}.</div>
                <div>Please <a href="http://localhost:3000/login">log in here</a> to view and update your information with the following: </div>
                <div>Your username: ${req.body.email}</div>
                <div>Your password: ${req.body.password}</div>
            ` // TODO change to URL for deployment
        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log('email not sent');
            } else {
                console.log('email sent');
            }
        });
    }
    passport.authenticate('local-signup', (err, user, info) => {
        if (err) return res.status(500).json({alert: err});
        if (!user) {
            if (info === 'email taken') {
                return res.status(409).json({alert: info});
            } else return res.status(400).json({alert: info});
        }
        return res.status(200).json({alert: info, userId: user._id});
    })(req, res, next);
});

/*router.post('/signupforcopres', (req, res) => {
    let leadPres = req.body.leadPres;
    let signupData = req.body.signupData;
    signupData.password = generateRandomPassword();
    

});*/

router.get('/logout', (req, res) => {
    req.logout();
    res.end();
});

router.post('/changePassword', (req, res) => {
    let formData = req.body.formData;
    let userId = req.body.userId;

    Speaker.findById(userId, (err, user) => {
        if (err) {
            return res.status(400).json({ alert: 'user not found' });
        } else {
            user.password = user.generateHash(formData.password);
            user.save( err => {
                if (err) {
                    return res.status(400).json({ alert: 'not saved' });
                } else {
                    return res.status(200).json({ alert: 'password changed' });
                }
            });
        }
    });
});

router.post('/forgotpassword', (req, res) => {
    let formData = req.body.formData;
    let newPass = generateRandomPassword();

    Speaker.findOne({email: formData.email}, function (err, user) {
        if (err) {
            return res.status(404).json({alert: 'email not found'})
        }
        user.password = user.generateHash(newPass);
        user.save(function(err) {
            if (err){
                return res.status(400).json({alert: 'password not saved'});
            } else {
                var mailOptions = {
                    from: 'Jennifer Bland <ratracegrad@gmail.com>', // TODO update with CCAW sender address
                    to: formData.email,
                    subject: 'New CCAW password.', // Subject line
                    html: '<b>Your new password is ' + newPass + '.  </b><a href="http://localhost:3000/login">Login here.</a>' // TODO change to URL for deployment
                };

                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        return res.status(400).json({alert: 'not sent'});
                    }else{
                        return res.status(200).json({alert: 'password sent'});
                    }
                });
            }
        });
    });

    return newPass;

});

router.get('/addadmin/:id', (req, res) => {
    let id = req.params.id;
    Speaker.findById(id, (err, user) => {
        if (err) { return res.status(404).json({ alert: 'not found' }); }
        user.admin = true;
        user.save( err => {
            if (err) {  return res.status(400).json({ alert: 'not saved' }); }
            return res.status(200).json({ alert: 'saved' });
        });
    });
});

router.get('/deleteadmin/:id', (req, res) => {
    let id = req.params.id;
    Speaker.findById(id, (err, user) => {
        if (err) { return res.status(404).json({ alert: 'not found' }); }
        user.admin = false;
        user.save( err => {
            if (err) {  return res.status(400).json({ alert: 'not saved' }); }
            return res.status(200).json({ alert: 'saved' });
        });
    });
});


module.exports = router;