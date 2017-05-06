var express = require('express');
var cors = require('cors');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var authenticate = require('./authenticate');

var config = require('./config');

dbURI = config.mongoUrl;

if (process.env.VCAP_SERVICES) {
  var env = JSON.parse(process.env.VCAP_SERVICES);
  if (env.mongolab) { // for mongolabs
    var ml = env.mongolab;
    dbURI = ml[0].credentials.uri;
  }
}

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log("Connected correctly to server");
});
db.on('connected', function() {
    console.log('connected!');
});
db.on('reconnected', function () {
    console.log('reconnected');
});
db.on('disconnected', function() {
    console.log('disconnected');
    console.log('dbURI is: '+dbURI);
    mongoose.connect(dbURI, {server:{auto_reconnect:true, socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 }}, replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } }});
  });

console.log('dbURI is: '+dbURI);

mongoose.connect(dbURI, {server:{auto_reconnect:true}});

var routes = require('./routes/index');
var users = require('./routes/users');
var expenseRouter = require('./routes/expenseRouter');
var timesheetRouter = require('./routes/timesheetRouter');
var statisticRouter = require('./routes/statisticRouter');

var app = express();

app.use(cors());


// view engine setup
app.use(express.static(path.join(__dirname, 'client')));
//app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// passport config
app.use(passport.initialize());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/expenses', expenseRouter);
app.use('/timesheets', timesheetRouter);
app.use('/statistics', statisticRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// CORS
app.use(function (req, res, next) {

    //headers that enable corse
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});

//serve static file (index.html, images, css)
//app.use(express.static(__dirname + '/client'));

module.exports = app;
