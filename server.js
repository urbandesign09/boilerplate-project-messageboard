'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const helmet = require('helmet');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const mongoose = require('mongoose');
const mongodb = require('mongodb');
const {MongoClient} = require('mongodb'); //may be unnecessary
const ObjectID = require('mongodb').ObjectID; //may be unnecessary 

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//write security via Helmet js
//site can only be loaded in iFrame on my own pages
//from my own IP
//security does not allow DNS prefetch
//site sends referrer only for own pages
app.use(
  helmet({
  frameguard: {
    action: "SAMEORIGIN", //allows for iframe loading on own pages
    //ask this on forum
  },
  contentSecurityPolicy:{
    directives: {
      //this is using default CSP 
      //need to add the other attributes to make it work??
      "defaultSrc":["'self'"],
      "styleSrc": ["'unsafe-inline'"],
      "frameAncestors": ["'self'"],
      "frameSrc": ["'self'", "https://repl.it/"],
      "scriptSrc": ["'self'", "localhost", "'unsafe-inline'", "code.jquery.com", "https://code.jquery.com/jquery-2.2.1.min.js"],
    }
  },
  dnsPrefetchControl:{},
  referrerPolicy: {
    policy: ["same-origin"], //'same-origin'?
  },
  })
)
//connect to MongoDB
//check connection
//connects to my mongo database, under 'Message Board' table
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})

//the schema of the data record
  //each project is a model on its own, rather than just 1 model 
  //similar to issue tracker 
  //_id
  //text
  //created on (date and time)
  //bumped on (date and time)
  //reported (true or false)
  //delete_password (string)
  //replies (array of string)

const Schema = mongoose.Schema;
const messageSchema = new Schema({
  text: {type: String, required: true},
  created_on: {type: Date},
  bumped_on: {type: Date},
  reported: {type: Boolean, default: false},
  delete_password: {type: String, required: true},
  replycount: {type: Number, default: 0},
  replies: [
      { text: {type: String, required: true},
        created_on: {type: Date},
        delete_password: {type: String, required: true},
        reported: {type: Boolean, default: false}
      }
    ]
})
//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app, messageSchema);


//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + process.env.PORT);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        var error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 3500);
  }
});

module.exports = app; //for testing

//need to reload this whole page, may have deleted some items
//then fix the GET for limiting top 3 replies