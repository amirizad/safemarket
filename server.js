'use strict';

// NPM Package Dependencies
// =============================================================
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const db = require('./models');
const methodOverride = require("method-override");
const request = require('request');

// Authentication Dependencies
// =============================================================
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');
const flash = require('connect-flash');

// Sets up the Express App
// =============================================================
const app = express();
const PORT = process.env.PORT || 3000;
const index = require('./routes/html-routes.js')(express,passport,db,bcrypt,path);
const API = require('./routes/api-routes.js')(express,passport,db,bcrypt,request);

//Used to create the sessions table for authentication
const sessionStore = (process.env.PORT ? new MySQLStore({
    host:'us-cdbr-iron-east-05.cleardb.net',
    user:'b8984c452efa4a',
    password:'0ea24b18',
    database:'heroku_f8ff56462b848ef'
}) : new MySQLStore({
    host:'localhost',
    port:'3306',
    user:'root',
    password:'root',
    database:'chuckitdb'
}));


// START Configuring Express App
// ========================================================================================

// Sets up the Express app to handle data & cookie parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));
app.use(cookieParser());
app.use(flash());
app.use(methodOverride("_method"));

//Servers public content such as CSS Javascript required in the HTML files
app.use(express.static(path.join(__dirname,'public')));

//Creates the sessions table that will authenticate user sessions
app.use(session({
    //random string that gets hashed to validate a real session and not a spoof
    secret: 'throw it out if you cant sell it here seriously though chuck it',
    //saves a new session on every request if needed
    resave: false,
    //database location of saved sessions to avoid having to login everytime 
    //the server is restarted so that it is not stored locally
    store: sessionStore,
    //if the user is not logged in don't save a session or add a cookie
    saveUninitialized: false,
    //To be enabled if using HTTPS
       //cookie: { secure: true }
}));

//Sets up passport with express
app.use(passport.initialize());
app.use(passport.session());
const localStrategy = require('./config/passport/passport-strategy.js')(passport,LocalStrategy,db,bcrypt);

//Sets file to handle all main routes
app.use('/',index);
app.use('/api',API);

// Handle 404
app.use(function(req, res) {
    res.status(404).send('404: Not Found');
});

// Handle 500
app.use(function(error, req, res) {
    res.status(500).send('500: Internal Server Error');
});

// Starts DB and start listening to the server port
db.sequelize.sync({force:true}).then(()=>{
    app.listen(PORT,()=>{
        console.log('SERVER STARTED ON PORT ' + PORT);
    });
});