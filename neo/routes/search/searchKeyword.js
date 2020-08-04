var express = require('express');
var router = express.Router();
var keyResult = require('../keyResult');
var session_value = require('../session');
var graphs = "";

router.get('/', function (req, res, next) {
    let result = keyResult.getKeywordResult();
    keyResult.setKeywordResult("");
    res.render('search/searchKeyword.ejs', {esession: req.session, data:result});
});

module.exports = router;