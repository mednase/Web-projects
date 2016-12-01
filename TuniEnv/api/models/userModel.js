var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var async = require("async");

var Schema = mongoose.Schema;
var user_schema = new Schema({
    username: {type: String, unique: true},
    email: {type: String, unique: true},
    enable: {type: Boolean, default: true},
    password: String,
    firstname: String,
    lastname: String,
    phone: String,
    avatar: String,
    role: {type: String, default: "user"},
    dateJoin: {type: Date, default: Date.now},
    lastLogin: {type: Date},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    discussions: [{type: Schema.Types.ObjectId, ref: 'Discussion'}],
    articles: [{type: Schema.Types.ObjectId, ref: 'Article'}],
    favorites: [],
    notifications: [{type: Schema.Types.ObjectId, ref: 'Notification'}],
    follow: [],
    provider: {type: String, default: "TuniEnv"},

    facebookId: String,
    facebook: String,

    twitterId: String,
    twitter: String,

    googleId: String,
    google: String
});

user_schema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(user.password, salt, function (err, hash) {
                user.password = hash;
                next(user);
            });
        });
    } else
        return next();

});

var User = mongoose.model("User", user_schema);
module.exports = User;


module.exports.getUserByUsername = function (username, callback) {
    var query = {username: username};
    User.findOne(query, callback);
};

module.exports.getUserByEmail = function (email, callback) {
    var query = {email: email};
    User.findOne(query, callback);
};

User.comparePassword = function (password, user, callback) {
    bcrypt.compare(password, user.password, function (err, isMatch) {
        if (err) {
            return callback(err);
        }
        callback(null, isMatch);
    });
};

User.findOrCreateFacebook = function (profile, callback) {
    User.findOne({$or: [{facebookId: profile.id}, {facebook: "https://www.facebook.com/" + profile.id}]}, function (err, user) {
        if (err) throw err;
        if (user)
            callback(err, user);
        else {
            User.findOne({username: profile.username}, function (err, usr) {
                if (err)throw err;

                if (usr)
                    profile.name += "-facebook-" + profile.id;
                user = new User({
                    username: profile.name,
                    email: "no-email-" + profile.id + "@facebook.com",
                    firstname: profile.first_name + "",
                    lastname: profile.last_name + "",
                    provider: 'facebook',
                    facebookId: profile.id,
                    facebook: "https://www.facebook.com/" + profile.id,
                    avatar: profile.picture.data.url
                });
                user.save(function (err) {
                    if (err)throw err;

                    callback(err, user);
                })
            })
        }

    });
};

User.findOrCreateTwitter = function (profile, callback) {
    User.findOne({$or: [{twitterId: profile.id}, {twitter: "https://www.twitter.com/" + profile.username}]}, function (err, user) {
        if (err) throw err;
        if (user)
            callback(err, user);
        else {
            User.findOne({username: profile.username}, function (err, usr) {
                if (err)throw err;

                var username="";
                if (usr)
                    username=profile.username +"-twitter-" + profile.id;
                else
                    username=profile.username;

                user = new User({
                    username: username,
                    email: "no-email-" + profile.id + "@twitter.com",
                    firstname: profile.displayName,
                    lastname: "",
                    provider: 'twitter',
                    twitterId: profile.id,
                    twitter: "https://www.twitter.com/" + profile.username,
                    avatar: profile.photos[0].value.replace('_normal.jpeg', '.jpeg')
                });
                user.save(function (err) {
                    if (err)throw err;

                    callback(err, user);
                })

            })
        }

    });
};

User.findOrCreateGoogle = function (profile, callback) {
    User.findOne({$or: [{email: profile.emails[0].value}, {googleId: profile.id}, {google: profile.url}]}, function (err, user) {
        if (err) throw err;
        if (user)
            callback(err, user);
        else {
            User.findOne({username: profile.username}, function (err, usr) {
                if (err)throw err;

                if (usr)
                    profile.displayName += "-Google-" + profile.id;
                user = new User({
                    username: profile.displayName + "-Google-" + profile.id,
                    email: profile.emails[0].value,
                    firstname: profile.name.givenName,
                    lastname: profile.name.familyName,
                    provider: 'google',
                    googleId: profile.id,
                    google: profile.url,
                    avatar: profile.image.url.replace('.jpg?sz=50', '.jpg')
                });
                user.save(function (err) {
                    if (err)throw err;

                    callback(err, user);
                })
            })
        }

    });
};

User.message_notification = function (id, callback) {
    User.findOne({_id: id}).populate({
        path: 'discussions',
        select: 'messages users',
        populate: ({
            path: 'messages.from users',
            model: 'User',
            select: '_id username avatar',
        })
    }).populate({
        path: 'notifications',
        populate: {
            path: 'from',
            model: 'User',
            select: 'username avatar'
        }
    }).exec(function (err, user) {
        if(user)
        async.forEach(user.discussions,function (discussion,done) {
            discussion.users.map(function (usr) {
                if(usr.username==user.username)
                    discussion.users.splice(discussion.users.indexOf(usr),1);
            });
            done();
        },function () {
            callback(err, user)
        });
    });
};


module.exports.getUserById = function (id, callback) {
    User.findById(id, callback);
};