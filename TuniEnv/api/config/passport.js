// load up the user model
var params = require('./params'),
    User = require('../models/userModel');

var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

/* Social media login Strategy */
var FacebookStrategy = require('passport-facebook').Strategy,
    TwitterStrategy = require('passport-twitter').Strategy,
    GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;


var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
opts.secretOrKey = params.secret;
//opts.issuer = "mednaceur.tuni_env.com";
//opts.audience = "tuni_env.com";
module.exports = function (passport) {

    passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
        User.findOne({id: jwt_payload.sub}, function (err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                done(null, user);
            } else {
                done(null, false);
            }
        });
    }));



    passport.use(new FacebookStrategy({
            clientID: params.Facebook.FACEBOOK_CONSUMER_KEY,
            clientSecret: params.Facebook.FACEBOOK_CONSUMER_SECRET,
            callbackURL: params.Facebook.FACEBOOK_CALLBACK_URL,
            profileFields: ['id','picture.type(large)', 'email', 'displayName', 'first_name','last_name'],
        },
        function (accessToken, refreshToken, profile, done) {
            User.findOrCreateFacebook(profile._json, function (err, user) {
                return done(err, user);
            });
        }
    ));

    passport.use(new TwitterStrategy({
            consumerKey: params.Twitter.TWITTER_CONSUMER_KEY,
            consumerSecret: params.Twitter.TWITTER_CONSUMER_SECRET,
            callbackURL: params.Twitter.TWITTER_CALLBACK_URL,
        },
        function(token, tokenSecret, profile, done) {
            User.findOrCreateTwitter(profile, function (err, user) {
                return done(err, user);
            });
        }
    ));


    passport.use(new GoogleStrategy({
            clientID: params.Google.GOOGLE_CONSUMER_KEY,
            clientSecret: params.Google.GOOGLE_CONSUMER_SECRET,
            callbackURL: params.Google.GOOGLE_CALLBACK_URL,
        },
        function(request, accessToken, refreshToken, profile, done) {
            User.findOrCreateGoogle(profile._json , function (err, user) {
                return done(err, user);
            });
        }
    ));
};
