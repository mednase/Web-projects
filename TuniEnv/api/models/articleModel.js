var mongoose=require('mongoose');
var User=require('./userModel');
var fs = require("fs");
var async = require("async");
var Schema=mongoose.Schema;

var article_schema=new Schema({

    title: String,
    description: String,
    governorate: String,
    langitude : Number,
    latitude : Number,
    images : [],
    views: {type:Number,default:0},
    likes: [],
    dislikes: [],
    dateCreation: {type:Date , default:Date.now},
    lastModification: {type:Date, default:Date.now},
    author: {type: Schema.Types.ObjectId,ref: "User"}

});
article_schema.pre('save',function (next) {
    this.lastModification=Date.now();
    return next();
});
article_schema.pre('remove',function (next) {
    var article=this;
    async.waterfall([function (done) {
        async.each(images,function (img,done) {
            if(img && img!="")
                removeFile(img);

            if(i==a.length-1)
                done()
        },function () {
            if(article.images.length<1)
                done();
        });
    },function () {
        var id=article._id;
        User.find({$or:[{articles:id},{favorites:id+""},{notifications:id}]},function (err,users) {
            async.forEach(users,function (user,done) {
                user.articles.splice(user.articles.indexOf(id),1);
                user.favorites.splice(user.favorites.indexOf(id),1);
                user.notifications.splice(user.notifications.indexOf(id),1);

                user.save();
                done()
            },function () {
                next();
            });
            if(users.length==0)
                next();
        });
    }]);


});

var Article = mongoose.model("Article",article_schema);
module.exports=Article;

var removeFile=function(previeusAvatar) {
    var index = previeusAvatar.lastIndexOf("/") + 1;
    var image_id = previeusAvatar.substr(index);
    cloudinary.uploader.destroy(image_id, function (result) {
        return (result)
    })
};
