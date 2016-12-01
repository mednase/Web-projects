var express = require('express'),
    User = require('../models/userModel'),
    passport = require('passport'),
    config = require('../config/params'),
    jwt = require('jwt-simple'),
    crypto = require('crypto'),
    async = require('async'),
    mailer = require('../config/Mailer');

// pass passport for configuration
require('../config/passport')(passport);

var router = express.Router();

module.exports = (function () {

    router.post('/api/auth/register', function (req, res) {
        req.check('email', 'Email not valid ').isEmail();
        req.check('username', 'Username length should be between 4 and 20 characters').isLength({min: 4, max: 20});
        req.check('password', 'Password Should be atleast 6 characters length').isLength({min: 6});
        req.check('password', 'Password does not match').equals(req.body.Cpassword);
        var errors = req.validationErrors();
        if (errors)
            res.send({success: false, errors: errors});
        else
            User.getUserByEmail(req.body.email, function (err, user) {
                if (user)
                    res.json({success: false, errors: [{message: 'email already taken'}]});
                else
                    User.getUserByUsername(req.body.username, function (err, user) {
                        if (user)
                            res.json({success: false, errors: [{message: 'username already taken'}]});
                        else {
                            var newUser = new User(req.body);
                            newUser.save(function (err) {
                                if (err) throw err;

                                return res.send({success: true, message: "You have been registered !"});
                            });

                        }
                    });


            });

    });

    router.post('/api/auth/login', function (req, res) {
        User.getUserByUsername(req.body.username, function (err, user) {
            if (err) throw err;
            if (!user) {
                res.json({success: false, msg: 'Authentication failed. Wrong username.'});
            } else {
                if (!user.enable)
                    res.json({success: false, msg: 'This account is banned !'});
                else
                // check if password matches
                    User.comparePassword(req.body.password, user, function (err, isMatch) {
                        if (isMatch && !err) {
                            // if user is found and password is right create a token
                            var token = jwt.encode(user, config.secret);

                            user.lastLogin = Date.now();
                            user.save();
                            // return the information including token as JSON
                            res.json({success: true, token: 'JWT ' + token});
                        } else {
                            res.json({success: false, msg: 'Authentication failed. Wrong password.'});
                        }
                    });
            }
        });
    });

    router.post('/api/auth/forgot', function (req, res) {
        async.waterfall([
            function (done) {
                crypto.randomBytes(20, function (err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function (token, done) {
                User.findOne({email: req.body.email}, function (err, user) {
                    if (!user)
                        return res.status(401).json({msg: "No account with that email address exists."});

                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                    user.save(function (err) {
                        done(err, token, user);
                    });
                });
            },
            function (token, user, done) {
                var url = config.server_url + "/resetpassword/" + token;
                mailer.sendEmail(user, url, function (result) {
                    return res.send(result);
                });
            }
        ], function (err) {
            if (err) throw (err);
            return res.status(401).json({msg: "An error has occured , try again"});
        });
    });

    router.get('/api/auth/reset/:token', function (req, res) {
        User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {$gt: Date.now()}
        }, function (err, user) {
            if (!user) {
                return res.json({success: false, msg: "The token has been expired !"});
            }
            return res.json({success: true});
        });

    });


    router.post('/api/auth/reset', function (req, res) {
        if (req.body.password == req.body.Cpassword) {
            User.findOne({
                resetPasswordToken: req.body.token,
                resetPasswordExpires: {$gt: Date.now()}
            }, function (err, user) {
                if (!user) {
                    return res.json({success: false, msg: "The token has been expired !"});
                }
                user.resetPasswordToken = "";
                user.resetPasswordExpires = "";
                user.password = req.body.password;
                user.save(function (err) {
                    if (err)
                        return res.json({success: false, message: "there was an error !"});
                    return res.json({success: true, msg: "Your password has been reset !"});

                });
            });

        } else
            return res.json({success: false, msg: "Password doesn t match !"});
    });

    // authentication with social media

    /* login with facebook*/
    router.get('/api/auth/facebook',
        passport.authenticate('facebook', {session: false}));

    router.get('/api/auth/facebook/callback',
        passport.authenticate('facebook', {session: false, failureRedirect: '/login'}),
        function (req, res) {
            var user = req.user;
            var token = jwt.encode(user, config.secret);

            user.lastLogin = Date.now();
            user.save();
            token = 'JWT ' + token;
            res.redirect("/auth/successLoginSocialMedia?token=" + token);
        }
    );

    /* login with twitter */

    router.get('/api/auth/twitter',
        passport.authenticate('twitter', {session: false, scope: []}));

    router.get('/api/auth/twitter/callback',
        passport.authenticate('twitter', {session: false, failureRedirect: '/login'}),
        function (req, res) {
            var user = req.user;
            var token = jwt.encode(user, config.secret);

            user.lastLogin = Date.now();
            user.save();
            token = 'JWT ' + token;
            res.redirect("/auth/successLoginSocialMedia?token=" + token);
        }
    );

    /* login with Google Plus*/
    router.get('/api/auth/google',
        passport.authenticate('google', {
                session: false,
                scope: ['https://www.googleapis.com/auth/plus.login',
                    'https://www.googleapis.com/auth/plus.profile.emails.read']
            }
        ));

    router.get('/api/auth/google/callback',
        passport.authenticate('google', {
            session: false,
            failureRedirect: '/login'
        }), function (req, res) {
            var user = req.user;
            var token = jwt.encode(user, config.secret);
            user.lastLogin = Date.now();
            user.save();
            token = 'JWT ' + token;
            res.redirect("/auth/successLoginSocialMedia?token=" + token);
        }
    );

    return router;
})();
getToken = function (headers) {
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
