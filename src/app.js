/**----------------------------------------------------------------------
 * SCRAPER.JS
 *
 * @author:  Darin Dieckhoff
 * Date:    January 10, 2017
 * For:     Project 7, Build a Twitter Interface
 *
 * Use Node.js and Express to retrieve information from twitter account.
 * Use Twitter's REST API to communicate with Twitter, retrieve JSON data,
 * and display the results using an HTML template (jade). 
 *
 * This application requires a keys.js stored in src/public/js directory
 * that stores the access keys to log onto 
 * a twitter account: The format of the file is as follows:
 *    var accessKeys = {
 *        consumer_key: 'your consumer key',
 *        consumer_secret: 'your consumer secret',
 *        access_token :  'your access token',
 *        access_secret:  'your access secret',
 *    };
 *
 *    module.exports = accessKeys;
 */

"use strict";

var express = require('express');
var Twit = require('twit');
var moment = require('moment');
var bodyParser = require('body-parser');
var accessKeys = require('./public/js/config.js');

var app = express();

var T = new Twit(accessKeys); 

// Variables used to store retrieved data
var user = [];
var tweets = [];
var friends;
var messagesRec;
var messagesSent;
var messages;

// Paramters to pass to Twit get requests
var params = {user_name: user.screen_name, count: 5};

//Error message containing default error message
var errMessage = 'Error occured while communicating with Twitter';

// location of static files
app.use('/static', express.static(__dirname + '/public'));

// create application/json parser 
app.use(bodyParser.json());
 
// create application/x-www-form-urlencoded parser 
app.use(bodyParser.urlencoded({ extended: true }));

/** SET UP THE VIEW ENGINE */
app.set('view engine', 'pug');
app.set('views', __dirname + '/public/views');
 

//renders html using data from Twiter API
app.get('/', function (req, res) {
  res.render('index', {tweets: tweets, friends: friends, user: user, messages: messages});
});


//Posts new tweet to twitter and updates page
app.post('/', function (req, res) {
  var newTweet = req.body.tweet;
  T.post('statuses/update', {status: newTweet} , function (err, data, response) {
    if (!err) {
      getData('statuses/user_timeline', params)
        .then (function(data) {
          tweets = data;
          tweets = elaspsedTime(tweets);
          res.render('index', {tweets: tweets, friends: friends, user: user, messages: messages});
        })
        .catch (function(err){
          errMessage = 'Page not updated since last tweet. Check twitter.com or refresh page';
        })
    } else {
      errMessage = 'Error occured when posting to Twitter';
      res.redirect('/error');
    }
  })
});

//displays error page with human friendly error
app.get('/error', function (req, res) {
  res.render('error', {errMessage});
});

//development server set-up
app.listen(3000, function(){
  console.log("The nodemon frontend server is running at port 3000");
});

//gets user account information
getData('account/verify_credentials', { skip_status: true })
  .then (function(data) {
    user = data;
  })
  .catch (function(err){
    errMessage = 'Could not Verify Twitter Account Credentials';
  })

//gets tweets
getData('statuses/user_timeline', params)
  .then (function(data) {
    tweets = data;
    tweets = elaspsedTime(tweets);
  })
  .catch (function(err){
    errMessage = "Could not get user's timeline data from Twitter";
  })

//gets followers info
getData('friends/list',  params)
  .then (function(data) {
    friends = data.users;
  })
  .catch (function(err){
    errMessage = "Could not get user's followers data from Twitter";
  })

//gets messages sent and received
getData('direct_messages',  params)
  .then (function(data) {
    messagesRec = data;
    return getData('direct_messages/sent',  params); 
  })
  .then (function(data) {
    messagesSent = data;
    messages = messagesRec.concat(messagesSent);
    sortMessages(messages);
    elaspsedTime(messages);
    trimMessages(messages);
  })
  .catch (function(err){
    errMessage = 'Could not get data from Twitter';
  })


// Promise function for handling get requests. Passes twitter API path and parameters 
function getData (path, params) {
  return new Promise (function (resolve, reject) {
    T.get(path, params, function (err, data, response) {
        if (err) {
          reject(err);
        } else {
          resolve(data);  
        }
      })
    })
  }

// Gets elapsed time using moment module .fromNow() function
function elaspsedTime (array) {
  for (var i=0; i < array.length; ++i) {
    array[i].created_at = (moment(array[i].created_at, 'ddd MMM DD HH:mm:ss Z YYYY').fromNow(true));
  }
  return array;
}

// Sorts direct messages by date 
function sortMessages (messages) {
  messages.sort(function (a, b) {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  });
}

//Trims direct messages down to 5
function trimMessages (messages) {
  var reduceBy = messages.length - 5;
  if (reduceBy > 0) {
    messages.reverse().length -= reduceBy;
  }
  return messages.reverse();
}
