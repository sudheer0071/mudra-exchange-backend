// import package
import mongoose from "mongoose";
import { Unreadsocket } from "./notification.controller";

// import modal
import {
  User,
  Transaction,
  Notification,
  SiteSetting,
  Assets,
  SpotTrade,
} from "../models";

const ObjectId = mongoose.Types.ObjectId;

/**
 * Get Recent Transaction
 * URL : /api/recentTransaction
 * METHOD : GET
 */
export const getRecentTransaction = (req, res) => {
  Transaction.find(
    {
      userId: req.user.id,
    },
    {
      createdAt: 1,
      paymentType: 1,
      currencySymbol: 1,
      actualAmount: 1,
      amount: 1,
      txid: 1,
      status: 1,
    }
  )
    .sort({ createdAt: -1 })
    .limit(5)
    .exec((err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "SOMETHING_WRONG" });
      }
      return res.status(200).json({ success: true, result: data });
    });
};

/**
 * Get Login History
 * URL : /api/loginHistory
 * METHOD : GET
 */
export const getLoginHistory = (req, res) => {
  User.aggregate(
    [
      { $match: { _id: ObjectId(req.user.id) } },
      { $unwind: "$loginhistory" },
      { $sort: { "loginhistory.createdDate": -1 } },
      { $limit: 5 },
      {
        $project: {
          createdDate: "$loginhistory.createdDate",
          ipaddress: "$loginhistory.ipaddress",
          regionName: "$loginhistory.regionName",
          countryName: "$loginhistory.countryName",
          broswername: "$loginhistory.broswername",
          os: "$loginhistory.os",
          status: "$loginhistory.status",
        },
      },
    ],
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "SOMETHING_WRONG" });
      }
      return res.status(200).json({ success: true, result: data });
    }
  );
};

/**
 * Get Notification History
 * URL : /api/notificationHistory
 * METHOD : GET
 */
export const getNotificationHistory = async (req, res) => {
  try {
    var unread_count = await Notification.find({
      userId: req.user.id,
      noti_view_status: false,
    }).countDocuments();
  } catch (err) {
    console.log(err, "ererere");
  }

  Notification.find({
    userId: req.user.id,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .exec((err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "SOMETHING_WRONG" });
      }

      return res
        .status(200)
        .json({ success: true, result: data, unread_count: unread_count });
    });
};

export const getNotificationHistoryAll = async (req, res) => {
  Notification.find({
    userId: req.user.id,
  })
    .sort({ createdAt: -1 })
    .exec((err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "SOMETHING_WRONG" });
      }
      return res.status(200).json({ success: true, result: data });
    });
};

export const getNotificationHistory_read = async (req, res) => {
  var updateVal = {};
  updateVal.noti_view_status = true;
  await Notification.updateMany(
    { userId: req.user.id },
    { $set: updateVal },
    { new: true }
  );

  Unreadsocket(req.user.id);
};

/**
 * Get Dashboard Balance Detail
 * URL : /api/getDashBal
 * METHOD : GET
 */
export const getDashBal = async (req, res) => {
  try {
  
    const siteSetting = await SiteSetting.findOne({}, { userDashboard: 1 });
    if (siteSetting) {
      let currencyId = siteSetting.userDashboard.map((item) => item.currencyId);

      if (currencyId && currencyId.length > 0) {
        let userAsset = await Assets.aggregate([{
          $match: {
            userId: req.user.id,
            currency: { $in: currencyId },
          },
        },
        {
          $lookup: {
            from: "currency",
            localField: "currency",
            foreignField: "_id",
            as: "currencyInfo",
          },
        },
        { $unwind: "$currencyInfo" },
        {
          $project: {
            _id: 0,
            currency: 1,
            currencySymbol: 1,
            p2pbalance: 1,
            spotwallet: 1,
          },
        }]);

        if (userAsset && userAsset.length > 0) {
          let result = [];
          userAsset.map((item) => {
            let findData = siteSetting.userDashboard.find((el) => el.currencyId == item.currency.toString());
            if (findData) {
              result.push({ ...item, ...{ colorCode: findData.colorCode } });
            }
          });
          return res.status(200).json({ success: true, message: "Fetch success", result });
        }
      }
      return res.status(400).json({ success: false, message: "no record" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

export const gettradehistory_dash_old = (req, res) => {
  SpotTrade.find({
    userId: req.user.id,
    status: "completed",
  })
    .sort({ createdAt: -1 })
    .exec((err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "SOMETHING_WRONG" });
      }
      return res.status(200).json({ success: true, result: data });
    });
};

export const getorderhistory_dash = (req, res) => {
  SpotTrade.find({
    userId: req.user.id,
  })
    .sort({ createdAt: -1 })
    .exec((err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "SOMETHING_WRONG" });
      }
      return res.status(200).json({ success: true, result: data });
    });
};

/**
 * Get User Trade History
 * URL : /api/spot/tradeHistory/{{pairId}}
 * METHOD : GET
 * Query : page, limit
 */
export const gettradehistory_dash = async (req, res) => {
  try {
    let data = await SpotTrade.aggregate([
      {
        $match: {
          userId: ObjectId(req.user.id),
          status: {
            $in: ["pending", "completed", "cancel"],
          },
        },
      },
      { $unwind: "$filled" },
      { $sort: { createdAt: -1 } },

      {
        $project: {
          createdAt: 1,
          firstCurrency: 1,
          secondCurrency: 1,
          buyorsell: 1,
          price: "$filled.price",
          filledQuantity: "$filled.filledQuantity",
          Fees: "$filled.Fees",
          orderValue: "$filled.orderValue",
        },
      },
    ]);

    return res.status(200).json({ success: true, result: data });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};
