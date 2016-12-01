var express = require('express'),
    User = require('../models/userModel'),
    Article = require('../models/articleModel'),
    Notification = require ('../models/notificationModel'),
    Report = require('../models/reportModel'),
    config = require('../config/params'),
    jwt = require('jwt-simple'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    upload = require('../config/upload'),
    socket = require('../../server');

var cloudinary=require('../config/ClouddinaryConfig');
var async = require("async");

var router = express.Router();
module.exports = (function () {

    router.get('/api/article/all/:pagination', function (req, res) {

        var pagination=parseInt(req.params.pagination)-1;

        var countQuery = function(callback){
            Article.count(function (err, count) {
                callback(err, count);
            });
        };

        var retrieveQuery = function(callback){
            Article.find().skip(pagination*config.itemsPerPage).limit(config.itemsPerPage).sort([['dateCreation', 'descending']]).populate("author",'username avatar').exec(function (err, result) {
                callback(err,result);
            });
        };

        async.parallel([countQuery, retrieveQuery], function(err, results){
            res.json({articles:results[1],total:results[0]});
        });


    });
    router.get('/api/article/popular/:pagination',function (req,res) {
        var pagination=parseInt(req.params.pagination)-1;

        var countQuery = function(callback){
            Article.count(function (err, count) {
                callback(err, count);
            });
        };

        var retrieveQuery = function(callback){
            Article.find().skip(pagination*config.itemsPerPage).limit(config.itemsPerPage).sort([['views', 'descending']]).
            populate("author",'username avatar').exec(function (err,result) {
                callback(err,result);
            })
        };

        async.parallel([countQuery, retrieveQuery], function(err, results){
            res.json({articles:results[1],total:results[0]});
        });



    });
    router.get('/api/article/governorate/:name/:pagination',function (req , res) {
        var pagination=parseInt(req.params.pagination)-1;

        var countQuery = function(callback){
            Article.count({governorate:req.params.name},function (err, count) {
                callback(err, count);
            });
        };

        var retrieveQuery = function(callback){
            Article.find({governorate:req.params.name}).skip(pagination*config.itemsPerPage).limit(config.itemsPerPage).sort([['dateCreation', 'descending']]).
            populate("author",'username avatar').exec(function (err,result) {
                callback(err,result);
            });
        };

        async.parallel([countQuery, retrieveQuery], function(err, results){
            res.json({articles:results[1],total:results[0]});
        });

    });

    router.post('/api/article/find',function (req , res) {
        Article.find({$or:[{title:new RegExp(req.body.search, "i")},{governorate:new RegExp(req.body.search, "i")} ]}).exec(function (err,result) {
            res.send(result);
        })
    });


    router.post("/api/article/:id/addView", function (req, res) {
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            Article.findOne({_id: req.params.id}, function (err, article) {
                if (err) throw err;
                if(article!=null){
                    article.views++;
                    article.save();
                    return res.status(200).send({views: article.views});
                }else
                    return res.sendStatus(500);
            });
        } else
            res.sendStatus(500);
    });

    router.get('/api/article/show/:article_id', function (req, res) {

        if (mongoose.Types.ObjectId.isValid(req.params.article_id))
            Article.findOne({_id: req.params.article_id})
                .populate('author','username avatar')
                .exec(function (err, article) {
                    if (err)throw err;
                    if(article)
                        res.send(article);
                    else
                        res.sendStatus(404);
                });
        else
            res.sendStatus(404);

    });

    /* Protect The article route with authentication middleware */
    router.all('/api/article/*', passport.authenticate('jwt', {session: false}), function (req, res, next) {
        var token = getToken(req.headers);
        if (token) {
            var decoded = jwt.decode(token, config.secret);
            User.findOne({username: decoded.username}, function (err, user) {
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
    router.post('/api/article/new', function (req, res) {
        async.waterfall([function (done) {
            var article = new Article(req.body);
            article.author = req.user._id;
            article.save();
            done(null,article);
        },function (savedArticle,done) {
            req.user.articles.push(savedArticle._id);
            req.user.save();
            done(null,savedArticle);
        },function (savedArticle) {
            var notif=new Notification();
            notif.type="post-new";
            notif.article_id=savedArticle._id;
            notif.img=req.user.avatar;
            notif.from.push(req.user._id);
            User.find({follow:req.user.username}).exec(function (err,users) {
                if(err)throw err;
                if(users.length>0)
                    async.each(users,function (user,done) {
                        notif.for=user._id;
                        notif.save();
                        user.notifications.push(notif._id);
                        socket.socket[user.username] != null ? socket.socket[user.username].emit('notification',notif) : null;
                        user.save();
                        done();
                    },function () {
                        res.send(savedArticle._id);
                    });
                else
                    res.send(savedArticle._id)
            });
        }]);
    });

    router.post('/api/article/add/images',upload(), function (req, res) {
        if(req.uploadedImage)
            Article.findOne({_id: req.body.article_id, author: req.user._id}).populate('author').exec(function (err, article) {
                if (err) throw err;
                article.images.push(req.uploadedImage.secure_url);
                article.save(function () {
                    return res.sendStatus(200);
                });
            });
        else
            res.sendStatus(500);
    });
    router.post('/api/article/edit', function (req, res) {

        Article.findOne({_id: req.body._id, author: req.user._id}, function (err, article) {
            if (err) throw err;

            if (article != null) {
                /* remove deleted images */
                article.images.forEach(function (img) {
                    // image has been removed !
                    if (req.body.images.indexOf(img) == -1){
                        removeFile(img);
                    }
                });
                article.images = req.body.images;
                article.description = req.body.description;
                article.title = req.body.title;
                article.langitude = req.body.langitude;
                article.latitude = req.body.latitude;
                article.governorate = req.body.governorate;

                article.save(function () {
                    /* alert all users who added this article to their favourites that this article has been edited */
                    User.find({favorites: article._id},'_id',function (err ,users) {
                        if(err) throw  err;
                        if(users.length>0) {
                            var notif = new Notification();
                            notif.type = "edit";
                            notif.article_id = article._id;
                            notif.from.push(req.user.username);
                            notif.img=req.user.avatar;
                            notif.for = users;
                            notif.save(function (err, saved) {
                                saved.for.forEach(function (to, i2, a2) {
                                    User.findOne({_id: to}, function (err, usr) {
                                        usr.notifications.push(saved._id);
                                        usr.save();
                                        socket.socket[usr.username] != null ? socket.socket[usr.username].emit('notification',saved) : null;
                                    });
                                    if (i2 == a2.length - 1)
                                        return res.sendStatus(200);
                                });
                            })
                        }else
                            return res.sendStatus(200);
                    });
                });
            } else
                return res.sendStatus(500);

        });
    });

    router.post('/api/article/remove', function (req, res) {
        Article.findOne({_id: req.body._id, author: req.user._id}, function (err,article) {
            if (err) throw err;

            if(article)
                article.remove(function () {
                    return res.sendStatus(200);
                });
            else
                res.send(500);
        });
    });


    router.post("/api/article/:id/thumb", function (req, res) {
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            Article.findOne({_id: req.params.id}, function (err, article) {
                if (err) throw err;

                var indxL = article.likes.indexOf(req.user._id);
                var indxDL = article.dislikes.indexOf(req.user._id);

                if (req.body.thumb) {
                    if (indxL == -1){
                        article.likes.push(req.user._id);
                    }else
                        article.likes.splice(indxL, 1);

                    if (indxDL > -1)
                        article.dislikes.splice(indxDL, 1);
                } else {
                    if (indxDL == -1)
                        article.dislikes.push(req.user._id);
                    else
                        article.dislikes.splice(indxDL, 1);

                    if (article.likes.indexOf(req.user._id) > -1)
                        article.likes.splice(indxL, 1);
                }

                article.save();
                res.send({likes: article.likes, dislikes: article.dislikes});

            });
        } else
            res.sendStatus(500);

    });

    router.post('/api/article/report',function (req,res) {
        Report.findOne({article:req.body.article_id},function (err,report) {
            if(err)throw err;
            if(report){
                if(report.users.indexOf(req.user._id)>-1)
                    return res.send({done:false});
                else{
                    report.users.push(req.user._id);
                }
            }else{
                var report=new Report(req.body);
                report.users.push(req.user._id);

            }
            report.save();
            return res.send({done:true});
        })

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
    var image_id = previeusAvatar.substr(index);
    cloudinary.uploader.destroy(image_id, function (result) {
        return (result)
    })
};
