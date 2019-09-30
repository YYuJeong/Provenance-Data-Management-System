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
var logoutRouter = require('./routes/logout');

var viewPage = require('./routes/viewPage');
var addPage = require('./routes/addPage');

var searchPage =  require('./routes/search/searchPage');

var searchKeywordPage =  require('./routes/search/searchKeywordPage');
var searchKeywordResult = require('./routes/search/searchKeyword/searchKeywordResult')

var searchConditionPage = require('./routes/search/searchConditionPage');

var searchData = require('./routes/newSearch/searchData');
var searchDataResult = require('./routes/newSearch/searchDataResult');

var searchName = require('./routes/newSearch/searchName');
var searchNameResult = require('./routes/newSearch/searchNameResult');

var searchPeriod = require('./routes/newSearch/searchPeriod');
var searchPeriodResult = require('./routes/newSearch/searchPeriodResult');

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
app.use('/logout', logoutRouter);

app.use('/viewPage', viewPage);
app.use('/addPage', addPage);
app.use('/search/searchPage', searchPage);

app.use('/search/searchKeywordPage', searchKeywordPage);
app.use('/search/searchKeyword/searchKeywordResult', searchKeywordResult);

app.use('/search/searchConditionPage', searchConditionPage);

app.use('/newSearch/searchData', searchData);
app.use('/newSearch/searchDataResult', searchDataResult);

app.use('/newSearch/searchName', searchName);
app.use('/newSearch/searchNameResult', searchNameResult);

app.use('/newSearch/searchPeriod', searchPeriod);
app.use('/newSearch/searchPeriodResult', searchPeriodResult);

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