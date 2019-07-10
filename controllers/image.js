var formidable = require('formidable');
var path = require('path');
var fs = require('fs');
var md5 = require('md5');
var sidebar = require('../helpers/sidebar');
var Models = require('../models');

module.exports = {
    index: function(req, res) {
        var viewModel = {
            image: {},
            comments: []
        }; 
        Models.Image.findOne({filename: { $regex: req.params.image_id}},function(err, image){
            if(err){
                throw err;
            }
            if(image){
                image.views = image.views + 1;
                viewModel.image = image;
                image.save();
                Models.Comment.find({image_id : image._id}, {}, {sort: {'timestamp': 1}}, function(err, comments){
                    if(err){
                        throw err;
                    }

                    viewModel.comments = comments;
                    sidebar(viewModel, function(viewModel){
                        res.render('image', viewModel);
                    });
                });
            }else{
                res.redirect('/');
            }
        });
    },

    create: function (req, res) {
        var saveImage = function() {
            var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
            var imgUrl = '';

            for(var i=0; i < 6; i +=1){
                imgUrl += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            Models.Image.find({filename: imgUrl}, function(err, images){
                if(images.length > 0){
                    saveImage();
                }else{
                    var form = new formidable.IncomingForm();
                    form.parse(req, function(err, fields, file){
                        var ext = path.extname(file.file.name).toLowerCase();
                        if(ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif'){
                            var fileName = imgUrl + ext;
                            var tempPath = file.file.path;
                            var targetPath = path.resolve('./public/upload/' + fileName);
                            fs.rename(tempPath, targetPath, function(err){
                                if(err){
                                    throw err;
                                }

                                var newImg = new Models.Image({
                                    title: fields.title,
                                    filename: imgUrl + ext,
                                    description: fields.description
                                });

                                newImg.save(function(err, image){
                                    console.log('succesfully save image');
                                    res.redirect('/images/' + image.uniqueId);
                                });
                            });
                        }else{
                            res.status(500).end('send images only');
                        }
                    });
                }
            });
        }

        saveImage();
    },

    like: function(req, res) {
        Models.Image.findOne({filename: {$regex: req.params.image_id}}, function(err, image){
            if(!err && image){
                image.likes = image.likes + 1;
                image.save(function(err) {
                    if(err){
                        res.json(err);
                    }else{
                        res.json({likes: image.likes});
                    }
                });
            }
        });
    },

    comment: function(req, res) {
        Models.Image.findOne({filename: {$regex: req.params.image_id}}, function(err, image){
            if(!err && image){
                var newComment = new Models.Comment(req.body);
                newComment.gravatar = md5(newComment.email);
                newComment.image_id = image._id;
                newComment.save(function(err, comment){
                    if(err){
                        throw err;
                    }
                    res.redirect('/images/' + image.uniqueId);
                });
            }else{
                res.redirect('/');
            }
        });
    },

    remove: function(req, res){
        Models.Image.findOne({filename: {$regex: req.params.image_id}}, function(err , image){
            if(err) 
            {
                throw err;
            }
            fs.unlink(path.resolve('./public/upload/' + image.filename), function(err){
                if(err){
                    throw err;
                }
                Models.Comment.remove({image_id : image._id},
                    function(err){
                        image.remove(function(err){
                            if(!err){
                                res.json(true)
                            }else{
                                req.json(false);
                            }
                        })
                    })
            })
        });
    }
};