/**
 * Created by medna on 29/10/2016.
 */
var mongoose = require('mongoose');
var User = require('./userModel');
var Schema = mongoose.Schema;

var notification_schema = new Schema({

    idf: String,
    type: String,
    message: String,
    date: {type: Date, default: Date.now},
    seen: {type: Boolean, default: false},
    article_id: String,
    from: [{type: Schema.Types.ObjectId, ref: "User"}],
    for: [{type: Schema.Types.ObjectId, ref: "User"}]

});

notification_schema.pre('save', function (next) {
    var notif = this;
    notif.idf = notif.type +"-"+ notif.article_id;
    notif.populate('from','username',function () {
    switch (notif.type) {
        case "comment":
            notif.message= notif.from[0].username;
            if (notif.from.length ==2)
                notif.message += " and " + notif.from[1].username;
            if (notif.from.length ==3)
                notif.message += ", " + notif.from[1].username + " and 1 other";
            if (notif.from.length>3)
                notif.message += ", " + notif.from[1].username + " and " + notif.from.length - 2 + " others";

            notif.message += "  commented your article";
            notif.seen = false;
            notif.date = Date.now();
            break;

        case "like":
            notif.message = notif.from[0].username;
            if (notif.from.length ==2)
                notif.message += " and " + notif.from[1].username;
            if (notif.from.length ==3)
                notif.message += ", " + notif.from[1].username + " and 1 other";
            if (notif.from.length>3)
                notif.message += ", " + notif.from[1].username + " and " + notif.from.length - 2 + " others";

            notif.message += "  Like your article";
            notif.seen = false;
            notif.date = Date.now();
            break;

        case "edit":
            this.message = notif.from[0].username+" Edit his article ";
            notif.seen = false;
            notif.date = Date.now();
            break;
        case "admin-edit":
            this.message = "Admin "+notif.from[0].username+" Edited your article for reason : "+this.message;
            notif.seen = false;
            notif.date = Date.now();
            break;
        case "post-new":
            this.message = notif.from[0].username+" Posted a new article";
            break;
        case "report":
            this.message += notif.from[0].username+" Reported an article";
            break;
    }
    next();
    });

});

var Notification = mongoose.model("Notification", notification_schema);
module.exports = Notification;
