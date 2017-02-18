'use strict';

/** Get all Modules we will need **/
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compress = require('compression');
const _ = require('lodash');
const cors = require('cors');
const passport = require('passport');
const expressSession = require('express-session');
require('./config/passport')(passport);

const app = express();

/** Define Variables  **/
let production = process.env.NODE_ENV === 'production';
let port = process.env.PORT || 3000;

// Load local environment variables in development
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').load();
}

/*  Configure Connection to MongoDB  **/
const mongoose = require('mongoose');
// TODO we need to change the below to use the mlab database used with heroku
let mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/ccaw-app';
mongoose.connect(mongoURI);

/** True = get response details on served node modules **/
let verboseLogging = false;

/**  Configure middleware **/
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev', {
  skip: (req, res) => {
    if (verboseLogging) return false;
    else return req.baseUrl === '/scripts';
  }
}));
if (production) {
  // Production server serves frontend files
  app.use(compress());
  app.use( express.static( path.join(__dirname, '../dist') ));
  app.use('/scripts', express.static( path.join(__dirname, '../node_modules') ));
  app.use('/app', express.static( path.join(__dirname, '../dist/app') ));
  app.use('/uploads', express.static( path.join(__dirname, './uploads') ));
} else {
  // In development, livereload server provides front end, backend is just api, need CORS
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
}

/** Configure Passport **/
app.use(expressSession({
  secret: 'cookie_secret',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

/** Get Routes  **/
app.use('/', require('./routes'));

/**  Start Server  **/
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});