var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');


var express = require('express');
var router = express.Router();

var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'wowhi223'));
var session = driver.session();
var session_value = require('../session');

router.get('/', function(req, res, next) {
    res.render('search/searchKeywordResult.ejs', {esession: session_value.getSession()});
  });
  
module.exports = router;