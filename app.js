global.__basedir = __dirname
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var dotenv = require('dotenv')
dotenv.config()

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var wpRouter = require('./routes/receivedWP');
var authorizeRouter = require('./routes/authorize');
var gitpushRouter = require('./routes/pushgit')

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session(
    { secret: '0dc529ba-5051-4cd6-8b67-c9a901bb8bdf',
      resave: false,
      saveUninitialized: false 
    }));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/receivedWP', wpRouter);
app.use('/authorize', authorizeRouter);
app.use('/gitpush', gitpushRouter)

module.exports = app;
