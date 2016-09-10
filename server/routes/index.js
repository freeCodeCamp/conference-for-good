'use strict';

const path = require('path');
var router = require('express').Router();

router.use('/api', require('./api'));
router.use('/auth', require('./auth'));

/** Pass all non-api or non-auth routes to front-end router for handling **/
router.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../dist', 'index.html'));
});

module.exports = router;