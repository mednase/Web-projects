/**
 * Created by medna on 14/11/2016.
 */
var express = require('express'),
    User = require('../models/userModel'),
    Discussion = require('../models/discussionModel'),
    config = require('../config/params'),
    jwt = require('jwt-simple'),
    passport = require('passport'),
    async = require('async'),
    mongoose = require('mongoose');

var path = require("path");
var fs = require("fs");
var socket = require("../../server");

var router = express.Router();


module.exports = (function () {

    router.all('/api/discussion/*', passport.authenticate('jwt', {session: false}), function (req, res, next) {
        var token = getToken(req.headers);
        if (token) {
            var decoded = jwt.decode(token, config.secret);
            User.findOne({username: decoded.username}).populate("discussions").populate("notifications").exec(function (err, user) {
                if (err) throw err;
                if (!user) {
                    return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
                } else {
                    if (user) {
                        req.user = user;
                        next();
                    }
                }
            });
        } else
            return res.status(403).send({success: false, msg: 'No token provided.'});

    });


    router.get('/api/discussion/:pagination',function (req,res) {


        var pagination=parseInt(req.params.pagination)-1;

        var countQuery = function(callback){
            Discussion.count(function (err, count) {
                callback(err, count);
            });
        };

        var retrieveQuery = function(callback){
            Discussion.find().skip(pagination*config.itemsPerPage).limit(config.itemsPerPage).populate({
                path: 'messages.from users',
                model: 'User',
                select: '_id username avatar',
            }).exec(function (err, discussions) {
                console.log(discussions);
                async.forEach(discussions,function (discussion,done) {
                    discussion.users.map(function (usr) {
                        if(usr.username==req.user.username)
                            discussion.users.splice(discussion.users.indexOf(usr),1);
                    });
                    done();
                },function () {
                    callback(err,discussions);
                });
            });
        };

        async.parallel([countQuery, retrieveQuery], function(err, results){
            res.json({discussions:results[1],total:results[0]});
        });



    });
    router.get('/api/discussion/messages/:channel',function (req,res) {

        if(mongoose.Types.ObjectId.isValid(req.params.channel))
            Discussion.findOne({_id:req.params.channel},'users messages').populate('users','username avatar').populate('messages.from','username avatar').sort([['dateCreation', 'ascending']]).exec(function (err,discussion) {
                if(err)throw err;
                res.send(discussion);
            });
        else
            res.sendStatus(404);
    });
    router.post('/api/discussion/sendMessage', function (req, res) {
        async.waterfall([function (done) {
            User.findOne({username: req.body.to}, function (err, user) {
                done(err, user);
            });
        }, function (user, done) {
            Discussion.findOne({$and: [{users: req.user._id}, {users: user._id}]}).exec(function (err, discussion) {
                done(err, user, discussion);
            })
        }, function (user, discussion, done) {
            if (discussion != null) {
                discussion.messages.push({body: req.body.body, from: req.user._id});
                discussion.save(function (err, disc) {
                    done(err, user, disc);
                })
            } else {
                discussion = new Discussion();
                discussion.users.push(req.user._id, user._id);
                discussion.messages.push({body: req.body.body, from: req.user._id});
                discussion.save(function (err, disc) {
                    req.user.discussions.push(disc._id);
                    user.discussions.push(disc._id);
                    req.user.save();
                    user.save();
                    done(err, user, disc);
                });
            }
        }, function (user, disc) {
            disc.populate('_id messages.from','avatar username',function (err,result) {
                msg=result.messages.pop();
                socket.socket[user.username] != null ? socket.socket[user.username].emit("new-message", {msg:msg,discussion_id:result._id}) : null;
                return res.send({message: msg});

            })
        }]);
    });
    
    router.post('/api/discussion/delete',function (req,res) {
        Discussion.find({_id:{$in:req.body.discussions}},function (err,discussions) {
            async.each(discussions, function (discussion, done) {
                discussion.remove();
                done();
            }, function () {
                return res.sendStatus(200);
            });
        });
    });
    router.post('/api/discussion/deleteMessage', function (req, res) {
        req.body.messages.forEach(function (msg_id) {
            Discussion.findOne({_id: msg_id}, function (err, msg) {
                msg.remove();
            });
        });
        Discussion.find(function (err, messages) {
            res.send({messages: messages});
        })

    });
    router.post('/api/discussion/setSeen', function (req, res) {
        Discussion.find({},function (err, discussions) {
            async.forEach(discussions,function (discussion,done) {
                discussion.messages.filter(function (msg) {
                    return msg.seen=true;
                });
                discussion.save();
                done(err);
                })
            },function () {
            res.sendStatus(200);
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
