var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var contactRouter = require('./routes/contact');
var adminRouter = require('./routes/admin');

var viewPage = require('./routes/viewPage');
var addPage = require('./routes/addPage');

var searchPage =  require('./routes/search/searchPage');
var searchPersonPage =  require('./routes/search/searchPersonPage');
var searchDataPage =  require('./routes/search/searchDataPage');
var searchDataPersonPage =  require('./routes/search/searchDataPersonPage');

var searchKeywordPage =  require('./routes/search/searchKeywordPage');
var searchKeywordResult = require('./routes/search/searchKeyword/searchKeywordResult')

var searchAgent =  require('./routes/search/searchPerson/searchAgent');
var searchAgentResult = require('./routes/search/searchPerson/searchAgentResult');

var searchEntity =  require('./routes/search/searchData/searchEntity');
var searchEntityResult = require('./routes/search/searchData/searchEntityResult');

var searchAgentAttribute =  require('./routes/search/searchPerson/searchAgentAttribute');
var searchAgentAttributeResult = require('./routes/search/searchPerson/searchAgentAttributeResult');

var searchEntityAttribute =  require('./routes/search/searchData/searchEntityAttribute');
var searchEntityAttributeResult = require('./routes/search/searchData/searchEntityAttributeResult');

var searchAgentPeriod =  require('./routes/search/searchPerson/searchAgentPeriod');
var searchAgentPeriodResult =  require('./routes/search/searchPerson/searchAgentPeriodResult');

var searchEntityPeriod =  require('./routes/search/searchData/searchEntityPeriod');
var searchEntityPeriodResult =  require('./routes/search/searchData/searchEntityPeriodResult');

var searchAgentEntityPeriod =  require('./routes/search/searchDataPerson/searchAgentEntityPeriod');
var searchAgentEntityPeriodResult =  require('./routes/search/searchDataPerson/searchAgentEntityPeriodResult');

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
app.use('/contact', contactRouter);
app.use('/admin', adminRouter);

app.use('/viewPage', viewPage);
app.use('/addPage', addPage);
app.use('/search/searchPage', searchPage);
app.use('/search/searchPersonPage', searchPersonPage);
app.use('/search/searchDataPage', searchDataPage);
app.use('/search/searchDataPersonPage', searchDataPersonPage);

app.use('/search/searchKeywordPage', searchKeywordPage);
app.use('/search/searchKeyword/searchKeywordResult', searchKeywordResult);

app.use('/search/searchPerson/searchAgent', searchAgent);
app.use('/search/searchPerson/searchAgentResult', searchAgentResult);

app.use('/search/searchData/searchEntity', searchEntity);
app.use('/search/searchData/searchEntityResult', searchEntityResult);

app.use('/search/searchPerson/searchAgentAttribute', searchAgentAttribute);
app.use('/search/searchPerson/searchAgentAttributeResult', searchAgentAttributeResult);

app.use('/search/searchData/searchEntityAttribute', searchEntityAttribute);
app.use('/search/searchData/searchEntityAttributeResult', searchEntityAttributeResult);

app.use('/search/searchPerson/searchAgentPeriod', searchAgentPeriod);
app.use('/search/searchPerson/searchAgentPeriodResult', searchAgentPeriodResult);

app.use('/search/searchData/searchEntityPeriod', searchEntityPeriod);
app.use('/search/searchData/searchEntityPeriodResult', searchEntityPeriodResult);

app.use('/search/searchDataPerson/searchAgentEntityPeriod', searchAgentEntityPeriod);
app.use('/search/searchDataPerson/searchAgentEntityPeriodResult', searchAgentEntityPeriodResult);


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