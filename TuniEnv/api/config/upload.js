var Datauri = require('datauri');
var multer = require('multer');
var cloudinary= require('./ClouddinaryConfig');
var path=require('path');
var memoryStorage = multer.memoryStorage();
var memoryUpload = multer({
    storage: memoryStorage,
    limits: {fileSize: 500000, files: 1}
}).single('file');



module.exports=function() {
    return function (req, res, next) {
        memoryUpload(req, res, function () {
            var dUri = new Datauri();
            dUri.format(path.extname(req.file.originalname).toString(), req.file.buffer);
            cloudinary.uploader.upload(dUri.content, function (image) {
                req.uploadedImage = image;
                next();
            });
        });
    }
};