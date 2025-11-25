import mongoose from "mongoose";

// import modal
import Admin from "../models/Admin";
import User from "../models/User";
import isEmpty from "../lib/isEmpty";
// import cofig
import config from "../config";

// import BlogCategory from '../models/blog_category';
// import Blogs from '../models/blogs';
// import SiteSetting from '../models/sitesetting';
// import SpotPair from '../models/spotpairs';
import { paginationQuery, filterSearchQuery } from "../lib/adminHelpers";
import {
  Blogs,
  BlogCategory,
  SiteSetting,
  SpotPair,
  newsletter_subscriber,
} from "../models";
const ObjectId = mongoose.Types.ObjectId;

export const getCategory = async (req, res) => {
  BlogCategory.findOne({}, (err, userData) => {
    if (err) {
      return res
        .status(200)
        .json({ success: false, errors: { messages: "Error on server" } });
    }

    return res.status(200).json({ success: true, userValue: userData });
  });
};

export const saveCategory = async (req, res) => {
  var obj = new BlogCategory();
  obj.status = req.body.status;
  obj.category_name = req.body.category_name;
  obj.slug = req.body.slug;
  BlogCategory.findOne({}, (err, userData) => {
    if (err) {
      return res
        .status(200)
        .json({ success: false, errors: { messages: "Error on server" } });
    }

    return res.status(200).json({ success: true, userValue: userData });
  });
};

export const getBlogCategoryList = async (req, res) => {
  try {
    let data = await BlogCategory.find({}).sort({ _id: -1 });
    if (data) return res.status(200).json({ status: true, data: data });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const getBlogCategoryEditData = async (req, res) => {
  try {

    let data = await BlogCategory.findOne({ _id: req.body.id });
    return res.status(200).json({ status: true, data: data });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const categoryAdd = async (req, res) => {
  try {

    let reqBody = req.body;
    let findOldBlog = await BlogCategory.findOne({
      category_name: reqBody.categoryName,
    })
    if (findOldBlog) {
      return res
        .status(400)
        .json({ status: true, errors: { categoryNameerr: "Category name already exists" }, });
    }
    const newCategory = new BlogCategory({
      category_name: reqBody.categoryName,
      slug: reqBody.slug,
    });

    let saveData = await newCategory.save();

    if (saveData) {
      return res
        .status(200)
        .json({ status: true, message: "Category Added Successfully" });
    }
  } catch (err) {
    console.log(err, "eeeee");
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const getBloglist = async (req, res) => {
  let blogData = await Blogs.find({})
    .populate("blog_category")
    .sort({ _id: -1 });

  return res.status(200).json({ success: true, cmsData: blogData });
};
export const blogAdd = async (req, res) => {
  try {
   
    let reqFile = req.files;
    let rewhitespaceinslug = await req.body.slug.replace(/\s+/g, "-");
    let resplchane = await rewhitespaceinslug.replace(/[^\w\s]/gi, "-");
    console.log("resplchaneresplchaneresplchane", resplchane);
    let newBlog = new Blogs({
      blog_category: req.body.maincategoryId,
      // meta_title : req.body.meta_title,
      // meta_description : req.body.meta_description,
      // meta_keywords : req.body.meta_keywords,
      // author : req.body.author,
      title: req.body.title,
      content: req.body.content,
      //image: req.file.filename,

      alttag: req.body.alttag,
      metatitle: req.body.metatitle,
      metadescription: req.body.metadescription,
      metakeywords: req.body.metakeywords,
      author: req.body.author,
      slug: resplchane,
      social_link1: req.body.social_link1,
      social_link2: req.body.social_link2,
      social_link3: req.body.social_link3,
      social_link4: req.body.social_link4,
      social_link5: req.body.social_link5,
      authorDetails: req.body.authorDetails,
      //promotion_image: req.file1.filename,
      alttag_pro: req.body.alttag_pro,

      date: req.body.date,
      status: req.body.status,
      // slug : req.body.slug
    });
    if (!isEmpty(reqFile.authorImage)) {
      newBlog["authorImage"] = reqFile.authorImage[0].filename;
    }
    if (!isEmpty(reqFile.file)) {
      newBlog["image"] = reqFile.file[0].filename;
    }

    if (!isEmpty(reqFile.file_pro)) {
      newBlog["promotion_image"] = reqFile.file_pro[0].filename;
    }

    let saveData = await newBlog.save();
    if (saveData) {
      return res.json({ status: true, message: "Blog Added Successfully" });
    }
  } catch (err) {
    console.log("resplchaneresplchaneresplchane", err);

    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const blogEdit = async (req, res) => {
  try {
    console.log(req.body, "booooddo");
    let reqFile = req.files;
    console.log(reqFile, "==reqFile");

    // return false
    // var blogCategoryId = JSON.parse(req.body.blog_category)
    //   if (req.file == undefined) {
    //   var update = {
    //     // blog_category : blogCategoryId,
    //     // meta_title : req.body.meta_title,
    //     // meta_description : req.body.meta_description,
    //     // meta_keywords : req.body.meta_keywords,
    //     // author : req.body.author,
    //     title: req.body.articledetails,
    //     content: req.body.content,
    //     // image : req.body.image,
    //     // slug : req.body.slug
    //   };
    // } else {

    console.log("resplchaneresplchaneresplchane", req.body);
    let rewhitespaceinslug = await req.body.slug.replace(/\s+/g, "-");
    let resplchane = await rewhitespaceinslug.replace(/[^\w\s]/gi, "-");
    console.log("resplchaneresplchaneresplchane", resplchane, req.body);
    var update = {
      blog_category: req.body.maincategoryId,
      // meta_title : req.body.meta_title,
      // meta_description : req.body.meta_description,
      // meta_keywords : req.body.meta_keywords,
      // author : req.body.author,
      title: req.body.title,
      content: req.body.content,
      alttag: req.body.alttag,
      metatitle: req.body.metatitle,
      metadescription: req.body.metadescription,
      metakeywords: req.body.metakeywords,
      author: req.body.author,
      slug: resplchane,
      social_link1: req.body.social_link1,
      social_link2: req.body.social_link2,
      social_link3: req.body.social_link3,
      social_link4: req.body.social_link4,
      social_link5: req.body.social_link5,
      authorDetails: req.body.authorDetails,
      //promotion_image: req.file1.filename,
      alttag_pro: req.body.alttag_pro,
      date: req.body.date,
      status: req.body.status,
      updated_date: new Date(),
    };
    // console.log("-----reqFile.image[0].filename", reqFile.file[0]);
    // console.log("-----reqFile.authorImage[0].filename", reqFile.authorImage[0]);

    if (!isEmpty(reqFile.file)) {
      update["image"] = reqFile.file[0].filename;
    }

    if (!isEmpty(reqFile.file_pro)) {
      update["promotion_image"] = reqFile.file_pro[0].filename;
    }
    if (!isEmpty(reqFile.authorImage)) {
      update["authorImage"] = reqFile.authorImage[0].filename;
    }

    //}

    let updateData = await Blogs.findOneAndUpdate(
      { _id: ObjectId(req.body._id) },
      { $set: update },
      { new: true }
    );
    console.log("updateData====", updateData);
    if (updateData) {
      return res.json({ status: true, message: "Blog Updated Successfully" });
    }
  } catch (err) {
    console.log(err, "dfdfdf");
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const blogEditData = async (req, res) => {
  try {
    let Data = await Blogs.findOne({ _id: req.body.id }).populate(
      "blog_category"
    );
    // let EditData  = {
    //   blog_category:Data.blog_category,
    //   meta_title:Data.meta_title,
    //   meta_description:Data.meta_description,
    //   meta_keywords:Data.meta_keywords,
    //   author:Data.author,
    //   title:Data.title,
    //   content:Data.content,
    //   imageUrl:Data.image,
    //   slug:Data.slug
    // }
    if (Data) {
      return res.json({ status: true, data: Data });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const getBlogAll = async (req, res) => {
  Blogs.find({}, (err, userData) => {
    if (err) {
      return res
        .status(200)
        .json({ success: false, errors: { messages: "Error on server" } });
    }

    return res.status(200).json({ success: true, cmsData: userData });
  });
};

export const changeTrendingPost = async (req, res) => {
  try {
    let blogData = await Blogs.findOne({ _id: req.body.id });
    var changeStatus;
    if (blogData.trendingPost == "1") {
      changeStatus = "0";
    } else if (blogData.trendingPost == "0") {
      changeStatus = "1";
    }

    let updateData = await Blogs.findOneAndUpdate(
      { _id: req.body.id },
      { $set: { trendingPost: changeStatus } },
      { new: true }
    );
    if (updateData) {
      return res
        .status(200)
        .json({ status: true, message: "Trending Post Updated Successfully" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const blogDelete = async (req, res) => {
  try {
    let deleteData = await Blogs.deleteOne({ _id: req.body._id });
    if (deleteData) {
      return res.json({ status: true, message: "Blog Deleted Successfully" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const categoryEdit = async (req, res) => {
  try {
    let reqBody = req.body;
    var update = {
      category_name: reqBody.categoryName,
      slug: reqBody.slug,
    };

    let checkCategory = await BlogCategory.findOne({
      category_name: reqBody.categoryName,
      _id: { $ne: reqBody._id },
    });
    if (checkCategory) {
      return res.status(400).json({
        success: false,
        errors: { categoryNameerr: "Category name already exists" },
      });
    }

   
    let updateData = await BlogCategory.findByIdAndUpdate(
      reqBody._id,
      { $set: update },
      { new: true }
    );
    if (updateData) {
      return res.json({
        status: true,
        message: "Category Updated Successfully",
      });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const categoryDelete = async (req, res) => {
  try {
    let reqBody = req.body;

    let deleteData = await BlogCategory.deleteOne({ _id: reqBody._id });
    // console.log(updateData,'updateDataupdateDataupdateData')
    if (deleteData) {
      return res.json({
        status: true,
        message: "Category Deleted Successfully",
      });
    }
  } catch (err) {
    console.log(err, "errr");
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const landingPage_getCategory = async (req, res) => {
  try {
    let data = await BlogCategory.find({}).sort({ _id: -1 });

    return res.status(200).json({ status: true, data: data });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const landingPage_getTrendingPost = async (req, res) => {
  try {
    let data = await Blogs.find({
      // trendingPost: "1",
      // slug:"1"
    })
      .limit(7)
      .sort({ _id: -1 });
    console.log(data, "datadatadata");
    return res.status(200).json({ status: true, data: data });
  } catch (err) {
    // console.log(err,'---->>err')
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const landingPage_getHomePageBlog = async (req, res) => {
  try {
    let record1 = await Blogs.find({})
      .populate("blog_category")
      .skip(0)
      .limit(4)
      .sort({ _id: -1 });
    let record2 = await Blogs.find({})
      .populate("blog_category")
      .skip(4)
      .limit(4)
      .sort({ _id: -1 });
    // console.log(data,'datadatadata')
    return res
      .status(200)
      .json({ status: true, data1: record1, data2: record2 });
  } catch (err) {
    // console.log(err,'---->>err')
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const landingPage_getBlogAll = async (req, res) => {
  try {
    console.log("yyyyyyyyyyyyyyyyyyyyyyyyyyy", req.query, req.body);
    let filter = filterSearchQuery(req.body, ["slug", "title"]);
    // filter.status = `{$nin:["Deactive"]}`;
    let page = req.query.page;
    if (req.body.categoryid != "All")
      filter.blog_category = req.body.categoryid;
    // let skip = page * 5;
    console.log("filter", filter);
    let totalCount = await Blogs.find({
      ...filter,
      status: { $nin: ["Deactive"] },
    }).countDocuments();
    let limit = req.body.perPage;
    let skip = (req.body.currentPage - 1) * limit;
    console.log("limit", limit);
    console.log("skip", skip);
    var nextBtnHidden;
    if (totalCount < skip + 5) {
      nextBtnHidden = false;
    } else if (totalCount < 5) {
      nextBtnHidden = false;
    } else {
      nextBtnHidden = true;
    }

    var prevBtnHidden;
    if (skip >= 5) {
      prevBtnHidden = true;
    } else {
      prevBtnHidden = false;
    }
    let data = await Blogs.find({ ...filter, status: { $nin: ["Deactive"] } })
      .populate("blog_category")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: true,
      data: data,
      nextBtn: nextBtnHidden,
      prevBtn: prevBtnHidden,
      totalCount: totalCount,
    });
  } catch (err) {
    console.log("err", err);
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const landingPage_getBlogBySlug = async (req, res) => {
  try {
    console.log("reqbodyddddddddddddd", req.body);
    // let data = await Blogs.findOne({ _id: req.body.blogid });
    let data = await Blogs.findOne({ slug: req.body.blogid });
    console.log("data123", data);

    return res.status(200).json({ status: true, data: data });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};
export const landingPage_getBlogBySlug1 = async (req, res) => {
  try {
    // let data = await Blogs.findOne({ _id: req.body.blogid });
    let data = await Blogs.findOne({ slug: req.body.blogid });

    return res.status(200).json({ status: true, data: data });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};
export const landingPage_getBlogCategorySlug = async (req, res) => {
  try {
    // console.log(req.body,'req.body.slugreq.body.slug')
    let BlogCategoryData = await BlogCategory.findOne({ slug: req.body.slug });
    let page = req.body.page;
    // let skip = page * 5;
    let limit = req.body.perPage;
    let skip = (req.body.currentPage - 1) * limit;
    let totalCount = await Blogs.find({
      blog_category: BlogCategoryData._id,
    }).countDocuments();

    var nextBtnHidden;
    if (totalCount < skip + 5) {
      nextBtnHidden = false;
    } else if (totalCount < 5) {
      nextBtnHidden = false;
    } else {
      nextBtnHidden = true;
    }

    var prevBtnHidden;
    if (skip >= 5) {
      prevBtnHidden = true;
    } else {
      prevBtnHidden = false;
    }
    let data = await Blogs.find({ blog_category: BlogCategoryData._id })
      .populate("blog_category")
      .skip(skip)
      .limit(5);
    console.log(data, "datadatadata");
    return res.status(200).json({
      status: true,
      data: data,
      nextBtn: nextBtnHidden,
      prevBtn: prevBtnHidden,
      totalCount: totalCount,
    });
  } catch (err) {
    console.log(err, "---->>err");
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const userData = async (req, res) => {
  try {
    let data = await User.find({}).select(["-password"]).sort({ _id: -1 });

    return res.status(200).json({ status: true, data: data });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const userChangeStatus = async (req, res) => {
  var pdata = req.body;

  User.findOne({ _id: pdata }, { active: 1 }).then((results) => {
    try {
      if (results.active != "Activated") {
        var title = "Activated";
      } else {
        var newstatus = 1;
        var title = "DeActivated";
        // var title = "";
      }

      User.findOneAndUpdate(
        { _id: pdata },
        { $set: { active: title } },
        { new: true }
      ).exec(function (uperr, resUpdate) {
        console.log(resUpdate, "resUpdate");
        if (!uperr) {
          // console.log(resUpdate);
          res.json({
            status: true,
            message: "Page status " + title + " successfully",
          });
        } else {
          res.json({
            status: false,
            message: "Some error was occurred while updating user status",
          });
        }
      });
    } catch (err) {
      console.log(err, "err");
      res.json({
        status: false,
        message: "Some error was occurred while updating user status" + err,
      });
    }
  });
};

export const userDelete = async (req, res) => {
  try {
    User.deleteOne({ _id: req.body._id }).then((user) => {
      if (user) {
        return res.status(200).json({
          message: "User deleted successfully. Refreshing data...",
          success: true,
        });
      }
    });
  } catch (err) {
    res.json({
      status: false,
      message: "Some error was occurred while updating user status" + err,
    });
  }
};

export const userDeactivate = async (req, res) => {
  try {
    var update = {
      active: "deactive",
    };
    let updateData = await User.findOneAndUpdate(
      { _id: req.body._id },
      { $set: update }
    );
    if (updateData) {
      console.log("updateData---", updateData);
      return res
        .status(200)
        .json({ message: "User Deactivated successfully.", success: true });
    } else {
      //console.log("")
      return res.status(400).json({
        message: "Problem Occured while deactivating",
        success: false,
      });
    }
  } catch (err) {
    res.json({
      status: false,
      message: "Some error was occurred while updating user status" + err,
    });
  }
};

export const updateSiteSetting = async (req, res) => {
  try {
    let siteSettingData = await SiteSetting.findOne();

    if (!siteSettingData) {
      return res.status(400).json({ success: false, message: "No record" });
    }
    let reqBody = req.body;

    siteSettingData.marketTrend = reqBody.marketTrend
      ? reqBody.marketTrend
      : siteSettingData.marketTrend;

    let updateData = await siteSettingData.save();

    let result = {
      marketTrend: updateData.marketTrend,
    };

    return res
      .status(200)
      .json({ success: true, message: "Successfully set", result: result });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const getPairDropdown = async (req, res) => {
  try {
    let spotPair = await SpotPair.find(
      { status: "active" },
      { firstCurrencySymbol: 1, secondCurrencySymbol: 1 }
    );
    if (spotPair && spotPair.length > 0) {
      return res
        .status(200)
        .json({ success: true, message: "Fetch success", result: spotPair });
    }
    return res.status(400).json({ success: false, message: "No record" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const getBlog_recent = async (req, res) => {
  var blogdetails = await Blogs.findOne({ slug: req.body.blogid });
  if (blogdetails) {
    try {
      let userData = await Blogs.find({
        slug: { $ne: req.body.blogid },

        blog_category: blogdetails.blog_category,
      })
        .limit(3)
        .sort({ _id: -1 });
      console.log("blogdetailsblogdetailsblogdetailsblogdetails", userData);
      return res.status(200).json({ success: true, data: userData });
    } catch (err) {
      console.log("errerrerrerrerr", err);
      return res
        .status(200)
        .json({ success: false, errors: { messages: "Error on server" } });
    }
  }
};

export const addSubscription = async (req, res) => {
  try {
    var check = await newsletter_subscriber.findOne({ email: req.body.email });
    if (!check) {
      let reqBody = req.body;
      const newsletter = new newsletter_subscriber({
        name: reqBody.name,
        email: reqBody.email,
      });

      let saveData = await newsletter.save();
      console.log(saveData, "dataaaaaaaaa");
      if (saveData) {
        return res.status(200).json({
          status: true,
          message: "Newsletter Subscribed Successfully",
        });
      }
    } else {
      return res
        .status(400)
        .json({ success: false, errors: { email: "Email already exists" } });
    }
  } catch (err) {
    console.log(err, "blog eeeee");
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};
