// import package
import mongoose from "mongoose";

// import model
import {
  Staking,
  StakingOrder,
  Assets,
  StakingSettle,
  Currency,
  SiteSetting,
} from "../models";

// import config
import config from "../config";
import { flexibleSettleTask, redemListTask } from "../config/cron";

// import lib
import isEmpty from "../lib/isEmpty";
import { toFixed } from "../lib/roundOf";
import { findBtwDates, dateTimeFormat } from "../lib/dateHelper";
import { interestByDays } from "../lib/calculation";
import { paginationQuery } from "../lib/adminHelpers";

const ObjectId = mongoose.Types.ObjectId;

/**
 * Add Staking
 * URL : /adminapi/staking
 * METHOD : POST
 * BODY : currencyId, minimumAmount, maximumAmount, redemptionPeriod, type, periodList(days,APY), flexibleAPY, status
 */
export const addStaking = async (req, res) => {
  try {
    let reqBody = req.body;
    let checkStake = await Staking.findOne({ currencyId: reqBody.currencyId });
    if (checkStake) {
      return res
        .status(400)
        .json({ errors: { currencyId: "Staking currency already exists" } });
    }

    let periodList = [];

    if (reqBody.type.some((r) => ["fixed"].includes(r))) {
      for (let item of reqBody.periodList) {
        if (
          !isEmpty(item.days) &&
          !isNaN(item.days) &&
          !isEmpty(item.APY) &&
          !isNaN(item.APY)
        ) {
          periodList.push(item);
        }
      }

      if (periodList.length == 0) {
        reqBody.type.splice(reqBody.type.indexOf("fixed"), 1);
      }
    }

    const newDoc = new Staking({
      currencyId: reqBody.currencyId,
      minimumAmount: reqBody.minimumAmount,
      maximumAmount: reqBody.maximumAmount,
      redemptionPeriod: reqBody.redemptionPeriod,
      type: reqBody.type,
      flexibleAPY: reqBody.flexibleAPY,
      periodList: periodList,
    });

    await newDoc.save();

    return res.status(200).json({
      success: true,
      message: "Staking added successfully. Refreshing data...",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

/**
 * Edit Staking
 * URL : /adminapi/staking
 * METHOD : GET
 */
export const stakingList = (req, res) => {
  Staking.aggregate(
    [
      { $sort: { _id: -1 } },
      {
        $lookup: {
          from: "currency",
          localField: "currencyId",
          foreignField: "_id",
          as: "currencyInfo",
        },
      },
      { $unwind: "$currencyInfo" },
      {
        $project: {
          currencyId: 1,
          currencySymbol: "$currencyInfo.currencySymbol",
          minimumAmount: 1,
          maximumAmount: 1,
          redemptionPeriod: 1,
          type: 1,
          flexibleAPY: 1,
          periodList: 1,
          status: 1,
        },
      },
    ],
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Something went wrong" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Fetch successfully", result: data });
    }
  );
};

/**
 * Edit Staking
 * URL : /adminapi/staking
 * METHOD : PUT
 * BODY : stakingId, currencyId, minimumAmount, maximumAmount, redemptionPeriod, type(fixed,flexible), flexibleAPY, flexibleAPY, periodList(days,APY)
 */
export const editStaking = async (req, res) => {
  try {
    let reqBody = req.body;
    let checkStake = await Staking.findOne({
      currencyId: reqBody.currencyId,
      _id: { $ne: reqBody.stakingId },
    });
    if (checkStake) {
      return res
        .status(400)
        .json({ errors: { currencyId: "Staking currency already exists" } });
    }

    let periodList = [];

    if (reqBody.type.some((r) => ["fixed"].includes(r))) {
      for (let item of reqBody.periodList) {
        if (
          !isEmpty(item.days) &&
          !isNaN(item.days) &&
          !isEmpty(item.APY) &&
          !isNaN(item.APY)
        ) {
          periodList.push(item);
        }
      }

      if (periodList.length == 0) {
        reqBody.type.splice(reqBody.type.indexOf("fixed"), 1);
      }
    }

    let stakingData = await Staking.findOne({ _id: reqBody.stakingId });
    if (!stakingData) {
      return res
        .status(400)
        .json({ success: false, message: "There is no data" });
    }

    stakingData.currencyId = reqBody.currencyId;
    stakingData.minimumAmount = reqBody.minimumAmount;
    stakingData.maximumAmount = reqBody.maximumAmount;
    stakingData.redemptionPeriod = reqBody.redemptionPeriod;
    stakingData.type = reqBody.type;
    stakingData.flexibleAPY = reqBody.flexibleAPY;
    stakingData.periodList = periodList;
    stakingData.status = reqBody.status;

    await stakingData.save();

    return res.status(200).json({
      success: true,
      message: "Staking updated successfully. Refreshing data...",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

/**
 * Get Staking
 * URL : /api/getStaking
 * METHOD : GET
 */
export const getStaking = async (req, res) => {
  Staking.aggregate(
    [
      { $match: { status: "active" } },
      {
        $lookup: {
          from: "currency",
          localField: "currencyId",
          foreignField: "_id",
          as: "currencyInfo",
        },
      },
      { $unwind: "$currencyInfo" },
      {
        $project: {
          currencyId: 1,
          currencyImage: {
            $cond: [
              { $eq: ["$currencyImage", ""] },
              "",
              {
                $concat: [
                  config.SERVER_URL,
                  config.IMAGE.CURRENCY_URL_PATH,
                  "$currencyImage",
                ],
              },
            ],
          },
          currencySymbol: "$currencyInfo.currencySymbol",
          currencyName: "$currencyInfo.currencyName",
          flexibleAPY: 1,
          type: 1,
          minimumAmount: 1,
          maximumAmount: 1,
          redemptionPeriod: 1,
        },
      },
    ],
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Something went wrong" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Fetch successfully", result: data });
    }
  );
};

/**
 * Staking order place
 * URL : /api/stake/orderPlace
 * METHOD : POST
 * BODY : stakeId, type, price, isTerms
 */
export const orderPlace = async (req, res) => {
  try {
    let reqBody = req.body;

    reqBody.price = parseFloat(reqBody.price);

    let checkStake = await Staking.findOne({ _id: reqBody.stakeId }).populate({
      path: "currencyId",
      select: "currencySymbol currencyImage currencyName",
    });
    let checkStackingOrder = await StakingOrder.find({
      currencyId: checkStake && checkStake.currencyId,
    }).count();
    if (!checkStake) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid staking" });
    }
    if (checkStackingOrder >= checkStake.maximumAmount) {
      return res
        .status(400)
        .json({ success: false, message: "cross your Maximum subscription" });
    }
    if (checkStake && !checkStake.currencyId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid currency" });
    }

    if (checkStake.status != "active") {
      return res.status(400).json({ success: false, message: "Deactive" });
    }

    let userAsset = await Assets.findOne({
      userId: req.user.id,
      currency: checkStake.currencyId._id,
    });

    if (!userAsset) {
      return res.status(400).json({ success: false, message: "Invalid asset" });
    }

    if (userAsset.spotwallet < reqBody.price) {
      return res.status(400).json({
        success: false,
        message: "There is not enough asset in your balance.",
      });
    }

    userAsset.spotwallet = userAsset.spotwallet - reqBody.price;
    let updateAsset = await userAsset.save();

    let nowDate = new Date();
    let orderDate = nowDate.setSeconds(0, 0);
    let nextSettleDate = nowDate.setDate(
      nowDate.getDate() + checkStake.settlementPeriod
    );

    let newDoc = new StakingOrder({
      userId: req.user.id,
      currencyId: checkStake.currencyId._id,
      stakeId: checkStake._id,
      amount: reqBody.price,
      type: reqBody.type,
      APY: checkStake.flexibleAPY,
      redemptionPeriod: checkStake.redemptionPeriod,
      createdAt: orderDate,
      settlementPeriod: checkStake.settlementPeriod,
      settleStartDate: orderDate,
      settleEndDate: nextSettleDate,
      duration: 365,
    });

    let newOrder = await newDoc.save();

    let result = {
      wallet: {
        userAssetId: updateAsset._id,
        spotwallet: updateAsset.spotwallet,
      },
      orderData: {
        currencyId: newOrder.currencyId,
        currencyImage: `${config.SERVER_URL}${config.IMAGE.CURRENCY_URL_PATH}${checkStake.currencyId.currencyImage}`,
        currencySymbol: checkStake.currencyId.currencySymbol,
        currencyName: checkStake.currencyId.currencyName,
        createdAt: dateTimeFormat(newOrder.createdAt, "YYYY-MM-DD HH:ss"),
        APY: newOrder.APY,
        amount: newOrder.amount,
        status: newOrder.status,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Staking order added successfully.",
      result: result,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

/**
 * Stake order List
 * URL : /api/stake/orderList
 * METHOD : GET
 */
export const orderList = (req, res) => {
  try {
    StakingOrder.aggregate(
      [
        { $match: { userId: ObjectId(req.user.id) } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "currency",
            localField: "currencyId",
            foreignField: "_id",
            as: "currencyInfo",
          },
        },
        { $unwind: "$currencyInfo" },
        {
          $project: {
            currencyId: 1,
            currencyImage: {
              $cond: [
                { $eq: ["$currencyImage", ""] },
                "",
                {
                  $concat: [
                    config.SERVER_URL,
                    config.IMAGE.CURRENCY_URL_PATH,
                    "$currencyImage",
                  ],
                },
              ],
            },
            currencySymbol: "$currencyInfo.currencySymbol",
            currencyName: "$currencyInfo.currencyName",
            createdAt: {
              $dateToString: {
                date: "$createdAt",
                format: "%Y-%m-%d %H:%M",
              },
            },
            APY: 1,
            amount: 1,
            status: 1,
          },
        },
      ],
      (err, data) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "Something went wrong" });
        }
        return res
          .status(200)
          .json({ success: true, message: "Fetch successfully", result: data });
      }
    );
  } catch (err) {}
};

/**
 * Stake order Cancel
 * URL : /api/stake/cancel
 * METHOD : DELETE
 * PARAMS : stakeId
 */
export const cancelOrder = async (req, res) => {
  try {
    let stakeOrder = await StakingOrder.findOne({
      _id: req.params.stakeId,
    }).populate({
      path: "currencyId",
      select: "currencySymbol currencyImage currencyName type" , 
    });
    if (!stakeOrder) {
      return res
        .status(400)
        .json({ success: false, message: "There is no record" });
    }

    if (["cancel_user", "cancel_date"].includes(stakeOrder.status)) {
      return res
        .status(400)
        .json({ success: false, message: "Already cancelled" });
    }

    if (stakeOrder && !stakeOrder.currencyId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid currency" });
    }

    let nowDate = new Date();
    let orderDate = nowDate.setSeconds(0, 0);
    let nextSettleDate = nowDate.setDate(
      nowDate.getDate() + stakeOrder.redemptionPeriod
    );

    stakeOrder.status = "cancel_user";
    stakeOrder.cancelDate = orderDate;
    stakeOrder.redemDate = nextSettleDate;
    stakeOrder.redemStatus = "process";

    let getHours = findBtwDates(stakeOrder.settleStartDate, orderDate, "hours");

    let updateOrder = await stakeOrder.save();

    let getDays = Math.floor(getHours / 24);
    let interestPerDay = toFixed(
      interestByDays(stakeOrder.amount, stakeOrder.APY, 365),
      8
    );

    let newSettlement = new StakingSettle({
      userId: stakeOrder.userId,
      currencyId: stakeOrder.currencyId._id,
      currencyName:stakeOrder.currencyId.currencyName,
      currencySymbol:stakeOrder.currencyId.currencySymbol,
      currencyType:stakeOrder.currencyId.type,
      stakeOrderId: stakeOrder._id,
      amount: interestPerDay * getDays,
      days: getDays,
      type: "interest",
      settleDate: new Date(),
    });

    await newSettlement.save();

    await Assets.updateOne(
      {
        userId: stakeOrder.userId,
        currencyId: stakeOrder.currencyId._id,
      },
      {
        $inc: {
          spotwallet: interestPerDay * getDays,
        },
      }
    );

    let result = {
      _id: updateOrder._id,
      currencyId: stakeOrder.currencyId._id,
      currencyImage: `${config.SERVER_URL}${config.IMAGE.CURRENCY_URL_PATH}${stakeOrder.currencyId.currencyImage}`,
      currencySymbol: stakeOrder.currencyId.currencySymbol,
      currencyName: stakeOrder.currencyId.currencyName,
      createdAt: dateTimeFormat(updateOrder.createdAt, "YYYY-MM-DD HH:ss"),
      APY: updateOrder.APY,
      amount: updateOrder.amount,
      status: updateOrder.status,
    };

    return res
      .status(200)
      .json({ success: true, message: "Cancelled successfully", result });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

/**
 * Flexible settle list
 */
flexibleSettleTask.start();
export const flexibleSettleList = async () => {
  flexibleSettleTask.stop();
  try {
    let nowDate = new Date();
    nowDate.setSeconds(0, 0);

  //  console.log("nowdateeeeeeeeeeeee", nowDate);
    let stakingList = await StakingOrder.find({
      settleEndDate: { $lte: nowDate },
      type: { $in: ["flexible"] },
      status: { $in: ["active"] },
    });
    //  console.log("statckinggggggggggggg",stakingList);
    if (stakingList && stakingList.length > 0) {
      await flexibleSettlement(stakingList, 0, nowDate);
      flexibleSettleTask.start();
    } else {
      flexibleSettleTask.start();
    }
  } catch (err) {
    flexibleSettleTask.start();
  }
};

export const flexibleSettlement = async (
  settlementList,
  count = 0,
  nowDate
) => {
  try {
     //console.log("resultttttttttttt",settlementList[count])
    if (isEmpty(settlementList[count])) {
      return true;
    }

    let endDate = settlementList[count].settleEndDate;
    let isCancel = false;
     // console.log("endDateendDateendDate",endDate)
    let getHours = findBtwDates(
      settlementList[count].settleStartDate,
      endDate,
      "hours"
    );
   // console.log("getHoursgetHoursgetHoursgetHours",getHours);
    let getDays = Math.floor(getHours / 24);
   //  console.log("getDaysgetDaysgetDaysgetDays",getDays)
    //  console.log("elseif conditionsssssssssss",settlementList[count].status == 'active' && getDays > settlementList[count].duration)

    if (getDays < 1) {
      return await flexibleSettlement(settlementList, count + 1, nowDate);
    } else if (
      settlementList[count].status == "active" &&
      getDays > settlementList[count].duration
    ) {
      getDays = settlementList[count].duration;
      isCancel = true;
    }

    let interestPerDay = toFixed(
      interestByDays(
        settlementList[count].amount,
        settlementList[count].APY,
        365
      ),
      8
    );
  // console.log("interestPerDayinterestPerDayinterestPerDay",interestPerDay)
    let currencyDetails = await Currency.findOne({
      _id: settlementList[count].currencyId,
    });
    // if (currencyDetails) {
    // }
    let newSettlement = new StakingSettle({
      userId: settlementList[count].userId,
      currencyId: settlementList[count].currencyId,
      currencyName: currencyDetails && currencyDetails.currencyName,
      currencySymbol: currencyDetails && currencyDetails.currencySymbol,
      currencyType: currencyDetails && currencyDetails.type,
      stakeOrderId: settlementList[count]._id,
      amount: interestPerDay * getDays,
      days: getDays,
      type: "interest",
      settleDate: new Date(),
    });

    let startDate = new Date(settlementList[count].settleEndDate);
    let nextSettleDate = startDate.setDate(
      startDate.getDate() + settlementList[count].settlementPeriod
    );
    let redemDate = startDate.setDate(
      startDate.getDate() + settlementList[count].redemptionPeriod
    );

    let updateOrder = {
      settleStartDate: settlementList[count].settleEndDate,
      settleEndDate: nextSettleDate,
      duration: settlementList[count].duration - getDays,
    };

    // console.log("updateOrderupdateOrder",updateOrder);

    // console.log("iscancellllllllllll",isCancel)
    if (isCancel) {
      updateOrder["cancelDate"] = nowDate;
      updateOrder["status"] = "cancel_date";
      updateOrder["redemStatus"] = "process";
      updateOrder["redemDate"] = redemDate;
    }

    await StakingOrder.updateOne(
      {
        _id: settlementList[count]._id,
      },
      { $set: updateOrder }
    );

    await newSettlement.save();

    // console.log("newSettlementnewSettlement",newSettlement);
    // console.log("interestPerDay * getDays",interestPerDay * getDays)
    const aseetData = await Assets.updateOne(
      {
        userId: settlementList[count].userId,
        currency: settlementList[count].currencyId,
      },
      {
        $inc: {
          spotwallet: interestPerDay * getDays,
        },
      },
      {
        new: true,
      }
    );

    // console.log("aseetsssssssDataaa",aseetData)
    return await flexibleSettlement(settlementList, count + 1, nowDate);
  } catch (err) {
    return await flexibleSettlement(settlementList, count + 1, nowDate);
  }
};

/**
 * Redemption Order List
 */
redemListTask.start();
export const redemList = async (nowDate) => {
  redemListTask.stop();
  try {
    let orderList = await StakingOrder.find({
      redemDate: { $lte: nowDate },
      status: { $in: ["cancel_user", "cancel_date"] },
      redemStatus: { $in: ["process"] },
    });

    // console.log("orderListtttttttt",orderList);

    if (orderList && orderList.length > 0) {
      await redemSettlement(orderList, 0, nowDate);
      redemListTask.start();
    } else {
      redemListTask.start();
    }
  } catch (err) {
    redemListTask.start();
  }
};

export const redemSettlement = async (settlementList, count, nowDate) => {
  try {
    if (isEmpty(settlementList[count])) {
      return true;
    }
    let currencyDetails = await Currency.findOne({
      _id: settlementList[count].currencyId,
    });
    let newSettlement = new StakingSettle({
      userId: settlementList[count].userId,
      currencyId: settlementList[count].currencyId,
      currencyName: currencyDetails && currencyDetails.currencyName,
      currencySymbol: currencyDetails && currencyDetails.currencySymbol,
      currencyType: currencyDetails && currencyDetails.type,
      stakeOrderId: settlementList[count]._id,
      amount: settlementList[count].amount,
      days: settlementList[count].redemptionPeriod,
      type: "redemption",
      settleDate: nowDate,
    });

    await newSettlement.save();

    //  console.log("redemptionnnnnn newSettlementnewSettlement",newSettlement)

    const assetData = await Assets.updateOne(
      {
        userId: settlementList[count].userId,
        currency: settlementList[count].currencyId,
      },
      {
        $inc: {
          spotwallet: settlementList[count].amount,
        },
      }
    );
    // console.log("remtemption assetData",assetData);

    let updateOrder = {
      redemStatus: "completed",
    };

    await StakingOrder.updateOne(
      {
        _id: settlementList[count]._id,
      },
      { $set: updateOrder }
    );

    return await redemSettlement(settlementList, count + 1, nowDate);
  } catch (err) {
    return await redemSettlement(settlementList, count + 1, nowDate);
  }
};

/**
 * Staking Settlement History
 * URL : /api/stake/settleHistory
 * METHOD : GET
 * Query : page, limit
 */
export const getSettleHistory = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);

    let count = await StakingSettle.countDocuments({ userId: req.user.id });
    let data = await StakingSettle.aggregate([
      { $sort: { settleDate: -1 } },
      {
        $lookup: {
          from: "currency",
          localField: "currencyId",
          foreignField: "_id",
          as: "currencyInfo",
        },
      },
      { $unwind: "$currencyInfo" },

      {
        $lookup: {
          from: "stakingOrder",
          localField: "stakeOrderId",
          foreignField: "_id",
          as: "stakeInfo",
        },
      },
      { $unwind: "$stakeInfo" },

      {
        $project: {
          settleDate: {
            $dateToString: {
              date: "$settleDate",
              format: "%Y-%m-%d %H:%M",
            },
          },
          currencySymbol: "$currencyInfo.currencySymbol",
          currencyName: "$currencyInfo.currencyName",
          stakeAmount: "$stakeInfo.amount",
          APY: "$stakeInfo.APY",
          amount: 1,
          type: 1,
        },
      },
    ]);

    let result = {
      count: count,
      currentPage: pagination.page,
      nextPage: count > data.length,
      limit: pagination.limit,
      data,
    };
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

/**
 * Staking searchStake History
 * URL : /api/stake/searchStakeHistory
 * METHOD : post
 * req.body :  currencyName,startDate,endDate,userId
 */

export const searchStakeHistory = async (req, res) => {
  try {
    let reqBody = req.body;

    if (reqBody.startDate == "" && reqBody.endDate == "") {
      return res.status(400).json({
        success: false,
        message: "please select  date for searching",
      });
    }

    var userId = reqBody.userId;
    var currencyName = reqBody.currencyName;
    var startDate = new Date(reqBody.startDate);
    startDate.setHours(0, 0, 0);
    var endDate = new Date(reqBody.endDate);
    endDate.setHours(23, 59, 59);
    var limit = reqBody.limit;
    var page = reqBody.page;
    var match = {};
    var query = { limit, page };

    //get for currencry data

    let currencyId = await Currency.findOne({ currencyName: currencyName });

    if (currencyName != "") {
      match["currencyId"] = ObjectId(currencyId._id);
    }

    if (startDate != "" && endDate != "") {
      match["settleDate"] = { $gte: startDate, $lte: endDate };
    } else if (startDate != "") {
      match["settleDate"] = { $gte: startDate };
    } else if (endDate != "") {
      match["settleDate"] = { $lte: endDate };
    }
    match["userId"] = ObjectId(userId);

    let pagination = paginationQuery(query);
    let count = await StakingSettle.countDocuments(match);
    let data = await StakingSettle.aggregate([
      { $match: match },
      { $sort: { settleDate: 1 } },
      {
        $lookup: {
          from: "currency",
          localField: "currencyId",
          foreignField: "_id",
          as: "currencyInfo",
        },
      },
      { $unwind: "$currencyInfo" },

      {
        $lookup: {
          from: "stakingOrder",
          localField: "stakeOrderId",
          foreignField: "_id",
          as: "stakeInfo",
        },
      },
      { $unwind: "$stakeInfo" },

      {
        $project: {
          settleDate: {
            $dateToString: {
              date: "$settleDate",
              format: "%Y-%m-%d %H:%M",
            },
          },
          currencySymbol: "$currencyInfo.currencySymbol",
          currencyName: "$currencyInfo.currencyName",
          stakeAmount: "$stakeInfo.amount",
          APY: "$stakeInfo.APY",
          amount: 1,
          type: 1,
        },
      },
    ]);

    let result = {
      count: count,
      currentPage: pagination.page,
      nextPage: count > data.length,
      limit: pagination.limit,
      data,
    };
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

export const stakeChart = async (req, res) => {
  try {
    let match = {};
    let userId = req.user.id;
    const siteSetting = await SiteSetting.findOne({}, { userDashboard: 1 });
    if (siteSetting) {
      let currencyId = siteSetting.userDashboard.map((item) => item.currencyId);
      match["userId"] = userId;
      match["type"] = "interest";
      match["currencyId"] = { $in: currencyId };
      const data = await StakingSettle.aggregate([
        { $match: match },

        {
          $group: {
            _id: {
              currency: "$currencyId",
              currencySymbol: "$currencySymbol",
            },
            total: { $sum: "$amount" },
          },
        },
        {
          $project: {
            _id: 1,
            total: 1,
            // currencyName: 1,
            // currencySymbol: 1,
          },
        },
      ]);
      if (data && data.length > 0) {
        let result = [];
        data.map((item) => {
          let findData = siteSetting.userDashboard.find(
            (el) => el.currencyId == item._id.currency.toString()
          );
          if (findData) {
            result.push({
              currencyId: item._id.currency,
              colorCode: findData.colorCode,
              stakeAmount: item.total,
              currencySymbol: item._id.currencySymbol,
            });
          }
        });
        return res
          .status(200)
          .json({ success: true, message: "Fetch success", result });
      }
    }
  } catch (err) {}
};

export const SettleBalance = async (req, res) => {
  try {
    var match = {};
    match["userId"] = req.user.id;
    match["type"] = "interest";
    const data = await StakingSettle.aggregate([
      { $match: match },

      {
        $group: {
          _id: {
            currency: "$currencyId",
            currencySymbol: "$currencySymbol",
            currencyType: "$currencyType",
          },

          stackBalance: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 1,
          stackBalance: 1,
        },
      },
    ]);
    var result = [];
    if (data && data.length > 0) {
      data.map(async (item) => {
        result.push({
          currencyId: item._id.currency,
          stackBalance: item.stackBalance,
          currencySymbol: item._id.currencySymbol,
          currencyType: item._id.currencyType,
        });
      });
    }
    return res
      .status(200)
      .json({ success: true, message: "Fetch success", result });
  } catch (err) {
    console.log("staking balance errrrrrrrrrrrrrrrrr", err);
  }
};
