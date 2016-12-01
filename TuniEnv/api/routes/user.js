var express = require('express'),
    User = require('../models/userModel'),
    config = require('../config/params'),
    jwt = require('jwt-simple'),
    passport = require('passport'),
    async = require('async'),
    mongoose = require('mongoose');

var upload = require('../config/upload');
var cloudinary=require('../config/ClouddinaryConfig');

var path = require("path");
var Article = require('../models/articleModel');
var Notification = require('../models/notificationModel');
var socket = require("../../server");

var router = express.Router();

module.exports = (function () {


    router.get('/api/user/profile/:username', function (req, res) {
        User.findOne({username: req.params.username}).populate("articles").exec(function (err, profile) {
            if (err) throw err;
            if(profile)
                return res.send(profile);
            else
                return res.sendStatus(404);
        })
    });

    /* Protect The user route with authentication middleware */
    router.all('/api/user/*', passport.authenticate('jwt', {session: false}), function (req, res, next) {
        var token = getToken(req.headers);
        if (token) {
            var decoded = jwt.decode(token, config.secret);
            User.findOne({username: decoded.username}).exec(function (err, user) {
                if (err) throw err;
                if (!user) {
                    return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
                } else {

                    req.user = user;
                    next();
                }
            });
        } else
            return res.status(403).send({success: false, msg: 'No token provided.'});

    });


    router.get('/api/user/getInformation', function (req, res) {
        User.message_notification(req.user._id,function (err,user) {
            user.password="";
            res.status(200).json({user: user});
        })

    });


    router.post('/api/user/updatePassword', function (req, res) {

        req.check('password', 'Password Should be at least 6 characters length').isLength({min: 6});
        req.check('password', 'Password does not match').equals(req.body.confirm);

        var errors = req.validationErrors();
        if (errors)
            res.send({success: false, errors: errors});
        else
            User.comparePassword(req.body.confirmUpdate, req.user, function (err, isMatch) {
                if (isMatch && !err) {
                    req.user.password = req.body.password;
                    req.user.save(function () {
                        return res.json({success: true});
                    });
                } else
                    return res.json({success: false, errors: [{msg: 'Update fail wrong old password'}]});
            });

    });

    router.post('/api/user/updateProfile', function (req, res) {
        req.check('email', 'Email not valid ').isEmail();
        req.check('username', 'Username length should be between 4 and 20 characters').isLength({min: 4, max: 20});

        var errors = req.validationErrors();
        if (errors)
            res.send({success: false, errors: errors});
        else
            User.getUserByUsername(req.body.username, function (err, usr) {
                if (usr.username != req.user.username)
                    return res.json({success: false, errors: [{msg: 'username already taken'}]});
                else
                    User.getUserByEmail(req.body.email, function (err, user) {
                        if (user.username != req.user.username)
                            res.json({success: false, errors: [{msg: 'email already taken'}]});
                        else {
                            User.findOneAndUpdate({_id: req.user._id}, req.body, function (err, ur) {
                                return res.json({
                                    success: true, user: ur
                                })
                            });
                        }
                    });
            });

    });

    router.post('/api/user/uploadAvatar', upload(),function (req, res) {
        if(req.uploadedImage){
            console.log(req.uploadedImage);
            var prevAvatar = req.user.avatar;
            req.user.avatar = req.uploadedImage.secure_url;
            req.user.save(function (err) {
                if (err) {
                    req.user.avatar = prevAvatar;
                }else
                if(prevAvatar)
                    console.log(removeFile(prevAvatar))
            });
            return res.send(req.user.avatar);
        }else
            res.sendStatus(500);
        return res;

    });

    router.post('/api/user/removeAvatar', function (req, res) {
        var user = req.user;
        if(user.avatar && user.avatar!=""){
            console.log(removeFile(user.avatar));
            user.avatar = "";
            user.save();
        }

        return res.sendStatus(200);
    });



    router.get('/api/user/favorite', function (req, res) {
        var favorites = [];
        if (req.user.favorites == null || req.user.favorites.length == 0)
            return res.send({favorites: []});

        req.user.favorites.forEach(function (fav, i, a) {
            Article.findOne({_id: fav}, function (err, data) {
                favorites.push(data);
                if (i == a.length - 1)
                    return res.send({favorites: favorites});
            });

        });
    });
    router.post("/api/user/favorite/add", function (req, res) {
        if (mongoose.Types.ObjectId.isValid(req.body.article_id)) {
            Article.findOne({_id: req.body.article_id}, function (err, article) {
                if (err) throw err;

                if (article.author + "" == req.user._id + "")
                    return res.sendStatus(500);

                var indx = req.user.favorites.indexOf(article._id);
                if (req.body.addFav && indx == -1)
                    req.user.favorites.push(article._id);
                else if (!req.body.addFav && indx > -1)
                    req.user.favorites.splice(indx, 1);

                req.user.save();

                return res.sendStatus(200);
            });
        } else
            res.sendStatus(500);

    });
    router.post("/api/user/favorite/remove", function (req, res) {
        var indx = req.user.favorites.indexOf(req.body.article_id);

        if (indx > -1) {
            req.user.favorites.splice(indx, 1);
            req.user.save();
            return res.sendStatus(200);
        } else
            return res.sendStatus(500);

    });

    router.get('/api/user/notification', function (req, res) {
        Notification.find({for: req.user._id})
            .exec(function (err, notifications) {
                res.send({notifications: notifications});
            });
    });
    router.post('/api/user/notification/add', function (req, res) {

        var idf = req.body.type + "-" + req.body.article_id;
        Notification.findOne({idf: idf}, function (err, result) {
            if (err) throw err;
            if (result == null) {
                var notif = new Notification(req.body);
                notif.from = [];
                notif.from.push(req.user._id);
                notif.save(function (err, result) {
                    User.findOne({_id: result.for}, function (err, user) {
                        user.notifications.push(result.id);
                        user.save();
                        socket.socket[user.username] != null ? socket.socket[user.username].emit('notification', result) : null;
                        res.sendStatus(200);
                    });
                });
            } else {
                if (result.from.indexOf(req.user._id) == -1) {
                    result.from.push(req.user._id);
                    result.save();
                }
                res.sendStatus(200);
            }
        });
    });
    router.post('/api/user/notification/setSeen', function (req, res) {
        Notification.find({for: req.user.id, seen: false}, function (err, notifs) {
            notifs.forEach(function (notif, i, a) {
                notif.update({$set: {seen: true}}).exec(function () {
                    if (i == a.length - 1)
                        return res.sendStatus(200);
                });

            });

        });
    });
    router.post('/api/user/follow/add', function (req, res) {

        if (req.user.follow.indexOf(req.body.username) == -1 && req.user.username != req.body.username) {
            req.user.follow.push(req.body.username);
            req.user.save();
            return res.sendStatus(200)
        } else
            return res.sendStatus(500);
    });
    router.post('/api/user/follow/remove', function (req, res) {

        var indx = req.user.follow.indexOf(req.body.username);
        if (indx > -1) {
            req.user.follow.splice(indx, 1);
            req.user.save();
            return res.sendStatus(200)
        } else
            return res.sendStatus(500);

    });

    router.get("/api/user/articles", function (req, res) {

        Article.find({author: req.user._id}).sort([['dateCreation', 'descending']]).exec(function (err, result) {
            res.send({articles: result});
        });
    });

    return router;
})();

var getToken = function (headers) {
    if (headers && headers.authorization) {
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};

var removeFile=function(previeusAvatar) {
    var index = previeusAvatar.lastIndexOf("/") + 1;
    var image_id = previeusAvatar.substr(index).replace(/\.[^.$]+$/, '');
    cloudinary.uploader.destroy(image_id, function () {
    })
};

