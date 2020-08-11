var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
//var neo4j = require('neo4j-driver').v1;
var neo4j = require('neo4j-driver');
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'wowhi223'));
var session = driver.session();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session_value = require('../session');
var fsmResult = require('../fsmResult');

router.get('/', function(req, res, next) {
  let fsm_result = fsmResult.getfsm_result();
  fsmResult.setfsm_result("");
  res.render('data/analyzeFreqResult.ejs', {esession: session_value.getSession(), fsmdata:fsm_result});
});


module.exports = router;