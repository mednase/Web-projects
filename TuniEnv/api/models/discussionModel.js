/**
 * Created by medna on 29/10/2016.
 */
var mongoose=require('mongoose');
var User= require('./userModel');
var async = require("async");
var Schema=mongoose.Schema;

var discussion_schema=new Schema({
    messages:[{
        dateCreation: {type:Date , default:Date.now},
        body:String,
        seen : {type:Boolean,default:false},
        from: {type: Schema.Types.ObjectId,ref: "User"}

    }],
    date:Date,
    users: [{type: Schema.Types.ObjectId,ref: "User"}]
});
discussion_schema.pre('save',function (next) {
    this.date=Date.now;
    next();

});
discussion_schema.pre('remove',function (next) {
    var discussion=this;
    User.find({discussions:discussion._id},function (err,users) {
        console.log(users.length);
        async.each(users,function (user,done) {
            user.discussions.splice(user.discussions.indexOf(discussion._id),1);
            user.save();
            done();
        },function () {
            next();
        })

    })
});


var Discussion = mongoose.model("Discussion",discussion_schema);
module.exports=Discussion;
