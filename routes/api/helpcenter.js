const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const async = require("async");
const validateAddCurrencyInput = require('../../validation/currency');
const multer = require('multer');

const Category = require('../../models/category')
const Subcategory = require('../../models/subcategory')
const Article = require('../../models/Article')
const HelpCentreArticle = require("../../models/HelpCentreArticle")
const HelpCentreCategory = require("../../models/HelpcentreCategory")



router.get('/test', (req, res) => {
    res.json({
        statue: "success"
    });
});


router.get('/category', (req, res) => {
    Category.find({}).then(categories => {
        if (categories) {
            return res.status(200).send(categories);
            // console.log(categories, 'categories');
        }
    });
})

router.get('/helpcentrecategory', (req, res) => {
    HelpCentreCategory.find({}).then(categories => {
        if (categories) {
            return res.status(200).send(categories);
            // console.log(categories, 'categories');
        }
    });
})



router.get('/sub-category', (req, res) => {
    Subcategory.find({}).populate('maincategoryId').then(Subcategories => {
        if (Subcategories) {
            return res.status(200).send(Subcategories);
            // console.log(Subcategories, 'Subcategory');
        }
    });
})


router.post('/sub-category-select-find', (req, res) => {
    var categoryid = req.body.categoryid
    Subcategory.find({
        maincategoryId: categoryid
    }).then(Subcategorieslist => {
        if (Subcategorieslist) {
            return res.status(200).send(Subcategorieslist);
        }
    });

})

router.post('/helpcentrecategory-add', (req, res) => {
    if (!req.body) {
        return res.status(400).json(errors);
    }
    HelpCentreCategory.findOne({
        categoryName: req.body.categoryName
    }).then(categorydata => {
        console.log(categorydata, 'categorydata');
        if (categorydata) {
            return res.status(400).json({
                categoryName: 'Category already exists'
            });
        } else {
            const newCategory = new HelpCentreCategory({
                categoryName: req.body.categoryName,

            });
            newCategory
                .save()
                .then(category => {
                    console.log(category, 'category');
                    return res.status(200).json({
                        message: 'Currency added successfully. Refreshing data...'
                    })
                }).catch(err => console.log(err));
        }
    });

})


router.post('/helpcentrecategory_update', (req, res) => {
    const _id = req.body._id;

    let update = {
        'categoryName': req.body.categoryName,
    };
    HelpCentreCategory.update({
        _id: _id
    }, {
        $set: update
    }, function (err, result) {
        if (result) {
            return res.status(200).json({
                message: 'Category updated successfully. Refreshing data...',
                success: true
            });
        }
    })
})

router.post('/helpcentrecategory-delete', (req, res) => {
    var id = req.body._id;
    HelpCentreCategory.deleteOne({
        _id: req.body._id
    }).then(categorydata => {
        // console.log(categorydata, 'currencydatarfgfhgjyghj');
        if (categorydata) {
            console.log(id, 'idsssssssssss');
            return res.status(200).json({
                message: 'Category data deleted successfully. Refreshing data...'
            })
        }
    });
})



router.post('/helpcentrearticle-data', (req, res) => {
    HelpCentreArticle.find({}).populate('maincategoryId').populate('subcategoryId').then(articlesss => {
        if (articlesss) {
            // console.log(articlesss, 'articlesssdataa');

            return res.status(200).send(articlesss);
        }
    });
})



var storage3 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/helpcentre')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

var upload3 = multer({
    storage: storage3
});


router.post('/helpcentrearticle-add', upload3.single('file'), function (req, res) {
    // console.log("req.body in addition/-/-/-/-/-/-/", req.body)
    // console.log("File for update", req.file)
    const file = req.file

    var attachment1 = '';

    if (file != "" && file != undefined) {
        attachment1 = req.file.filename;
    } else {
        attachment1 = null
    }

    const newarticle = new HelpCentreArticle({
        Articlename: req.body.articledetails,
        maincategoryId: req.body.maincategoryId,
        subcategoryId: req.body.subcategoryId,
        content: req.body.content,
        article_image: attachment1
    })
    newarticle.save().then(newarticledata => {
        console.log("New article data save", newarticledata)
        return res.status(200).json({
            message: 'Article added successfully. Refreshing data...'
        })
    }).catch(err => {
        console.log("Error in saving new article", err)
    })

})



router.post('/helpcentrearticle-update', upload3.single('file'), function (req, res) {
    const file = req.file

    var attachment1 = '';

    if (file != "" && file != undefined) {
        attachment1 = req.file.filename;
    } else {
        attachment1 = null
    }
    console.log("req of article update", req.body)
    var id = req.body._id
    var update = {
        "Articlename": req.body.articledetails,
        "maincategoryId": req.body.maincategoryId,
        "subcategoryId": req.body.subcategoryId,
        "content": req.body.content,
        "article_image": attachment1
    }
    HelpCentreArticle.findByIdAndUpdate(id, update, {
        new: true
    }, function (err, details) {
        console.log("updateddd", details)
        return res.status(200).json({
            message: 'Sub Category Updated successfully. Refreshing data...'
        })

    })

})
router.post('/helpcentrearticle-delete', (req, res) => {
    var id = req.body._id;
    HelpCentreArticle.deleteOne({
        _id: req.body._id
    }).then(categorydata => {
        console.log(categorydata, 'currencydatarfgfhgjyghj');
        if (categorydata) {
            console.log(id, 'idsssssssssss');
            return res.status(200).json({
                message: 'Category data deleted successfully. Refreshing data...'
            })
        }
    });
})





router.get('/helpcentrearticle/:id', (req, res) => {
    const id = req.params.id;
    console.log("Iddddddss ", id)
    async.waterfall([
        function (done) {
            HelpCentreArticle.findOne({
                _id: id
            }).populate('subcategoryId').then(articledata => {
                // console.log("Articled datatta", articledata)
                if (articledata) {
                    article_name = articledata.Articlename,
                        maincatId = articledata.maincategoryId,
                        subcatId = articledata.subcategoryId._id,
                        blog = articledata.content

                    done('',articledata);
                }

            })
        },function(articledata,done){
            var subcatId = articledata.subcategoryId._id
            HelpCentreArticle.find({subcategoryId:subcatId}).then(subcatdata=>{
                // console.log("Subcata Data",subcatdata)
                if(subcatdata)
                return res.json({articledata:articledata,subcatdata:subcatdata});
            })

        }

    ], function (err) {});
})




router.post('/category-add', (req, res) => {

    if (!req.body) {
        return res.status(400).json(errors);
    }
    Category.findOne({
        categoryName: req.body.categoryName
    }).then(categorydata => {
        // console.log(categorydata, 'categorydata');
        if (categorydata) {
            return res.status(400).json({
                categoryName: 'Category already exists'
            });
        } else {
            const newCategory = new Category({
                categoryName: req.body.categoryName,

            });
            newCategory
                .save()
                .then(category => {
                    // console.log(category, 'category');
                    return res.status(200).json({
                        message: 'Currency added successfully. Refreshing data...'
                    })
                }).catch(err => console.log(err));
        }
    });

})


router.post('/category_update', (req, res) => {
    const _id = req.body._id;

    let update = {
        'categoryName': req.body.categoryName,
    };
    Category.update({
        _id: _id
    }, {
        $set: update
    }, function (err, result) {
        if (result) {
            return res.status(200).json({
                message: 'Category updated successfully. Refreshing data...',
                success: true
            });
        }
    })
})


router.post('/category-delete', (req, res) => {
    var id = req.body._id;
    Category.deleteOne({
        _id: req.body._id
    }).then(categorydata => {
        // console.log(categorydata, 'currencydatarfgfhgjyghj');
        if (categorydata) {
            // console.log(id, 'idsssssssssss');
            return res.status(200).json({
                message: 'Category data deleted successfully. Refreshing data...'
            })
        }
    });
})


router.post('/category-getshow/:id', (req, res) => {
  const dontneedid = req.params.id;
  // console.log("dontnewde",dontneedid);
      Category.findOne({
        _id: dontneedid
    }).then(categorydata => {
        // console.log(categorydata, 'currencydatarfgfhgjyghj');
        if (categorydata) {
            // console.log(id, 'idsssssssssss');
            return res.status(200).send(categorydata);
        }
    });
})



router.post('/subcategory-delete', (req, res) => {
    var id = req.body._id;
    Subcategory.deleteOne({
        _id: req.body._id
    }).then(categorydata => {
        console.log(categorydata, 'currencydatarfgfhgjyghj');
        if (categorydata) {
            console.log(id, 'idsssssssssss');
            return res.status(200).json({
                message: 'Category data deleted successfully. Refreshing data...'
            })
        }
    });
})


router.post('/sub_category_add', (req, res) => {
    if (!req.body) {
        return res.status(400).json(errors);
    }
    Subcategory.findOne({
        subcategoryName: req.body.subcategoryName
    }).then(subcategorydata => {
        console.log(subcategorydata, 'subcategorydata');
        if (subcategorydata) {
            return res.status(400).json({
                subcategoryName: 'Sub Category already exists'
            });
        } else {
            console.log("In else")
            const newsubcategory = new Subcategory({
                subcategoryName: req.body.subcategoryName,
                maincategoryId: req.body.categoryName
            })
            newsubcategory.save().then(subcategory => {
                console.log("New subcategory data", subcategory)
                return res.status(200).json({
                    message: 'Sub Category added successfully. Refreshing data...'
                })
            }).catch(err => {
                console.log("Error in saving the new sub", err)
            })
        }

    })
})

router.post('/sub_category_update', (req, res) => {

    if (!req.body) {
        return res.status(400).json(errors);
    }
    var id = req.body._id
    var update = {
        "subcategoryName": req.body.subcategoryName,
        "maincategoryId": req.body.categoryName
    }
    Subcategory.findByIdAndUpdate(id, update, {
        new: true
    }, function (err, details) {
        // console.log("updateddd", details)
        return res.status(200).json({
            message: 'Sub Category Updated successfully. Refreshing data...'
        })

    })

})


router.post('/article-data', (req, res) => {
    Article.find({}).populate('maincategoryId').then(articlesss => {
        if (articlesss) {
            // console.log(articlesss, 'articlesssdataa');

            return res.status(200).send(articlesss);
        }
    });
})


router.post('/nextarticle/:id', (req, res) => {
    const dontneedid = req.params.id;
    console.log("dontneedid",typeof dontneedid);
    Article.find({}).populate('maincategoryId').sort({"createdDate":-1}).limit(10).then(articlesss => {
        if (articlesss) {
            // console.log(articlesss, 'articlesssdataa');
            resultarr = [];

for(i=0;i<articlesss.length;i++){

  if(articlesss[i]._id.toString()!=dontneedid.toString()){

    resultarr.push(articlesss[i]);
  }
}
            return res.status(200).send(resultarr);
        }
    });
})



router.post('/article-data-limit', (req, res) => {
    Article.find({}).populate('maincategoryId').sort({"createdDate":-1}).limit(2).then(articlesss => {
        if (articlesss) {
            // console.log(articlesss, 'articlesssdataa');

            return res.status(200).send(articlesss);
        }
    });
})


router.post('/recentblog-data-limit', (req, res) => {
    Article.find({}).sort({"createdDate":-1}).limit(5).populate('maincategoryId').then(articlesss => {
        if (articlesss) {

            return res.status(200).send(articlesss);
        }
    });
})



var storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/help_images')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

var upload2 = multer({
    storage: storage2
});


router.post('/article-add', upload2.single('file'), function (req, res) {
    // console.log("req.body in addition/-/-/-/-/-/-/", req.body)
    // console.log("File for update", req.file)
    const file = req.file

    var attachment1 = '';

    if (file != "" && file != undefined) {
        attachment1 = req.file.filename;
    } else {
        attachment1 = null
    }

    const newarticle = new Article({
        Articlename: req.body.articledetails,
        maincategoryId: req.body.maincategoryId,
        // subcategoryId: req.body.subcategoryId,
        content: req.body.content,
        article_image: attachment1
    })
    newarticle.save().then(newarticledata => {
        console.log("New article data save", newarticledata)
        return res.status(200).json({
            message: 'Article added successfully. Refreshing data...'
        })
    }).catch(err => {
        console.log("Error in saving new article", err)
    })

})



router.post('/article-update', upload2.single('file'), function (req, res) {
    const file = req.file

    var attachment1 = '';

    if (file != "" && file != undefined) {
        attachment1 = req.file.filename;
    } else {
        attachment1 = null
    }
    // console.log("req of article update", req.body)
    var id = req.body._id
    var update = {
        "Articlename": req.body.articledetails,
        "maincategoryId": req.body.maincategoryId,
        // "subcategoryId": req.body.subcategoryId,
        "content": req.body.content,
        "article_image": attachment1
    }
    Article.findByIdAndUpdate(id, update, {
        new: true
    }, function (err, details) {
        // console.log("updateddd", details)
        return res.status(200).json({
            message: 'Sub Category Updated successfully. Refreshing data...'
        })

    })

})
router.post('/article-delete', (req, res) => {
    var id = req.body._id;
    Article.deleteOne({
        _id: req.body._id
    }).then(categorydata => {
        // console.log(categorydata, 'currencydatarfgfhgjyghj');
        if (categorydata) {
            // console.log(id, 'idsssssssssss');
            return res.status(200).json({
                message: 'Category data deleted successfully. Refreshing data...'
            })
        }
    });
})

router.get('/article/:id', (req, res) => {
    const id = req.params.id;
    console.log("Iddddddss ", id)

    Article.findOne({
        _id: id
    }).populate('maincategoryId').then(articledata => {
        // console.log("Articled datatta", articledata)
        if (articledata) {
          return res.status(200).send(articledata);
        }
    })
})


router.get('/showcategory/:id', (req, res) => {
    const id = req.params.id;
    console.log("Iddddddss ", id)
    Article.find({
        maincategoryId:id
    }).populate('maincategoryId').then(articledata => {
        // console.log("Articled datatta", articledata)
        if (articledata) {
          return res.status(200).send(articledata);
        }
    })
})
module.exports = router;
