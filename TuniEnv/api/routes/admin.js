/**
 * Created by medna on 06/11/2016.
 */
var express = require('express'),
    User = require('../models/userModel'),
    Article = require('../models/articleModel'),
    Notification = require('../models/notificationModel'),
    Report = require('../models/reportModel'),
    config = require('../config/params'),
    jwt = require('jwt-simple'),
    passport = require('passport'),
    async = require('async'),
    mongoose = require('mongoose');

var fs = require("fs");
var socket = require("../../server");

var router = express.Router();


module.exports = (function () {

    router.all('/api/admin/*', passport.authenticate('jwt', {session: false}), function (req, res, next) {
        var token = getToken(req.headers);
        if (token) {
            var decoded = jwt.decode(token, config.secret);
            User.findOne({username: decoded.username}).populate("discussions").populate("notifications").exec(function (err, user) {
                if (err) throw err;
                if (!user) {
                    return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
                } else {
                    if (user.role == "admin" || user.role == "super-admin") {
                        req.user = user;
                        next();
                    }
                }
            });
        } else
            return res.status(403).send({success: false, msg: 'No token provided.'});

    });

    router.get('/api/admin/users/:pagination',function (req,res) {



        var pagination=parseInt(req.params.pagination)-1;

        var countQuery = function(callback){
            User.count(function (err, count) {
                callback(err, count);
            });
        };

        var retrieveQuery = function(callback){
            User.find().skip(pagination*config.itemsPerPage).limit(config.itemsPerPage).exec(function (err, result) {
                callback(err,result);
            });
        };

        async.parallel([countQuery, retrieveQuery], function(err, results){
            res.json({users:results[1],total:results[0]});
        });
    });

    router.get('/api/admin/dashboard', function (req, res) {
        User.find(function (err, users) {
            Article.find(function (err, articles) {
                return res.send({registred: users.length, postedArticle: articles.length});
            })
        });

    });
    router.post('/api/admin/articles/update', function (req, res) {
        console.log(req.body);
        Article.findOne({_id: req.body._id}).populate('author').exec(function (err, article) {
            if (err) throw err;

            console.log(article);
            if (article != null) {
                /* remove deleted images */
                article.images.forEach(function (img) {
                    // image has been removed !
                    if (req.body.images.indexOf(img) == -1)
                        fs.exists(img, function (exists) {
                            if (exists)
                                fs.unlink(img);
                        });
                });

                article.images = req.body.images;
                article.description = req.body.description;
                article.title = req.body.title;
                article.governorate = req.body.governorate;
                article.save(function () {
                    var notif = new Notification();
                    notif.type = "admin-edit";
                    notif.article_id=article._id;
                    notif.from.push(req.user._id);
                    notif.img=req.user.avatar;
                    notif.for = article.author._id;
                    notif.message=req.body.reason;
                    notif.save(function (err, saved) {
                        article.author.notifications.push(saved._id);
                        article.author.save();
                        socket.socket[article.author.username] != null ? socket.socket[article.author.username].emit('notification',saved) : null;
                        return res.sendStatus(200);
                        });
                    });
                }else
                    return res.sendStatus(404);
            });
    });

    router.post('/api/admin/users/ban', function (req, res) {

        User.getUserByUsername(req.body.username, function (err, usr) {
            if (req.user.role == "admin" && (usr.role == "admin" || usr.role == "super-admin")) {
                return res.sendStatus(401);
            } else {
                usr.enable = false;
                usr.save();
                return res.sendStatus(200);
            }
        })
    });

    router.post('/api/admin/users/activate', function (req, res) {

        User.getUserByUsername(req.body.username, function (err, usr) {
            if (req.user.role == "admin" && (usr.role == "admin" || usr.role == "super-admin")) {
                return res.sendStatus(401);
            } else {
                usr.enable = true;
                usr.save();
                return res.sendStatus(200);
            }
        })
    });

    router.post('/api/admin/articles/delete', function (req, res) {
        Article.findOne({_id:req.body._id},function (err, article) {
            article.remove(function (err) {
                if(err) throw err;
                return res.sendStatus(200);
            })
        });
    });

    router.post('/api/admin/users/promote',function (req,res) {
        if(req.user.role=="super-admin")
            User.findOneAndUpdate({username:req.body.username},{role:req.body.role},function (err) {
                if(err) throw err;
                return res.sendStatus(200);
            });
        else
            return res.sendStatus(401);

    });


    router.get('/api/admin/reports/:pagination',function (req,res) {



        var pagination=parseInt(req.params.pagination)-1;

        var countQuery = function(callback){
            Report.count(function (err, count) {
                callback(err, count);
            });
        };

        var retrieveQuery = function(callback){
            Report.find().skip(pagination*config.itemsPerPage).limit(config.itemsPerPage).populate({ path: 'article',
                select: '_id title author',
                populate: ({
                    path: 'author',
                    model: 'User',
                    select: '_id username ',
                })
            }).populate('users','username').sort([['date','descending']]).exec(function (err, result) {
                callback(err,result);
            });
        };

        async.parallel([countQuery, retrieveQuery], function(err, results){
            res.json({reports:results[1],total:results[0]});
        });
    });

    router.post('/api/admin/reportDelete',function (req,res) {
        Report.findOne({_id:req.body._id},function (err,report) {
            report.remove();
            res.sendStatus(200);
        })
    })
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
