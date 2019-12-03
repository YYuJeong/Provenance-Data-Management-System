var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');

var esession = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var contactRouter = require('./routes/contact');

var viewPage = require('./routes/viewPage');
var addPage = require('./routes/addPage');
var searchPage =  require('./routes/search/searchPage');

var searchKeyword =  require('./routes/search/searchKeyword');
var searchKeywordResult = require('./routes/search/searchKeywordResult')

var searchConditionPage = require('./routes/search/searchConditionPage');

var searchData = require('./routes/search/searchData');
var searchDataResult = require('./routes/search/searchDataResult');

var searchName = require('./routes/search/searchName');
var searchNameResult = require('./routes/search/searchNameResult');

var searchPeriod = require('./routes/search/searchPeriod');
var searchPeriodResult = require('./routes/search/searchPeriodResult');

var modifyData = require('./routes/data/modifyData');
var modifyDataResult = require('./routes/data/modifyDataResult');
var modifyDataPage = require('./routes/data/modifyDataPage');

var deleteData = require('./routes/data/deleteData');
var deleteDataResult = require('./routes/data/deleteDataResult');

var fileuploadRouter = require('./routes/data/uploadData');


var ejs = require('ejs');
var app = express();

var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'wowhi223'));
var session = driver.session();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/contact', contactRouter);

app.use('/viewPage', viewPage);
app.use('/addPage', addPage);
app.use('/search/searchPage', searchPage);

app.use('/search/searchKeyword', searchKeyword);
app.use('/search/searchKeywordResult', searchKeywordResult);

app.use('/search/searchConditionPage', searchConditionPage);

app.use('/search/searchData', searchData);
app.use('/search/searchDataResult', searchDataResult);

app.use('/search/searchName', searchName);
app.use('/search/searchNameResult', searchNameResult);

app.use('/search/searchPeriod', searchPeriod);
app.use('/search/searchPeriodResult', searchPeriodResult);

app.use('/data/modifyData', modifyData);
app.use('/data/modifyDataResult', modifyDataResult);
app.use('/data/modifyDataPage', modifyDataPage);

app.use('/data/deleteData', deleteData);
app.use('/data/deleteDataResult', deleteDataResult);

app.use('/data/uploadData', fileuploadRouter);
//app.use('/upload', express.static('uploads'));

app.set('scripts', express.static(path.join(__dirname , "scripts")))



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

/*app.use(esession({
  key: 'log',
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24000 * 60 * 60 // 쿠키 유효기간 24시간
  }
}));*/

app.use(esession({                                             
  secret:"asdfasffdas",
  resave:false,
  saveUninitialized:true,
}));



module.exports = app;