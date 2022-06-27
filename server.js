'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const session = require('express-session');
const passport = require('passport');
const app = express();
const ObjectID = require('mongodb').ObjectID;

// setting up pug
app.set("view engine", "pug");
app.use("views", express.static(process.cwd() + "/views"));

// setting up session and passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());


// fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


myDB(async client => {
  const myDataBase = await client.db('database').collection('users');
  const LocalStrategy = require('passport-local');
  // Default route
  app.route('/').get((req, res) => {
    //The response to render the Pug template
    res.render(process.cwd() + '/views/pug/index', {
      title: 'Connected to Database',
      saywoot: 'There are 86400 seconds in a day, and it goes fast fast fast.',
      message: 'Please login'
    });
  });
  
  
  // Serialization and deserialization here...
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      
      done(null, doc._id);
    });
  });
  // instantiate middleware LocalStrategy
  /* Defining the process to use when we try to authenticate someone locally. 
 First, it tries to find a user in the app database with the username entered, then it checks for the password to match, then finally, if no errors have popped up that we checked for, like an incorrect password, the user's object is returned and they are authenticated. */
  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log('User '+ username +' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (password !== user.password) { return done(null, false); }
        return done(null, user);
      });
    }
  ));


// Handle myDB errors
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});

