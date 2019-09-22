var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'wowhi223'));
var session = driver.session();

var path = require('path');
var logger = require('morgan');;

router.use(logger('dev'));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
//router.use(express.static(path.join(__dirname, 'public')));

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('users.ejs');
});

module.exports = router;