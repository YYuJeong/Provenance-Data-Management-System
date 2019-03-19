var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');


var searchPage =  require('./routes/search/searchPage');
var viewPage = require('./routes/viewPage');
var addPage = require('./routes/addPage');

var searchAgent =  require('./routes/search/searchAgent');
var searchAgentResult = require('./routes/search/searchAgentResult');

var searchEntity =  require('./routes/search/searchEntity');
var searchEntityResult = require('./routes/search/searchEntityResult');

var searchAgentAttribute =  require('./routes/search/searchAgentAttribute');
var searchAgentAttributeResult = require('./routes/search/searchAgentAttributeResult');

var searchEntityAttribute =  require('./routes/search/searchEntityAttribute');
var searchEntityAttributeResult = require('./routes/search/searchEntityAttributeResult');

var searchAgentPeriod =  require('./routes/search/searchAgentPeriod');
var searchAgentPeriodResult =  require('./routes/search/searchAgentPeriodResult');

var searchEntityPeriod =  require('./routes/search/searchEntityPeriod');
var searchEntityPeriodResult =  require('./routes/search/searchEntityPeriodResult');

var searchAgentEntityPeriod =  require('./routes/search/searchAgentEntityPeriod');
var searchAgentEntityPeriodResult =  require('./routes/search/searchAgentEntityPeriodResult');

var ejs = require('ejs');
var app = express();

var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'wowhi223'));
var session = driver.session();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/search/searchPage', searchPage);
app.use('/viewPage', viewPage);
app.use('/addPage', addPage);

app.use('/search/searchAgent', searchAgent);
app.use('/search/searchAgentResult', searchAgentResult);

app.use('/search/searchEntity', searchEntity);
app.use('/search/searchEntityResult', searchEntityResult);

app.use('/search/searchAgentAttribute', searchAgentAttribute);
app.use('/search/searchAgentAttributeResult', searchAgentAttributeResult);

app.use('/search/searchEntityAttribute', searchEntityAttribute);
app.use('/search/searchEntityAttributeResult', searchEntityAttributeResult);

app.use('/search/searchAgentPeriod', searchAgentPeriod);
app.use('/search/searchAgentPeriodResult', searchAgentPeriodResult);

app.use('/search/searchEntityPeriod', searchEntityPeriod);
app.use('/search/searchEntityPeriodResult', searchEntityPeriodResult);

app.use('/search/searchAgentEntityPeriod', searchAgentEntityPeriod);
app.use('/search/searchAgentEntityPeriodResult', searchAgentEntityPeriodResult);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;