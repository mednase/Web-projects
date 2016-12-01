var express = require("express"),
    app = express(),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    morgan = require('morgan'),
    mongoose = require('mongoose'),
    session = require('express-session'),
    config = require('./api/config/params'),
    validator = require('express-validator'),
    params = require('./api/config/params'),
    path = require('path'),
    fs = require('fs');
// Port to connect to
var port = process.env.PORT || 3000;

var server=app.listen(port, function () {
    console.log("Your server is running")
});

var connectedUser=[];
var io = require('socket.io')(server);

// Connect to database
mongoose.connect(config.database);

// Socket for real time notification
io.on('connection', function(socket){
    socket.on('join',function (data) {
        connectedUser[data.username]=socket;
    });

    socket.on('disconnect', function () {
        var idx=connectedUser.indexOf(socket);
        if(idx>-1){
            connectedUser.splice(idx,1);
            connectedUser.forEach(function (skt) {
                skt.emit("user-leave");
            });
        }

    });
});

module.exports={socket:connectedUser,io:io};

app.use(function (req, res, next) {
    try {
        decodeURIComponent(req.path)
    }
    catch(e) {
        return res.redirect('/error');
    }
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        return res.sendStatus(200);
    }

    next();
});

// get our request parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());





// log to console
//app.use(morgan('dev'));


app.use('/api/auth/twitter',session({ secret: params.secret })); // session secret
app.use(passport.initialize());
app.use(validator());


/* Library */
app.use('/public', express.static(__dirname + '/public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));



var auth = require('./api/routes/auth');
var admin = require('./api/routes/admin');
var user = require('./api/routes/user');
var article= require('./api/routes/article');
var message= require('./api/routes/message');

app.use('/', auth,user,article,admin,message);

/* send stored picture from the server */
app.get('/api/uploads/*/*',function (req, res) {
    var img=(req.url).slice(1);
    fs.exists(img, function (exist) {
        if (exist)
            return res.sendFile(path.resolve(img));
        else
            return res.sendStatus(404);
    });
});

/* this should be in the end !!! */
/* run app from all route */
app.get('*', function (req, res) {
    res.sendFile(__dirname + '/public/views/index.html')
});


