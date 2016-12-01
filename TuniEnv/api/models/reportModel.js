/**
 * Created by medna on 15/11/2016.
 */
/**
 * Created by medna on 29/10/2016.
 */
var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var report_schema=new Schema({
    reason:String,
    article:{type:Schema.Types.ObjectId,ref:'Article'},
    date: {type:Date,default:Date.now},
    users: [{type: Schema.Types.ObjectId,ref: "User"}]
});

var Report = mongoose.model("Report",report_schema);
module.exports=Report;
