// import package
import node2fa from "node-2fa";
import mongoose from "mongoose";
import multer from "multer";

// import controller
import * as ethGateway from "./coin/ethGateway";
import { mailTemplateLang, mailTemplate } from "./emailTemplate.controller";

// import modal
import { SupportCategory, SupportTicket, User, Admin } from "../models";
import TicketSupport from "../models/SupportTicket";

import isEmpty from "../lib/isEmpty";
import config from "../config";
import path from 'path';
// import lib
import { IncCntObjId } from "../lib/generalFun";
import {
  paginationQuery,
  filterQuery,
  filterProofQuery,
  filterSearchQuery,
} from "../lib/adminHelpers";
// import key from '../lib/config';
import { dateTimeFormat } from "../lib/dateHelper";

//import  controller
import { newNotification } from "./notification.controller";

const ObjectId = mongoose.Types.ObjectId;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname == "file") {
      cb(null, config.IMAGE.SUPPORT_PATH);
    } /*else{
        cb(null, config.IMAGE.CURRENCY_PATH)
      }*/
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage });
export const supportUpload = upload.fields([{ name: "file", maxCount: 1 }]);

var storage_editor = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname == "file") {
      cb(null, config.IMAGE.EDITOR_PATH);
    } /*else{
        cb(null, config.IMAGE.CURRENCY_PATH)
      }*/
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage_editor });
export const tinymceUpload = upload.fields([{ name: "file", maxCount: 1 }]);

const supportStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(file,'----file')
      cb(null, config.IMAGE.SUPPORT_PATH);
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    console.log(file,'----file1111')
      cb(null, 'file-' + Date.now() + path.extname(file.originalname));
  }
});

let suppportUpload = multer({
  storage: supportStorage,

}).fields([
   { name: 'supportimage', maxCount: 1 },
 ])



export const supportimg = (req, res, next) => {
 suppportUpload(req, res, function (err) {
  
      if (err instanceof multer.MulterError) {
          return res.status(400).json({ "success": false, 'errors':  "TOO_LARGE"  })
      }
      else if (err) {
          return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
      }
      return next();
  })
}

/**
 * Add Support Cateogory
 * URL: /adminapi/supportCategory
 * METHOD : POST
 * BODY : categoryName
 */
export const addSupportCategory = async (req, res) => {
  try {
    let reqBody = req.body;
    if (reqBody.categoryName == "") {
      return res.status(400).json({
        success: false,
        errors: { categoryName: "please enter category name" },
      });
    }
    let checkCategory = await SupportCategory.findOne({
      categoryName: reqBody.categoryName,
    });
    if (checkCategory) {
      return res.status(400).json({
        success: false,
        errors: { categoryName: "category name already exists" },
      });
    }
    let newDoc = new SupportCategory({
      categoryName: reqBody.categoryName,
    });
    await newDoc.save();
    return res
      .status(200)
      .json({ success: false, result: { messages: "Added successfully" } });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

/**
 * Edit Support Cateogory
 * URL: /adminapi/supportCategory
 * METHOD : PUT
 * BODY : categoryName, status, categoryId
 */
export const editSupportCategory = async (req, res) => {
  try {
    let reqBody = req.body;
    let checkCategory = await SupportCategory.findOne({
      categoryName: reqBody.categoryName,
      _id: { $ne: reqBody.categoryId },
    });
    if (checkCategory) {
      return res.status(400).json({
        success: false,
        errors: { categoryName: "category name already exists" },
      });
    }
    await SupportCategory.updateOne(
      { _id: reqBody.categoryId },
      {
        $set: {
          categoryName: reqBody.categoryName,
          status: reqBody.status,
        },
      }
    );
    return res
      .status(200)
      .json({ success: false, result: { messages: "update successfully" } });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

/**
 * Get Support Cateogory
 * URL: /adminapi/supportCategory
 * METHOD : GET
 */
export const getSupportCategory = (req, res) => {
  SupportCategory.find(
    {},
    { categoryName: 1, status: 1 },
    (err, categoryData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, errors: { messages: "Error on server" } });
      }
      return res
        .status(200)
        .json({ success: true, result: { data: categoryData } });
    }
  );
};

/**
 * Get Support Category for drop down
 * URL: /api/getSptCat
 * METHOD : GET
 */
export const getSptCat = (req, res) => {
  SupportCategory.find(
    { status: "active" },
    { categoryName: 1 },
    (err, categoryData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, errors: { messages: "Error on server" } });
      }
      return res.status(200).json({ success: true, result: categoryData });
    }
  );
};

/**
 * Get Single Support Cateogory
 * URL: /adminapi/getSingleSupportCategory
 * METHOD : GET
 * PARAMS : categoryId
 */
export const getSingleSupportCategory = (req, res) => {
  SupportCategory.findOne(
    { _id: req.params.categoryId },
    { categoryName: 1 },
    (err, categoryData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, errors: { messages: "Error on server" } });
      }
      return res.status(200).json({ success: true, result: categoryData });
    }
  );
};

/**
 * Create New Ticket
 * URL: /api/ticket
 * METHOD : POST
 * BODY : categoryId, message
 */
export const createNewTicket = async (req, res) => {
  try {
    let reqBody = req.body;
    let reqFile = req.files;
    let adminDetail = await Admin.findOne({ role: "superadmin" });

    if (!adminDetail) {
      return res
        .status(500)
        .json({ success: false, message: "Error on server" });
    }

    // console.log("filessss",reqFile)

    let newDoc = new SupportTicket({
      userId: req.user.id,
      adminId: adminDetail._id,
      categoryId: reqBody.categoryId,
      createdAt:Date.now(),
      reply: [
        {
          senderId: req.user.id,
          receiverId: adminDetail._id,
          message: reqBody.message,
          file: !isEmpty(reqFile && reqFile.file)
            ? reqFile.file[0].filename
            : "",
        },
      ],
    });
    newDoc.tickerId = IncCntObjId(newDoc._id);

    let ticketData = await newDoc.save();
    let usrData = await User.findOne({ _id: req.user.id });
    if (usrData) {
      let content = {
        ID: ticketData.tickerId,
        ticketId: ticketData.tickerId,
      };

      mailTemplateLang({
        userId: usrData._id,
        identifier: "new_support_ticket_user",
        toEmail: usrData.email,
        content,
      });
    }
    newNotification({
      userId:usrData._id ,
      type: "New Support Ticket Created",
      description: "New Support Ticket Created Successfully",
      createdAt: new Date(),
    });
    
    newNotification({
      adminId: adminDetail._id,
      viewType:'admin',
      type: "New Support Ticket Rised",
      description: "user Rised  Support Ticket...",
      createdAt: new Date(),
    });

    if (adminDetail) {
      let content = {
        ID: ticketData.tickerId,
      };
      mailTemplate("new_support_ticket_admin", adminDetail.email, content);
    }

    return res
      .status(200)
      .json({ success: true, message: "Ticket raise successfully" });
  } catch (err) {
    console.log("ERESDS SUPORT ", err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * User Ticket List
 * URL: /api/ticket
 * METHOD : GET
 */
export const userTicketList = async (req, res) => {
  try {
    let userData = await User.findOne(
      { _id: req.user.id },
      {
        _id: 1,
        firstName: 1,
      }
    );
    if (userData) {
      let adminData = await Admin.findOne(
        { role: "superadmin" },
        {
          _id: 1,
          name: 1,
        }
      );

      if (adminData) {
        let tickerData = await SupportTicket.aggregate([
          { $match: { userId: ObjectId(req.user.id) } },
     
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "supportcategory",
              localField: "categoryId",
              foreignField: "_id",
              as: "categoryInfo",
            },
          },
          { $unwind: "$categoryInfo" },

          {
            $project: {
              _id: 1,
              categoryName: "$categoryInfo.categoryName",
              tickerId: 1,
              status: 1,
              userId: 1,
              adminId: 1,
              reply: 1,
              createdAt: 1,
            },
          },
        ]);

        if (tickerData) {
          let result = {
            ticketList: tickerData,
            sender: userData,
            receiver: adminData,
          };
          return res.status(200).json({ success: true, result });
        }
      }
    }
    return res.status(400).json({ success: false, message: "NO_DATA" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * User Reply Message
 * URL: /api/ticket
 * METHOD : PUT
 * BODY : ticketId, receiverId, message
 */
export const usrReplyMsg = (req, res) => {
  let reqBody = req.body;
  if(req.files&& req.files.supportimage){
    var supportImage=req.files.supportimage[0].filename
}else{
    var supportImage=""
}
  SupportTicket.findOneAndUpdate(
    {
      _id: reqBody.ticketId,
      userId: req.user.id,
      adminId: reqBody.receiverId,
    },
    {
      $push: {
        reply: {
          senderId: req.user.id,
          receiverId: reqBody.receiverId,
          message: reqBody.message,
          file:supportImage,
        },
      },
    },
    { new: true },
    (err, ticketData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Something went wrong" });
      } else if (!ticketData) {
        return res.status(400).json({ success: false, message: "No records" });
      }

      return res.status(200).json({
        success: true,
        message: "Successfully reply the message",
        result: ticketData.reply,
      });
    }
  );
};

/**
 * Closed Ticket
 * URL: /api/ticket
 * METHOD : PATCH
 * BODY: ticketId
 */
export const closeTicket = (req, res) => {
  let reqBody = req.body;

  TicketSupport.findOneAndUpdate(
    {
      _id: reqBody.ticketId,
      userId: req.user.id,
    },
    { status: "closed" },
    {
      fields: {
        _id: 0,
        status: 1,
      },
      new: true,
    },
    (err, ticketData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "SOMETHING_WRONG" });
      } else if (!ticketData) {
        return res.status(400).json({ success: false, message: "NO_DATA" });
      }
      return res.status(200).json({
        success: true,
        message: "Ticket closed successfully",
        result: ticketData,
      });
    }
  );
};

/**
 * Get Ticket Message List
 * URL: adminapi/ticketMessage
 * METHOD : GET
 * QUERY: ticketId
 */
export const getTicketMessage = (req, res) => {
  let reqQuery = req.query;
  TicketSupport.aggregate(
    [
      {
        $match: {
          _id: ObjectId(reqQuery.ticketId),
          // adminId: req.user.id,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      // {
      //   $lookup: {
      //     from: "admins",
      //     localField: "$req.user.id",
      //     foreignField: "_id",
      //     as: "adminInfo",
      //   },
      // },
      // { $unwind: "$adminInfo" },
      {
        $project: {
          userId: 1,
          userName: "$userInfo.firstName",
          adminId: 1,
          adminName: "Admin",
          tickerId: 1,
          reply: 1,
          status: 1,
        },
      },
    ],
    (err, ticketData) => {
      if (err) {

        return res
          .status(500)
          .json({ success: false, message: "Error on server" });
      } else if (ticketData && ticketData.length > 0) {
        return res.status(200).json({ success: true, result: ticketData[0] });
      }
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }
  );
};

/**
 * Admin Reply Message
 * URL: /adminapi/ticketMessage
 * METHOD : PUT
 * BODY : ticketId, receiverId, message
 */
export const replyMessage = async(req, res) => {
  let reqBody = req.body;
  let adminDetail = await Admin.findOne({ role: "superadmin" });


  SupportTicket.findOneAndUpdate(
    {
      _id: reqBody.ticketId,
      userId: reqBody.receiverId,
      // adminId: req.user.id,
    },
    {
      $push: {
        reply: {
          senderId: adminDetail._id,
          receiverId: reqBody.receiverId,
          message: reqBody.message,
        },
      },
    },
    { new: true },
    async (err, ticketData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Something went wrong" });
      } else if (!ticketData) {
        return res.status(400).json({ success: false, message: "No records" });
      }

      let usrData = await User.findOne({ _id: reqBody.receiverId });

      if (usrData) {
        let content = {
          date: dateTimeFormat(new Date().toString(), "YYYY-MM-DD HH:MM:SS"),
        };

        newNotification({
          userId: usrData._id,
          type: "Support Team Reply",
          description: "Support team replied to your ticket",
         
        });

        mailTemplateLang({
          userId: usrData._id,
          identifier: "support_ticket_reply",
          toEmail: usrData.email,
          content,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Reply the message send successfully ",
        result: ticketData,
      });
    }
  );
};


/**
 * Admin clsoe ticket Message
 * URL: /adminapi/ticketMessage
 * METHOD : delete
 * BODY : ticketId, receiverId, 
 */
export const adminCloseTicket = async(req, res) => {
  let reqBody = req.body;


  SupportTicket.findOneAndUpdate(
    {
      _id: reqBody.ticketId,
      userId: reqBody.receiverId,
      // adminId: req.user.id,
    },
    { status: "closed" },
    {
      fields: {
        _id: 0,
        status: 1,
      },
      new: true,
    },
    
    async (err, ticketData) => {
      if (err) {
        console.log("aaaaaaaa",err);
        return res
          .status(500)
          .json({ success: false, message: "Something went wrong" });
      } else if (!ticketData) {
        return res.status(400).json({ success: false, message: "No records" });
      }

      newNotification({
        userId: reqBody.receiverId,
        type: "Support Ticket Closed",
        description: "Support team closed your ticket",
       
      });

      return res.status(200).json({
        success: true,
        message: "Ticket closed successfully",
        result: ticketData,
      });
    }
  );
};
/**
 * Get Overall Ticket List
 * URL: /adminapi/ticketList
 * METHOD : GET
 */
export const getTicketList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, [
      "email",
      "createdAt",
      "status",
      "tickerId",
      "userName",
      "categoryName",
    ]);

    let count = await TicketSupport.countDocuments();

    let data = await TicketSupport.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },
      { $skip: pagination.skip },
      { $limit: pagination.limit },

      {
        $lookup: {
          from: "supportcategory",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$categoryInfo" },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
   
      {
        $project: {
          _id: 1,
          tickerId: 1,
          categoryName: "$categoryInfo.categoryName",
          userName: "$userInfo.firstName",
          email: "$userInfo.email",
          userId: 1,
          adminId: 1,
          status: 1,
          createdAt: 1,
        },
      },
      { $match: filter },
    ]);

    let respData = {
      count: count,
      data,
    };
    return res.status(200).json({ success: true, result: respData });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

/**
 * Ticket List
 * URL: /adminapi/ticketList
 * METHOD : POST
 */
export const ticketList = async (req, res) => {
  TicketSupport.aggregate(
    [
      { $match: { _id: ObjectId(req.params.ticketId) } },
      {
        $lookup: {
          from: "supportCategory",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$categoryInfo" },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },

      {
        $lookup: {
          from: "admins",
          localField: "adminId",
          foreignField: "_id",
          as: "adminInfo",
        },
      },
      { $unwind: "$adminInfo" },

      {
        $project: {
          _id: 1,
          categoryName: "$categoryInfo.categoryName",
          status: 1,
          userName: "$userInfo.firstName",
          adminName: "$adminInfo.name",
          userId: 1,
          adminId: 1,
          createdAt: 1,
        },
      },
    ],
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, errors: { messages: "Error on server" } });
      }
      if (data.length <= 0) {
        return res
          .status(400)
          .json({ success: false, errors: { messages: "No chart" } });
      }
      return res.status(200).json({ success: true, result: data[0] });
    }
  );
};
