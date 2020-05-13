var express = require('express');
var router = express.Router();
var session_value = require('./session');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.render("users.ejs", {
        esession: req.session
    });
});

module.exports = router;