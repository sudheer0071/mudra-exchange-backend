// import package
import mongoose from "mongoose";
import axios from "axios";

// import models
import {
  SpotPair,
  SpotTrade,
  Assets,
  Admin,
  FeesOwnToken,
  PriceConversion,
  User,
  PassBook,
} from "../models";

// import config
import config from "../config";
import { socketEmitOne, socketEmitAll } from "../config/socketIO";
import { createPassBook } from "./passbook.controller";

// import controller
import * as binanceCtrl from "./binance.controller";
import * as wazirxCtrl from "./wallet.controller";

import {
  wazirixOrderPlace,
  wazirixCancelOrder,
  wazaticxrecentTrade,
} from "./wazarix.controller";

// import {orderPlace } from "./binance.controller"

// import lib
import isEmpty from "../lib/isEmpty";
import { IncCntObjId } from "../lib/generalFun";
import { encryptObject, decryptObject } from "../lib/cryptoJS";
import { paginationQuery } from "../lib/adminHelpers";

const ObjectId = mongoose.Types.ObjectId;
const rp = require("request-promise");
var crypto = require("crypto");
const qs = require("qs");

let cancelOrderArr = [];
let orderIds = [];
let marketOrderIds = [];
let tradeMatchCall = false;

/**
 * Trade Decrypt
 * BODY : token
 */
export const decryptTradeOrder = (req, res, next) => {
  try {
    let token = decryptObject(req.body.token);
    req.body = token;
    return next();
  } catch (err) {
    return res.status(500).json({ status: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Get Spot Trade Pair List
 * METHOD: GET
 * URL : /api/spot/tradePair
 */
export const getPairList = async (req, res) => {
  try {
    let spotPairData = await SpotPair.aggregate([
      { $match: { status: "active" } },
      {
        $lookup: {
          from: "currency",
          localField: "firstCurrencyId",
          foreignField: "_id",
          as: "firstCurrencyInfo",
        },
      },
      { $unwind: "$firstCurrencyInfo" },

      {
        $lookup: {
          from: "currency",
          localField: "secondCurrencyId",
          foreignField: "_id",
          as: "secondCurrencyInfo",
        },
      },
      { $unwind: "$secondCurrencyInfo" },

      {
        $project: {
          _id: 1,
          firstCurrencyId: 1,
          firstCurrencySymbol: 1,
          firstCurrencyImage: {
            $cond: [
              { $eq: ["$firstCurrencyInfo.currencyImage", ""] },
              "",
              {
                $concat: [
                  config.SERVER_URL,
                  config.IMAGE.CURRENCY_URL_PATH,
                  "$firstCurrencyInfo.currencyImage",
                ],
              },
            ],
          },
          secondCurrencyId: 1,
          secondCurrencySymbol: 1,
          secondCurrencyImage: {
            $cond: [
              { $eq: ["$secondCurrencyInfo.currencyImage", ""] },
              "",
              {
                $concat: [
                  config.SERVER_URL,
                  config.IMAGE.CURRENCY_URL_PATH,
                  "$secondCurrencyInfo.currencyImage",
                ],
              },
            ],
          },
          firstFloatDigit: 1,
          secondFloatDigit: 1,
          botstatus: 1,

          last: 1,
          markPrice: 1,
          low: 1,
          high: 1,
          firstVolume: 1,
          secondVolume: 1,
          changePrice: 1,
          change: 1,
        },
      },
    ]);
    return res
      .status(200)
      .json({ success: true, messages: "success", result: spotPairData });
  } catch (err) {
    return res.status(500).json({ status: false, message: "Error occured" });
  }
};

/**
 * Cancel Order
 * METHOD: Delete
 * URL : /api/spot/cancelOrder/:{{orderId}}
 * PARAMS: orderId
 */
export const cancelOrder = async (req, res) => {
  try {
    if (cancelOrderArr.includes(IncCntObjId(req.params.orderId))) {
      return res.status(400).json({
        status: false,
        message: "Order has been excute processing ...",
      });
    }
    let orderData = await SpotTrade.findById(
      req.params.orderId,
    );
    if (!orderData) {
      return res.status(400).json({ status: false, message: "NO_ORDER" });
    }

    if (["wait", "idle"].includes(orderData.status)) {
      wazirixCancelOrder(orderData._id);
      getOpenOrderSocket(orderData.userId, orderData.pairId);
      getOrderBookSocket(orderData.pairId);
      getTradeHistorySocket(orderData.userId, orderData.pairId);
      return res.status(200).json({ status: true, message: "ORDER_CANCEL " });

      // console.log("this is cancel order after respone in spotrade controller",resData)
      // if (resData && resData.status==true) {

      // }
    } else if (["open", "pending", "conditional"].includes(orderData.status)) {
      let remainingQuantity = orderData.quantity - orderData.filledQuantity;
      let currencyId =
        orderData.buyorsell == "buy"
          ? orderData.secondCurrencyId
          : orderData.firstCurrencyId;
      let orderValue =
        orderData.buyorsell == "buy"
          ? orderData.price * remainingQuantity
          : remainingQuantity;
      assetUpdate({
        currencyId,
        userId: orderData.userId,
        balance: orderValue,
        type: "spot_trade_cancel",
        tableId: orderData._id,
      });

      orderData.status = "cancel";
      await orderData.save();



      getOpenOrderSocket(orderData.userId, orderData.pairId);
      getOrderBookSocket(orderData.pairId);
      getTradeHistorySocket(orderData.userId, orderData.pairId);

      if (orderData.isLiquidity == true) {
        await binanceCtrl.cancelOrder({
          firstCoin: orderData.firstCurrency,
          secondCoin: orderData.secondCurrency,
          binanceId: orderData.liquidityId,
          orderType: orderData.orderType,
        });
      }

      return res.status(200).json({ status: true, message: "ORDER_CANCEL" });
    } else if (orderData.status == "completed") {
      return res
        .status(400)
        .json({ status: false, message: "ORDER_ALREADY_COMPLETED" });
    } else if (orderData.status == "cancel") {
      return res
        .status(400)
        .json({ status: false, message: "ORDER_ALREADY_CANCEL" });
    }
    return res.status(400).json({ status: false, message: "SOMETHING_WRONG" });
  } catch (err) {
    console.log("cancel order errrrrrr ...........", err);
    return res.status(500).json({ status: false, message: "Error occured" });
  }
};

/**
 * Spot Order Place
 * METHOD : POST
 * URL : /api/spotOrder
 * BODY : newdate, spotPairId, stopPrice, price, quantity, buyorsell, orderType(limit,market,stopLimit,oco), limitPrice
 */
export const orderPlace = async (req, res) => {
  try {
    let reqBody = req.body;

    if (reqBody.orderType == "limit") {
      limitOrderPlace(req, res);
    } else if (reqBody.orderType == "market") {
      marketOrderPlace(req, res);
    } else if (reqBody.orderType == "stop_limit") {
      stopLimitOrderPlace(req, res);
    } else if (reqBody.orderType == "stop_market") {
      stopMarketOrderPlace(req, res);
    }
  } catch (err) {
    return res.status(400).json({
      status: false,
      message: "Error occured For the Interval_orderPlace_err",
    });
  }
};
function CountDecimalDigits(number) {
  var text = number.toString();
  var index = text.indexOf(".");
  return index == -1 ? 0 : text.length - index - 1;
}
/**
 * Limit order place
 * URL : /api/spotOrder
 * METHOD : POST
 * BODY : newdate, spotPairId, stopPrice, price, quantity, buyorsell, orderType(limit,market,stopLimit,oco), limitPrice
 */
export const limitOrderPlace = async (req, res) => {
  try {
    let reqBody = req.body;
    reqBody.price = parseFloat(reqBody.price);
    reqBody.quantity = parseFloat(reqBody.quantity);

    let spotPairData = await SpotPair.findById(reqBody.spotPairId);
    // console.log("spotPairDataspotPairDataspotPairData",req.body)

    //  console.log("spotPairDataspotPairDataspotPairData",spotPairData)
    if (!spotPairData) {
      return res.status(400).json({ status: false, message: "Invalid Pair" });
    }

    // if (reqBody.price < 0.00000001) {
    //     return res.json({ 'status': false, 'message': "Price of contract must not be lesser than 0.00000001" });
    // }
    // else
    if (reqBody.quantity < parseFloat(spotPairData.minQuantity)) {
      return res.status(400).json({
        status: false,
        message:
          "Quantity of contract must not be lesser than " +
          spotPairData.minQuantity,
      });
    } else if (reqBody.quantity > parseFloat(spotPairData.maxQuantity)) {
      return res.status(400).json({
        status: false,
        message:
          "Quantity of contract must not be higher than " +
          spotPairData.maxQuantity,
      });
    }

    var minamount =
      parseFloat(spotPairData.markPrice) -
      (parseFloat(spotPairData.markPrice) *
        parseFloat(spotPairData.minPricePercentage)) /
      100;

    var maxamount =
      parseFloat(spotPairData.markPrice) +
      (parseFloat(spotPairData.markPrice) *
        parseFloat(spotPairData.maxPricePercentage)) /
      100;

    if (reqBody.price < minamount) {
      return res.status(400).json({
        status: false,
        message: "Price should be above " + minamount.toFixed(4),
      });
    }

    if (reqBody.price > maxamount) {
      return res.status(400).json({
        status: false,
        message: "Price should be below " + maxamount.toFixed(4),
      });
    }
    if (spotPairData.botstatus == "wazirx") {
      let priceDecimalValue = await CountDecimalDigits(reqBody.price);

      if (priceDecimalValue > spotPairData.secondFloatDigit) {
        return res.status(400).json({
          status: false,
          message:
            "Please enter the price less then " +
            spotPairData.secondFloatDigit +
            " decimal places",
        });
      }
      let quentityDecimalValue = await CountDecimalDigits(reqBody.quantity);
      if (quentityDecimalValue > spotPairData.firstFloatDigit) {
        return res.status(400).json({
          status: false,
          message:
            "Please enter the quantity less then " +
            spotPairData.firstFloatDigit +
            " decimal places ",
        });
      }
    }
    let currencyId =
      reqBody.buyorsell == "buy"
        ? spotPairData.secondCurrencyId
        : spotPairData.firstCurrencyId;

    // console.log("curerencuId......",currencyId);

    let userAssetsData = await Assets.findOne({
      userId: req.user.id,
      currency: currencyId,
    });

    // console.log("useraseettttttt", userAssetsData);
    if (!userAssetsData) {
      return res.status(500).json({ status: false, message: "Error occured" });
    }

    let balance = parseFloat(userAssetsData.spotwallet),
      orderValue =
        reqBody.buyorsell == "buy"
          ? reqBody.price * reqBody.quantity
          : reqBody.quantity;

    if (balance < orderValue) {
      return res.status(400).json({
        status: false,
        message: "Due to insufficient balance order cannot be placed",
      });
    }



    //Own token fee
    var tokenfee = await tokenfeeget(reqBody.tokenfee);

    // End

    const newOrder = new SpotTrade({
      userId: req.user.id,
      pairId: spotPairData._id,
      firstCurrencyId: spotPairData.firstCurrencyId,
      firstCurrency: spotPairData.firstCurrencySymbol,
      secondCurrencyId: spotPairData.secondCurrencyId,
      secondCurrency: spotPairData.secondCurrencySymbol,

      quantity: reqBody.quantity,
      price: reqBody.price,
      orderValue: reqBody.price * reqBody.quantity,

      pairName: `${spotPairData.firstCurrencySymbol}${spotPairData.secondCurrencySymbol}`,
      beforeBalance: balance,
      afterBalance: userAssetsData.spotwallet,
      botstatus: spotPairData.botstatus,

      orderType: reqBody.orderType,
      orderDate: new Date(),
      buyorsell: reqBody.buyorsell,
      status: "open",
      tokenfee: tokenfee,
    });
    if (spotPairData.botstatus == "wazirx") {
      console.log('wazrix')
      var payloadObj = {
        symbol: (
          spotPairData.firstCurrencySymbol + spotPairData.secondCurrencySymbol
        ).toLowerCase(),
        //  "symbol":"wrxinr",
        side: newOrder.buyorsell,
        type: newOrder.orderType,
        quantity: newOrder.quantity,
        price: newOrder.price,
        pairId: spotPairData._id,
        userId: newOrder.userId,
        botstatus: spotPairData.botstatus,
        markupPercentage: spotPairData.markupPercentage,
        newOrder_id: newOrder._id,
      };
      let wazirxOrder = await wazirixOrderPlace(payloadObj);
      console.log('wazirxOrder===============', wazirxOrder)
      if (wazirxOrder.status) {
        newOrder.wazirixOrderId = wazirxOrder.data.id;
        newOrder.liquidityType = "wazirx";
        newOrder.isLiquidity = true;
        // newOrder.markupPerc = spotPairData.markupPercentage;
        newOrder.status = "wait";

      } else {
        return res.status(400).json({
          status: false,
          message: "Something went wrong, please try again later.",
        });
      }
    }
    // wazirixOrderPlace(payloadObj);


    if (spotPairData.botstatus == "binance") {

      var payloadObj = {
        symbol: spotPairData.firstCurrencySymbol + spotPairData.secondCurrencySymbol,
        //  "symbol":"wrxinr",
        side: newOrder.buyorsell,
        type: newOrder.orderType,
        quantity: newOrder.quantity,
        price: newOrder.price,
        pairId: spotPairData._id,
        userId: newOrder.userId,
        botstatus: spotPairData.botstatus,
        markupPercentage: spotPairData.markupPercentage,
        newOrder_id: newOrder._id,
        minimumValue: spotPairData.minQuantity,
        stopPrice: newOrder.stopPrice ? newOrder.stopPrice : 0,

        firstCurrencySymbol: spotPairData.firstCurrencySymbol,
        secondCurrencySymbol: spotPairData.secondCurrencySymbol,
        buyorsell: newOrder.buyorsell,
        orderType: newOrder.orderType,
      };
      console.log('payloadObj', payloadObj)
      let binOrder = await binanceCtrl.orderPlace(payloadObj);
      console.log('binOrder', binOrder)
      // if (binOrder.status) {
      //   newOrder.liquidityId = binOrder.data.orderId;
      //   newOrder.liquidityType = "binance";
      //   newOrder.isLiquidity = true;
      //   await newOrder.save();
      // }
      if (binOrder.status) {
        newOrder.liquidityId = binOrder.data.orderId;
        newOrder.liquidityType = "binance";
        newOrder.isLiquidity = true;
        await newOrder.save();
      } else {
        return res.status(400).json({
          status: false,
          message: "Something went wrong, please try again later.",
        });
      }

    }
    // let newOrder = await newSpotTrade.save();

    userAssetsData.spotwallet = balance - orderValue;
    // let updateUserAsset = await userAssetsData.save();

    let updateUserAsset = await Assets.updateOne(
      {
        userId: req.user.id,
        currency: currencyId,
        $where: `function() {return this.spotwallet - ${orderValue} >= 0}`,
      },
      {
        $inc: {
          spotwallet: -orderValue,
        },
      },
      {
        new: true,
      }
    );

    if (updateUserAsset && updateUserAsset.nModified != 1) {
      return res.status(400).json({
        status: false,
        message: "Due to insufficient balance order cannot be placed",
      });
    }
    // console.log(userAssetsData, "-----------374");
    socketEmitOne(
      "updateTradeAsset",
      {
        _id: userAssetsData._id,
        spotwallet: userAssetsData.spotwallet,
        derivativeWallet: userAssetsData.derivativeWallet,
      },
      req.user.id
    );
    let redixUpdatee = await newOrder.save();

    getOpenOrderSocket(newOrder.userId, newOrder.pairId);
    let passbookData = {};
    passbookData.userId = userAssetsData.userId;
    passbookData.coin = userAssetsData.currencySymbol;
    passbookData.currencyId = userAssetsData.currency;
    passbookData.tableId = newOrder._id;
    passbookData.beforeBalance = balance;
    passbookData.afterBalance = userAssetsData.spotwallet;
    passbookData.amount = orderValue;
    passbookData.type = "spot_trade";
    passbookData.category = "debit";
    createPassBook(passbookData);

    if (spotPairData.botstatus == "off") {
      getOrderBookSocket(newOrder.pairId);
      orderIds.push(newOrder._id.toString());

      // matchEngine()
    }
    // console.log("----newOrder", newOrder);
    // tradeList(newOrder, spotPairData);

    matchEngine();

    return res
      .status(200)
      .json({ status: true, message: "Your order placed successfully." });
  } catch (err) {
    console.log(err, "---------436");
    return res
      .status(400)
      .json({ status: false, message: "Limit order match error" });
  }
};

/**
 * Match Engine (QUEUE CONCEPT)
 */
const matchEngine = async () => {
  try {

    if (tradeMatchCall) {
      return;
    }
    tradeMatchCall = true;
    if (
      marketOrderIds &&
      Array.isArray(marketOrderIds) &&
      marketOrderIds.length > 0
    ) {
      let newOrder = await SpotTrade.findOne({
        _id: marketOrderIds[0],
        orderType: "market",
        status: { $in: ["open"] },
      });
      if (newOrder) {


        let pairData = await SpotPair.findOne({
          _id: newOrder.pairId,
          status: "active",
        });


        if (pairData) {
          await tradeList(newOrder, pairData);
        }
      }
      marketOrderIds.shift();
      tradeMatchCall = false;
      matchEngine();
      return;
    }

    else if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {

      let newOrder = await SpotTrade.findOne({
        _id: orderIds[0],
        status: { $in: ["open", "pending"] },
      });

      if (newOrder) {
        let pairData = await SpotPair.findOne({
          _id: newOrder.pairId,
          status: "active",
        });


        if (pairData) {

          await tradeList(newOrder, pairData);
        }
      }
      orderIds.shift();
      tradeMatchCall = false;
      matchEngine();
      return;
    }
    tradeMatchCall = false;

    // matchEngine()
    return;
  } catch (err) { }
};

/**
 * Market order place
 * URL : /api/spotOrder
 * METHOD : POST
 * BODY : spotPairId, quantity, buyorsell, orderType(market)
 */
export const marketOrderPlace = async (req, res) => {
  try {
    let reqBody = req.body;

    reqBody.quantity = parseFloat(reqBody.quantity);

    let spotPairData = await SpotPair.findById(reqBody.spotPairId);

    if (!spotPairData) {
      return res.status(400).json({ status: false, message: "Invalid Pair" });
    }
    if (spotPairData.botstatus == "wazirx") {
      let quentityDecimalValue = await CountDecimalDigits(reqBody.quantity);
      if (quentityDecimalValue > spotPairData.firstFloatDigit) {
        return res.status(400).json({
          status: false,
          message:
            "Please enter the quantity less then " +
            spotPairData.firstFloatDigit +
            " decimal places ",
        });
      }
    }
    //Own token fee
    let tokenfee = await tokenfeeget(reqBody.tokenfee);
    // End

    let currencyId =
      reqBody.buyorsell == "buy"
        ? spotPairData.secondCurrencyId
        : spotPairData.firstCurrencyId;

    let userAssetsData = await Assets.findOne({
      userId: req.user.id,
      currency: currencyId,
    });
    if (!userAssetsData) {
      return res.status(500).json({ status: false, message: "Error occured" });
    }

    let spotOrder = await SpotTrade.aggregate([
      {
        $match: {
          pairId: ObjectId(reqBody.spotPairId),
          userId: { $ne: ObjectId(req.user.id) },
          status: { $in: ["open", "pending"] },
          buyorsell: reqBody.buyorsell == "buy" ? "sell" : "buy",
        },
      },
      {
        $facet: {
          orderList: [
            { $sort: { price: reqBody.buyorsell == "buy" ? 1 : -1 } },
            { $limit: 100 },
          ],
          orderBook: [
            {
              $group: {
                _id: "$price",
                quantity: { $sum: "$quantity" },
                filledQuantity: { $sum: "$filledQuantity" },
              },
            },
            { $sort: { _id: reqBody.buyorsell == "buy" ? 1 : -1 } },
            { $limit: 100 },
          ],
        },
      },
    ]);

    let isNoOrder = false;
    if (
      (spotOrder && spotOrder.length == 0) ||
      (spotOrder[0].orderBook && spotOrder[0].orderBook.length == 0)
    ) {
      isNoOrder = true;
      if (spotOrder && spotPairData.botstatus == "off")
        return res
          .status(400)
          .json({ status: false, message: "There is no order in orderbook" });
    }
    if (spotPairData.botstatus == "wazirx") {

      try {

        let currencyId =
          reqBody.buyorsell == "buy"
            ? spotPairData.secondCurrencyId
            : spotPairData.firstCurrencyId;

        let userAssetsData = await Assets.findOne({
          userId: req.user.id,
          currency: currencyId,
        });
        if (!userAssetsData) {

          return res
            .status(500)
            .json({ status: false, message: "Error occured" });
        }

        let priceVal =
          reqBody.buyorsell == "buy"
            ? spotPairData.last_ask
            : spotPairData.last_bid;
        orderValue =
          reqBody.buyorsell == "buy"
            ? calculateMarkup(priceVal, spotPairData.markupPercentage, "+") *
            reqBody.quantity
            : reqBody.quantity;
        orderPrice =
          reqBody.buyorsell == "buy"
            ? calculateMarkup(priceVal, spotPairData.markupPercentage, "+")
            : calculateMarkup(priceVal, spotPairData.markupPercentage, "-");

        let balance = parseFloat(userAssetsData.spotwallet);


        if (balance < orderValue) {
          return res.status(400).json({
            status: false,
            message: "Due to insufficient balance order cannot be placed",
          });
        }



        userAssetsData.spotwallet =
          parseFloat(balance) - parseFloat(orderValue);

        const newOrder = new SpotTrade({

          // const newSpotTrade = new SpotTrade({
          userId: req.user.id,
          pairId: spotPairData._id,
          firstCurrencyId: spotPairData.firstCurrencyId,
          firstCurrency: spotPairData.firstCurrencySymbol,
          secondCurrencyId: spotPairData.secondCurrencyId,
          secondCurrency: spotPairData.secondCurrencySymbol,
          botstatus: spotPairData.botstatus,

          quantity: reqBody.quantity,
          price: orderPrice,
          orderValue: spotPairData.markPrice * reqBody.quantity,

          pairName: `${spotPairData.firstCurrencySymbol}${spotPairData.secondCurrencySymbol}`,
          beforeBalance: balance,
          afterBalance: userAssetsData.spotwallet,
          orderType: "market", //no market order  api so order pacing into as limit
          orderDate: new Date(),
          buyorsell: reqBody.buyorsell,
          status: "wait",
          tokenfee: tokenfee,
        });


        // add passbook



        //order placing object

        var payloadObj = {
          symbol: (
            spotPairData.firstCurrencySymbol + spotPairData.secondCurrencySymbol
          ).toLowerCase(),
          //  "symbol":"wrxinr",
          side: reqBody.buyorsell,
          type: "marketOrder",
          quantity: reqBody.quantity,
          price:
            newOrder.buyorsell == "buy"
              ? spotPairData.last_ask
              : spotPairData.last_bid,
          pairId: spotPairData._id,
          userId: req.user.id,
          markupPercentage: spotPairData.markupPercentage,
          botstatus: spotPairData.botstatus,
          newOrder_id: newOrder._id,
          firstCurrencySymbol: spotPairData.firstCurrencySymbol,
          secondCurrencySymbol: spotPairData.secondCurrencySymbol,
        };

        //  await wazrixNewMarketfunction(payloadObj)
        // return true;
        let wazirxOrder = await wazrixNewMarketfunction(payloadObj);
        console.log('wazirxOrder', wazirxOrder)
        if (!wazirxOrder.status) {
          return res.status(400).json({
            status: false,
            message:
              wazirxOrder.message == "INSUFFICIENT_BALANCE"
                ? "Something went wrong, please try again later."
                : wazirxOrder.message,
          });
        }

        newOrder.wazirixOrderId = wazirxOrder.data.id;
        newOrder.liquidityType = "wazirx";
        newOrder.isLiquidity = true;
        let newOrder1 = await newOrder.save();

        let updateUserAsset = await userAssetsData.save();

        socketEmitOne(
          "updateTradeAsset",
          {
            _id: updateUserAsset._id,
            spotwallet: updateUserAsset.spotwallet,
            derivativeWallet: updateUserAsset.derivativeWallet,
          },
          req.user.id
        );

        getOpenOrderSocket(newOrder.userId, newOrder.pairId);

        let passbookData = {};
        passbookData.userId = userAssetsData.userId;
        passbookData.coin = userAssetsData.currencySymbol;
        passbookData.currencyId = userAssetsData.currency;
        passbookData.tableId = newOrder._id;
        passbookData.beforeBalance = balance;
        passbookData.afterBalance = userAssetsData.spotwallet;
        passbookData.amount = orderValue;
        passbookData.type = "spot_trade";
        passbookData.category = "debit";
        await createPassBook(passbookData);

        // wazirixOrderPlace(payloadObj);
        return res.status(200).json({ status: false, message: "order placed" });
      } catch (err) {
        console.log("errr", err);
      }
    }

    if (spotPairData.botstatus == "binance") {
      let balance = parseFloat(userAssetsData.spotwallet),
        orderValue =
          reqBody.buyorsell == "buy"
            ? binanceCtrl.calculateMarkup(
              spotPairData.markPrice,
              spotPairData.markupPercentage,
              "+"
            ) * reqBody.quantity
            : reqBody.quantity;
      orderPrice =
        reqBody.buyorsell == "buy"
          ? binanceCtrl.calculateMarkup(
            spotPairData.markPrice,
            spotPairData.markupPercentage,
            "+"
          )
          : spotPairData.markPrice;
      console.log('balance', balance, orderValue)
      if (balance < orderValue) {
        return res.status(400).json({
          status: false,
          message: "Due to insufficient balance order cannot be placed1",
        });
      }
      userAssetsData.spotwallet = balance - parseFloat(orderValue);



      let newOrderData = {
        _id: ObjectId(),
        userId: req.user.id,
        pairId: spotPairData._id,
        firstCurrencyId: spotPairData.firstCurrencyId,
        firstCurrency: spotPairData.firstCurrencySymbol,
        secondCurrencyId: spotPairData.secondCurrencyId,
        secondCurrency: spotPairData.secondCurrencySymbol,
        price: orderPrice,
        // orderValue: orderValue,

        quantity: reqBody.quantity,
        filledQuantity: 0,
        pairName: `${spotPairData.firstCurrencySymbol}${spotPairData.secondCurrencySymbol}`,
        beforeBalance: balance,
        afterBalance: userAssetsData.spotwallet,
        orderType: reqBody.orderType,
        orderDate: new Date(),
        buyorsell: reqBody.buyorsell,
        status: "open",
        tokenfee: tokenfee,
      };

      let newOrder = new SpotTrade(newOrderData);

      // CREATE PASS_BOOK
      createPassBook({
        userId: req.user.id,
        coin:
          reqBody.buyorsell == "buy"
            ? spotPairData.secondCurrencySymbol
            : spotPairData.firstCurrencySymbol,
        currencyId:
          reqBody.buyorsell == "buy"
            ? spotPairData.secondCurrencyId
            : spotPairData.firstCurrencyId,
        tableId: newOrder._id,
        beforeBalance: balance,
        afterBalance: parseFloat(userAssetsData.spotwallet),
        amount: parseFloat(orderValue),
        type: "spot_trade",
        category: "debit",
      });

      let payloadObj = {
        firstCoin: spotPairData.firstCurrencySymbol,
        secondCoin: spotPairData.secondCurrencySymbol,
        side: newOrder.buyorsell,
        quantity: newOrder.quantity,
      };
      let binOrder = await binanceCtrl.marketOrderPlaceNew(payloadObj);
      console.log('binOrder', binOrder)
      if (!binOrder.status) {
        return res.status(400).json({
          status: false,
          message:
            binOrder.message == "INSUFFICIENT_BALANCE"
              ? "Something went wrong, please try again later."
              : "Something went wrong, please try again later.",
        });
      }

      newOrder.liquidityId = binOrder.data.orderId;
      newOrder.liquidityType = "binance";
      newOrder.isLiquidity = true;
      console.log('binOrder.data.status', binOrder.data)
      if (binOrder.data.status == "FILLED") {
        newOrder.status = "completed";
        let updateBal = 0;

        for (let binFill of binOrder.data.fills) {
          let markupPrice = 0;
          if (binOrder.data.side == "SELL") {
            markupPrice = binanceCtrl.calculateMarkup(
              binFill.price,
              spotPairData.markupPercentage,
              "-"
            );
          } else if (binOrder.data.side == "BUY") {
            markupPrice = orderPrice;
          }

          let uniqueId = Math.floor(Math.random() * 1000000000);
          newOrder.filled.push({
            pairId: spotPairData._id,
            userId: newOrder.userId,
            uniqueId: uniqueId,
            price: markupPrice,
            filledQuantity: binFill.qty,
            // "Fees": binFill.commission,
            Fees: calculateServiceFee({
              price:
                binOrder.data.side == "SELL"
                  ? markupPrice * binFill.qty
                  : binFill.qty,
              serviceFee: spotPairData.taker_fees,
            }),
            status: "filled",
            Type: "sell",
            createdAt: new Date(),
            orderValue: markupPrice * binFill.qty,
          });
          newOrder["filledQuantity"] = newOrder.filledQuantity + binFill.qty;
          console.log('1062==========', newOrder.filledQuantity + binFill.qty, newOrder["filledQuantity"])
          if (binOrder.data.side == "SELL") {
            newOrder.filled[0].sellUserId = newOrder.userId
            updateBal = updateBal + markupPrice * binFill.qty;
          } else if (binOrder.data.side == "BUY") {
            newOrder.filled[0].buyUserId = newOrder.userId
            updateBal = updateBal + binFill.qty;
          }
        }

        newOrder.price =
          binOrder.data.cummulativeQuoteQty / binOrder.data.executedQty;
        newOrder.orderValue = binOrder.data.cummulativeQuoteQty;

        let redixUpdatee = await newOrder.save();
        // syncUpdateOrderDetails(redixUpdatee);

        if (updateBal > 0) {

          await assetUpdate({
            currencyId:
              newOrder.buyorsell == "sell"
                ? newOrder.secondCurrencyId
                : newOrder.firstCurrencyId,
            userId: req.user.id,
            balance: withServiceFee({
              price: updateBal,
              serviceFee: spotPairData.taker_fees,
            }),
            type: "spot_trade",
            tableId: newOrder._id,
          });

          await userAssetsData.save();
          socketEmitOne(
            "updateTradeAsset",
            {
              _id: userAssetsData._id,
              spotwallet: userAssetsData.spotwallet,
              derivativeWallet: userAssetsData.derivativeWallet,
            },
            req.user.id
          );
        }
      }
      return res
        .status(200)
        .json({ status: true, message: "Your order placed successfully." });
    }
    let orderBookQuantity = 0,
      orderBookPrice = 0;

    let orderValue = 0,
      orderPrice = 0,
      orderCost = 0;

    for (const key in spotOrder[0].orderBook) {
      let item = spotOrder[0].orderBook[key];
      let needQty = reqBody.quantity - orderBookQuantity;
      if (needQty > 0) {
        if (needQty < item.quantity - item.filledQuantity) {
          orderPrice = item._id;
          orderCost = orderCost + item._id * needQty;
          orderBookQuantity = orderBookQuantity + needQty;
        } else {
          orderPrice = item._id;
          orderCost =
            orderCost + item._id * (item.quantity - item.filledQuantity);
          orderBookQuantity =
            orderBookQuantity + (item.quantity - item.filledQuantity);
        }
      } else {
        break;
      }
    }

    orderValue = reqBody.buyorsell == "buy" ? orderCost : orderBookQuantity;
    console.log('orderValue', orderValue)

    //  return ;
    let balance = parseFloat(userAssetsData.spotwallet);
    // orderValue = reqBody.buyorsell == "buy" ? orderPrice : orderBookQuantity;
    if (balance < orderValue) {
      return res.status(400).json({
        status: false,
        message: "Due to insufficient balance order cannot be placed",
      });
    }

    userAssetsData.spotBal = parseFloat(balance) - parseFloat(orderValue);
    if (spotPairData.botstatus == "off") {
      await userAssetsData.save();
    }
    if (spotPairData.botstatus == "off") {
      if (balance < orderValue) {
        return res
          .status(400)
          .json({ status: false, message: "INSUFFIENT_BALANCE" });
      }

      userAssetsData.spotwallet = balance - orderValue;
    }

    // let updateUserAsset = await userAssetsData.save();
    let updateUserAsset = await Assets.updateOne(
      {
        userId: req.user.id,
        currency: currencyId,
        $where: `function() {return this.spotwallet - ${orderValue} >= 0}`,
      },
      {
        $inc: {
          spotwallet: -orderValue,
        },
      },
      {
        new: true,
      }
    );
    if (updateUserAsset && updateUserAsset.nModified != 1) {
      return res.status(400).json({
        status: false,
        message: "Due to insufficient balance order cannot be placed",
      });
    }

    socketEmitOne(
      "updateTradeAsset",
      {
        _id: userAssetsData._id,
        spotwallet: userAssetsData.spotwallet,
        derivativeWallet: userAssetsData.derivativeWallet,
      },
      req.user.id
    );

    // let newOrder = await newSpotTrade.save();

    let newOrderData = {
      _id: ObjectId(),
      userId: req.user.id,
      pairId: spotPairData._id,
      firstCurrencyId: spotPairData.firstCurrencyId,
      firstCurrency: spotPairData.firstCurrencySymbol,
      secondCurrencyId: spotPairData.secondCurrencyId,
      secondCurrency: spotPairData.secondCurrencySymbol,
      price: orderPrice,
      // orderValue: orderValue,

      quantity: reqBody.quantity,
      filledQuantity: 0,
      pairName: `${spotPairData.firstCurrencySymbol}${spotPairData.secondCurrencySymbol}`,
      beforeBalance: balance,
      afterBalance: userAssetsData.spotwallet,
      orderType: reqBody.orderType,
      orderDate: new Date(),
      buyorsell: reqBody.buyorsell,
      status: "open",
      tokenfee: tokenfee,
    };



    let newDoc = await SpotTrade(newOrderData).save();

    // add passbook
    let passbookData = {};
    passbookData.userId = userAssetsData.userId;
    passbookData.coin = userAssetsData.currencySymbol;
    passbookData.currencyId = userAssetsData.currency;
    passbookData.tableId = newOrderData._id;
    passbookData.beforeBalance = balance;
    passbookData.afterBalance = userAssetsData.spotwallet;
    passbookData.amount = orderValue;
    passbookData.type = "spot_trade";
    passbookData.category = "debit";
    await createPassBook(passbookData);

    marketOrderIds.push(newDoc._id.toString());
    matchEngine();


    return res
      .status(200)
      .json({ status: true, message: "Your order placed successfully." });
  }

  catch (err) {
    console.log("ERROESDASDASDASDAS", err);
    return res
      .status(400)
      .json({ status: false, message: "Market order match error" });
  }
};

export const marketTradeMatch = async (
  newOrder,
  orderData,
  count = 0,
  pairData
) => {
  try {
    if (!["open", "pending"].includes(newOrder.status)) {
      return true;
    } else if (isEmpty(orderData[count])) {
      let updateNewOrder = {};

      updateNewOrder["status"] = "completed";
      updateNewOrder["quantity"] = newOrder.filledQuantity;

      let newOrderUpdate = await SpotTrade.findOneAndUpdate(
        {
          _id: newOrder._id,
        },
        updateNewOrder,
        { new: true, upsert: true }
      );

      await getOrderHistorySocket(newOrder.userId, newOrder.pairId);
      await getTradeHistorySocket(newOrder.userId, newOrder.pairId);

      // Balance Retrieve
      await assetUpdate({
        currencyId:
          newOrder.buyorsell == "sell"
            ? newOrder.firstCurrencyId
            : newOrder.secondCurrencyId,
        userId: newOrder.userId,
        balance:
          newOrder.buyorsell == "sell"
            ? newOrder.quantity - newOrder.filledQuantity
            : newOrder.price * (newOrder.quantity - newOrder.filledQuantity),
      });

      await getOrderBookSocket(pairData._id);

      return true;
    }
    let uniqueId = Math.floor(Math.random() * 1000000000);

    let newOrderQuantity = newOrder.quantity - newOrder.filledQuantity;
    let orderDataQuantity =
      orderData[count].quantity - orderData[count].filledQuantity;

    // Equal quantity market order
    if (newOrderQuantity == orderDataQuantity) {
      /* New Order */
      let updateNewOrder = {};
      if (count == 0) {
        updateNewOrder = newOrder;
        updateNewOrder["price"] = orderData[count].price;
        updateNewOrder["orderValue"] =
          orderData[count].price * newOrderQuantity;
      }

      updateNewOrder["status"] = "completed";
      updateNewOrder["filledQuantity"] =
        newOrder.filledQuantity + newOrderQuantity;
      updateNewOrder["$push"] = {
        filled: {
          pairId: newOrder.pairId,
          sellUserId:
            newOrder.buyorsell == "sell"
              ? newOrder.userId
              : orderData[count].userId,
          buyUserId:
            newOrder.buyorsell == "buy"
              ? newOrder.userId
              : orderData[count].userId,
          userId: newOrder.userId,
          sellOrderId:
            newOrder.buyorsell == "sell" ? newOrder._id : orderData[count]._id,
          buyOrderId:
            newOrder.buyorsell == "buy" ? newOrder._id : orderData[count]._id,
          uniqueId: uniqueId,
          price: orderData[count].price,
          filledQuantity: newOrderQuantity,
          // Fees: (newOrderQuantity * pairData.taker_fees) / 100,

          Fees: calculateServiceFee({
            price:
              newOrder.buyorsell == "buy"
                ? newOrderQuantity
                : orderData[count].price * newOrderQuantity,
            serviceFee: pairData.taker_fees,
          }),
          status: "filled",
          Type: newOrder.buyorsell,
          createdAt: new Date(),
          orderValue: orderData[count].price * newOrderQuantity,
        },
      };

      // Own Token Fee Calculation
      let final_fee_newOrder = await tokenFeecalculation({
        orderData: newOrder,
        fees: calculateServiceFee({
          price:
            newOrder.buyorsell == "buy"
              ? newOrderQuantity
              : orderData[count].price * newOrderQuantity,
          serviceFee: pairData.taker_fees,
        }),
        pairData,
        tradePrice: orderData[count].price,
        tradeQuantity: newOrderQuantity,
        serviceFee: pairData.taker_fees,
      });

      // End Token fee calculation

      updateNewOrder["$push"]["filled"]["Fees"] = final_fee_newOrder.fees;
      updateNewOrder["$push"]["filled"]["OwnToken"] =
        final_fee_newOrder.own_token;

      await SpotTrade.findOneAndUpdate(
        {
          _id: newOrder._id,
        },
        updateNewOrder,
        { new: true, upsert: true }
      );

      await getOrderHistorySocket(newOrder.userId, newOrder.pairId);
      await getTradeHistorySocket(newOrder.userId, newOrder.pairId);

      /* Order Book */
      let updateOrderData = {
        status: "completed",
        filledQuantity: orderData[count].filledQuantity + orderDataQuantity,
        $push: {
          filled: {
            pairId: orderData[count].pairId,
            sellUserId:
              orderData[count].buyorsell == "sell"
                ? orderData[count].userId
                : newOrder.userId,
            buyUserId:
              orderData[count].buyorsell == "buy"
                ? orderData[count].userId
                : newOrder.userId,
            userId: orderData[count].userId,
            sellOrderId:
              orderData[count].buyorsell == "sell"
                ? orderData[count]._id
                : newOrder._id,
            buyOrderId:
              orderData[count].buyorsell == "buy"
                ? orderData[count]._id
                : newOrder._id,
            uniqueId: uniqueId,
            price: orderData[count].price,
            filledQuantity: orderDataQuantity,
            // Fees: (orderDataQuantity * pairData.maker_rebate) / 100,
            Fees: calculateServiceFee({
              price:
                orderData[count].buyorsell == "buy"
                  ? orderDataQuantity
                  : orderData[count].price * orderDataQuantity,
              serviceFee: pairData.maker_rebate,
            }),
            status: "filled",
            Type: orderData[count].buyorsell,
            createdAt: new Date(),
            orderValue: orderData[count].price * orderDataQuantity,
          },
        },
      };

      // Own Token Fee Calculation
      let final_fee = await tokenFeecalculation({
        orderData: orderData[count],
        fees: calculateServiceFee({
          price:
            orderData[count].buyorsell == "buy"
              ? orderDataQuantity
              : orderData[count].price * orderDataQuantity,
          serviceFee: pairData.maker_rebate,
        }),
        pairData,
        tradePrice: orderData[count].price,
        tradeQuantity: orderDataQuantity,
        serviceFee: pairData.maker_rebate,
      });
      // End Token fee calculation
      updateOrderData["$push"]["filled"]["Fees"] = final_fee.fees;
      updateOrderData["$push"]["filled"]["OwnToken"] = final_fee.own_token;

      await SpotTrade.findOneAndUpdate(
        {
          _id: orderData[count]._id,
        },
        updateOrderData,
        { new: true }
      );

      await getOpenOrderSocket(
        orderData[count].userId,
        orderData[count].pairId
      );
      await getOrderHistorySocket(
        orderData[count].userId,
        orderData[count].pairId
      );
      await getTradeHistorySocket(
        orderData[count].userId,
        orderData[count].pairId
      );

      await getOrderBookSocket(pairData._id);
      await marketPriceSocket(pairData._id);
      await recentTradeSocket(pairData._id);

      return true;
    } else if (newOrderQuantity < orderDataQuantity) {
      /* New Order */
      let updateNewOrder = {};
      if (count == 0) {
        updateNewOrder = newOrder;
        updateNewOrder["price"] = orderData[count].price;
        updateNewOrder["orderValue"] =
          orderData[count].price * newOrderQuantity;
      }

      updateNewOrder["status"] = "completed";
      updateNewOrder["filledQuantity"] =
        newOrder.filledQuantity + newOrderQuantity;
      updateNewOrder["$push"] = {
        filled: {
          pairId: newOrder.pairId,
          sellUserId:
            newOrder.buyorsell == "sell"
              ? newOrder.userId
              : orderData[count].userId,
          buyUserId:
            newOrder.buyorsell == "buy"
              ? newOrder.userId
              : orderData[count].userId,
          userId: newOrder.userId,
          sellOrderId:
            newOrder.buyorsell == "sell" ? newOrder._id : orderData[count]._id,
          buyOrderId:
            newOrder.buyorsell == "buy" ? newOrder._id : orderData[count]._id,
          uniqueId: uniqueId,
          price: orderData[count].price,
          filledQuantity: newOrderQuantity,
          // Fees: (newOrderQuantity * pairData.taker_fees) / 100,
          Fees: calculateServiceFee({
            price:
              newOrder.buyorsell == "buy"
                ? newOrderQuantity
                : orderData[count].price * newOrderQuantity,
            serviceFee: pairData.taker_fees,
          }),
          status: "filled",
          Type: newOrder.buyorsell,
          createdAt: new Date(),
          orderValue: orderData[count].price * newOrderQuantity,
        },
      };

      // Own Token Fee Calculation
      let final_fee_newOrder = await tokenFeecalculation({
        orderData: newOrder,
        fees: calculateServiceFee({
          price:
            newOrder.buyorsell == "buy"
              ? newOrderQuantity
              : orderData[count].price * newOrderQuantity,
          serviceFee: pairData.taker_fees,
        }),
        pairData,
        tradePrice: orderData[count].price,
        tradeQuantity: newOrderQuantity,
        serviceFee: pairData.taker_fees,
      });
      // End Token fee calculation

      updateNewOrder["$push"]["filled"]["Fees"] = final_fee_newOrder.fees;
      updateNewOrder["$push"]["filled"]["OwnToken"] =
        final_fee_newOrder.own_token;

      await SpotTrade.findOneAndUpdate(
        {
          _id: newOrder._id,
        },
        updateNewOrder,
        { new: true, upsert: true }
      );

      await getOrderHistorySocket(newOrder.userId, newOrder.pairId);
      await getTradeHistorySocket(newOrder.userId, newOrder.pairId);

      /* Order Book */

      var updateOrderData = {
        status: "pending",
        filledQuantity: orderData[count].filledQuantity + newOrderQuantity,
        $push: {
          filled: {
            pairId: orderData[count].pairId,
            sellUserId:
              orderData[count].buyorsell == "sell"
                ? orderData[count].userId
                : newOrder.userId,
            buyUserId:
              orderData[count].buyorsell == "buy"
                ? orderData[count].userId
                : newOrder.userId,
            userId: orderData[count].userId,
            sellOrderId:
              orderData[count].buyorsell == "sell"
                ? orderData[count]._id
                : newOrder._id,
            buyOrderId:
              orderData[count].buyorsell == "buy"
                ? orderData[count]._id
                : newOrder._id,
            uniqueId: uniqueId,
            price: orderData[count].price,
            filledQuantity: newOrderQuantity,
            // Fees: (newOrderQuantity * pairData.maker_rebate) / 100,
            Fees: calculateServiceFee({
              price:
                orderData[count].buyorsell == "buy"
                  ? newOrderQuantity
                  : orderData[count].price * newOrderQuantity,
              serviceFee: pairData.maker_rebate,
            }),
            status: "filled",
            Type: orderData[count].buyorsell,
            createdAt: new Date(),
            orderValue: orderData[count].price * newOrderQuantity,
          },
        },
      };

      // Own Token Fee Calculation
      let final_fee = await tokenFeecalculation({
        orderData: orderData[count],
        fees: calculateServiceFee({
          price:
            orderData[count].buyorsell == "buy"
              ? newOrderQuantity
              : orderData[count].price * newOrderQuantity,
          serviceFee: pairData.maker_rebate,
        }),
        pairData,
        tradePrice: orderData[count].price,
        tradeQuantity: newOrderQuantity,
        serviceFee: pairData.maker_rebate,
      });
      // End Token fee calculation

      updateOrderData["$push"]["filled"]["Fees"] = final_fee.fees;
      updateOrderData["$push"]["filled"]["OwnToken"] = final_fee.own_token;

      await SpotTrade.findOneAndUpdate(
        {
          _id: orderData[count]._id,
        },
        updateOrderData,
        { new: true }
      );

      await getOpenOrderSocket(
        orderData[count].userId,
        orderData[count].pairId
      );
      await getOrderHistorySocket(
        orderData[count].userId,
        orderData[count].pairId
      );
      await getTradeHistorySocket(
        orderData[count].userId,
        orderData[count].pairId
      );

      await getOrderBookSocket(pairData._id);
      await marketPriceSocket(pairData._id);
      await recentTradeSocket(pairData._id);

      return true;
    } else if (newOrderQuantity > orderDataQuantity) {
      /* New Order */
      let updateNewOrder = {};
      if (count == 0) {
        updateNewOrder = newOrder;
        updateNewOrder["price"] = orderData[count].price;
        updateNewOrder["orderValue"] =
          orderData[count].price * orderDataQuantity;
      }

      updateNewOrder["status"] = "pending";
      updateNewOrder["filledQuantity"] =
        newOrder.filledQuantity + orderDataQuantity;
      updateNewOrder["$push"] = {
        filled: {
          pairId: newOrder.pairId,
          sellUserId:
            newOrder.buyorsell == "sell"
              ? newOrder.userId
              : orderData[count].userId,
          buyUserId:
            newOrder.buyorsell == "buy"
              ? newOrder.userId
              : orderData[count].userId,
          userId: newOrder.userId,
          sellOrderId:
            newOrder.buyorsell == "sell" ? newOrder._id : orderData[count]._id,
          buyOrderId:
            newOrder.buyorsell == "buy" ? newOrder._id : orderData[count]._id,
          uniqueId: uniqueId,
          price: orderData[count].price,
          filledQuantity: orderDataQuantity,
          // Fees: (orderDataQuantity * pairData.taker_fees) / 100,
          Fees: calculateServiceFee({
            price:
              newOrder.buyorsell == "buy"
                ? orderDataQuantity
                : orderData[count].price * orderDataQuantity,
            serviceFee: pairData.taker_fees,
          }),
          status: "filled",
          Type: newOrder.buyorsell,
          createdAt: new Date(),
          orderValue: orderData[count].price * orderDataQuantity,
        },
      };

      // Own Token Fee Calculation
      let final_fee_newOrder = await tokenFeecalculation({
        orderData: newOrder,
        fees: calculateServiceFee({
          price:
            newOrder.buyorsell == "buy"
              ? orderDataQuantity
              : orderData[count].price * orderDataQuantity,
          serviceFee: pairData.taker_fees,
        }),
        pairData,
        tradePrice: orderData[count].price,
        tradeQuantity: orderDataQuantity,
        serviceFee: pairData.taker_fees,
      });
      // End Token fee calculation

      updateNewOrder["$push"]["filled"]["Fees"] = final_fee_newOrder.fees;
      updateNewOrder["$push"]["filled"]["OwnToken"] =
        final_fee_newOrder.own_token;

      let newOrderUpdate = await SpotTrade.findOneAndUpdate(
        {
          _id: newOrder._id,
        },
        updateNewOrder,
        { new: true, upsert: true }
      );

      // await getOpenOrderSocket(newOrder.userId, newOrder.pairId)
      // await getOrderHistorySocket(newOrder.userId, newOrder.pairId)
      // await getTradeHistorySocket(newOrder.userId, newOrder.pairId)

      /* Order Book */

      var updateOrderData = {
        status: "completed",
        filledQuantity: orderData[count].filledQuantity + orderDataQuantity,
        $push: {
          filled: {
            pairId: orderData[count].pairId,
            sellUserId:
              orderData[count].buyorsell == "sell"
                ? orderData[count].userId
                : newOrder.userId,
            buyUserId:
              orderData[count].buyorsell == "buy"
                ? orderData[count].userId
                : newOrder.userId,
            userId: orderData[count].userId,
            sellOrderId:
              orderData[count].buyorsell == "sell"
                ? orderData[count]._id
                : newOrder._id,
            buyOrderId:
              orderData[count].buyorsell == "buy"
                ? orderData[count]._id
                : newOrder._id,
            uniqueId: uniqueId,
            price: orderData[count].price,
            filledQuantity: orderDataQuantity,
            // Fees: (orderDataQuantity * pairData.maker_rebate) / 100,
            Fees: calculateServiceFee({
              price:
                orderData[count].buyorsell == "buy"
                  ? orderDataQuantity
                  : orderData[count].price * orderDataQuantity,
              serviceFee: pairData.maker_rebate,
            }),
            status: "filled",
            Type: orderData[count].buyorsell,
            createdAt: new Date(),
            orderValue: orderData[count].price * orderDataQuantity,
          },
        },
      };

      // Own Token Fee Calculation
      let final_fee = await tokenFeecalculation({
        orderData: orderData[count],
        fees: calculateServiceFee({
          price:
            orderData[count].buyorsell == "buy"
              ? orderDataQuantity
              : orderData[count].price * orderDataQuantity,
          serviceFee: pairData.maker_rebate,
        }),
        pairData,
        tradePrice: orderData[count].price,
        tradeQuantity: orderDataQuantity,
        serviceFee: pairData.maker_rebate,
      });
      // End Token fee calculation

      updateOrderData["$push"]["filled"]["Fees"] = final_fee.fees;
      updateOrderData["$push"]["filled"]["OwnToken"] = final_fee.own_token;

      await SpotTrade.findOneAndUpdate(
        {
          _id: orderData[count]._id,
        },
        updateOrderData,
        { new: true }
      );

      await getOpenOrderSocket(
        orderData[count].userId,
        orderData[count].pairId
      );
      await getOrderHistorySocket(
        orderData[count].userId,
        orderData[count].pairId
      );
      await getTradeHistorySocket(
        orderData[count].userId,
        orderData[count].pairId
      );

      await getOrderBookSocket(pairData._id);
      await marketPriceSocket(pairData._id);
      await recentTradeSocket(pairData._id);

      return await marketTradeMatch(
        newOrderUpdate,
        orderData,
        (count = count + 1),
        pairData
      );
    }
  } catch (err) {
    return false;
  }
};

/**
 * Stop Limit order place
 * URL : /api/spotOrder
 * METHOD : POST
 * BODY : spotPairId, stopPrice, price, quantity, buyorsell, orderType(stop_limit)
 */
export const stopLimitOrderPlace = async (req, res) => {
  try {

    let reqBody = req.body;
    reqBody.stopPrice = parseFloat(reqBody.stopPrice);
    reqBody.price = parseFloat(reqBody.price);
    reqBody.quantity = parseFloat(reqBody.quantity);

    let spotPairData = await SpotPair.findById(reqBody.spotPairId);

    if (!spotPairData) {
      return res.status(400).json({ status: false, message: "Invalid Pair" });
    }

    if (parseFloat(reqBody.stopPrice) == parseFloat(reqBody.price)) {
      return res.status(400).json({
        status: false,
        message: "Stop price and Limit price should not same",
      });
    }
    if (parseFloat(reqBody.stopPrice) == parseFloat(spotPairData.markPrice)) {
      return res.status(400).json({
        status: false,
        message: "Stop price and Market price should not same",
      });
    }
    if (spotPairData.botstatus == "wazirx") {
      let priceDecimalValue = await CountDecimalDigits(reqBody.price);

      if (priceDecimalValue > spotPairData.secondFloatDigit) {
        return res.status(400).json({
          status: false,
          message:
            "Please enter the price less then " +
            spotPairData.secondFloatDigit +
            " decimal places ",
        });
      }
      let stopPriceDecimalValue = await CountDecimalDigits(reqBody.stopPrice);

      if (stopPriceDecimalValue > spotPairData.secondFloatDigit) {
        return res.status(400).json({
          status: false,
          message:
            "Please enter the stop price less then " +
            spotPairData.secondFloatDigit +
            " decimal places ",
        });
      }

      let quentityDecimalValue = await CountDecimalDigits(reqBody.quantity);
      if (quentityDecimalValue > spotPairData.firstFloatDigit) {
        return res.status(400).json({
          status: false,
          message:
            "Please enter the quantity less then " +
            spotPairData.firstFloatDigit +
            " decimal places ",
        });
      }
    }
    // if (reqBody.price < 0.00000001) {
    //     return res.json({ 'status': false, 'message': "Price of contract must not be lesser than 0.00000001" });
    // }
    // else if (reqBody.quantity < parseFloat(spotPairData.minQuantity)) {
    //     return res.json({ 'status': false, 'message': "Quantity of contract must not be lesser than " + spotPairData.minQuantity });
    // }
    // else if (reqBody.quantity > parseFloat(spotPairData.maxQuantity)) {
    //     return res.json({ 'status': false, 'message': "Quantity of contract must not be higher than " + spotPairData.maxQuantity, });
    // }

    let currencyId =
      reqBody.buyorsell == "buy"
        ? spotPairData.secondCurrencyId
        : spotPairData.firstCurrencyId;

    let userAssetsData = await Assets.findOne({
      userId: req.user.id,
      currency: currencyId,
    });
    if (!userAssetsData) {
      return res.status(500).json({ status: false, message: "Error occured" });
    }

    let balance = parseFloat(userAssetsData.spotwallet),
      orderValue =
        reqBody.buyorsell == "buy"
          ? reqBody.price * reqBody.quantity
          : reqBody.quantity;

    if (balance < orderValue) {
      return res.status(400).json({
        status: false,
        message: "Due to insufficient balance order cannot be placed",
      });
    }


    let conditionalType = "equal";
    if (spotPairData.markPrice < reqBody.stopPrice) {
      conditionalType = "greater_than";
    } else if (spotPairData.markPrice > reqBody.stopPrice) {
      conditionalType = "lesser_than";
    }
    var status = spotPairData.botstatus == "wazirx" ? "wait" : "conditional";


    // let newOrder = await newSpotTrade.save();
    if (spotPairData.botstatus == "wazirx") {


      const newOrder = new SpotTrade({
        userId: req.user.id,
        pairId: spotPairData._id,
        firstCurrencyId: spotPairData.firstCurrencyId,
        firstCurrency: spotPairData.firstCurrencySymbol,
        secondCurrencyId: spotPairData.secondCurrencyId,
        secondCurrency: spotPairData.secondCurrencySymbol,
        botstatus: spotPairData.botstatus,
        stopPrice: reqBody.stopPrice,
        price: reqBody.price,
        quantity: reqBody.quantity,

        orderValue: orderValue,

        pairName: `${spotPairData.firstCurrencySymbol}${spotPairData.secondCurrencySymbol}`,
        beforeBalance: balance,
        afterBalance: userAssetsData.spotwallet,

        orderType: reqBody.orderType,
        orderDate: new Date(),
        buyorsell: reqBody.buyorsell,
        conditionalType,
        status: status,
      });
      createPassBook({
        userId: req.user.id,
        coin:
          reqBody.buyorsell == "buy"
            ? spotPairData.secondCurrencySymbol
            : spotPairData.firstCurrencySymbol,
        currencyId:
          reqBody.buyorsell == "buy"
            ? spotPairData.secondCurrencyId
            : spotPairData.firstCurrencyId,
        tableId: newOrder._id,
        beforeBalance: balance,
        afterBalance: parseFloat(userAssetsData.spotwallet),
        amount: parseFloat(orderValue),
        type: "spot_trade",
        category: "debit",
      });

      var payloadObj = {
        symbol: (
          spotPairData.firstCurrencySymbol + spotPairData.secondCurrencySymbol
        ).toLowerCase(),
        //  "symbol":"wrxinr",
        side: newOrder.buyorsell,
        type: newOrder.orderType,
        quantity: newOrder.quantity,
        price: newOrder.price,
        stopPrice: newOrder.stopPrice,
        pairId: spotPairData._id,
        userId: newOrder.userId,
        markupPercentage: spotPairData.markupPercentage,
        botstatus: spotPairData.botstatus,
        newOrder_id: newOrder._id,
      };

      let wazirxOrder = await wazirixOrderPlace(payloadObj);
      console.log('wazirxOrder', wazirxOrder)

      if (!wazirxOrder.status) {
        return res.status(400).json({
          status: false,
          message:
            wazirxOrder.message == "INSUFFICIENT_BALANCE"
              ? "Something went wrong, please try again later."
              : "Something went wrong, please try again later.",
        });
      }
      else {
        newOrder.wazirixOrderId = wazirxOrder.data.id;
        newOrder.liquidityType = "wazirx";
        newOrder.isLiquidity = true;
        let updateUserAsset = await Assets.updateOne(
          {
            userId: req.user.id,
            currency: currencyId,
            $where: `function() {return this.spotwallet - ${orderValue} >= 0}`,
          },
          {
            $inc: {
              spotwallet: -orderValue,
            },
          },
          {
            new: true,
          }
        );

        if (updateUserAsset && updateUserAsset.nModified != 1) {
          return res.status(400).json({
            status: false,
            message: "Due to insufficient balance order cannot be placed",
          });
        }

        let redixUpdatee = await newOrder.save();

        socketEmitOne(
          "updateTradeAsset",
          {
            _id: userAssetsData._id,
            spotwallet: userAssetsData.spotwallet,
            derivativeWallet: userAssetsData.derivativeWallet,
          },
          req.user.id
        );
        getOpenOrderSocket(newOrder.userId, newOrder.pairId);
        return res
          .status(200)
          .json({ status: true, message: "Your order placed successfully." });

      }
    }

    let newOrder = new SpotTrade({
      userId: req.user.id,
      pairId: spotPairData._id,
      firstCurrencyId: spotPairData.firstCurrencyId,
      firstCurrency: spotPairData.firstCurrencySymbol,
      secondCurrencyId: spotPairData.secondCurrencyId,
      secondCurrency: spotPairData.secondCurrencySymbol,
      botstatus: spotPairData.botstatus,
      stopPrice: reqBody.stopPrice,
      price: reqBody.price,
      quantity: reqBody.quantity,

      orderValue: orderValue,

      pairName: `${spotPairData.firstCurrencySymbol}${spotPairData.secondCurrencySymbol}`,
      beforeBalance: balance,
      afterBalance: userAssetsData.spotwallet,

      orderType: reqBody.orderType,
      orderDate: new Date(),
      buyorsell: reqBody.buyorsell,
      conditionalType,
      status: status,
    });
    if (spotPairData.botstatus == "binance") {

      createPassBook({
        userId: req.user.id,
        coin:
          reqBody.buyorsell == "buy"
            ? spotPairData.secondCurrencySymbol
            : spotPairData.firstCurrencySymbol,
        currencyId:
          reqBody.buyorsell == "buy"
            ? spotPairData.secondCurrencyId
            : spotPairData.firstCurrencyId,
        tableId: newOrder._id,
        beforeBalance: balance,
        afterBalance: parseFloat(userAssetsData.spotwallet),
        amount: parseFloat(orderValue),
        type: "spot_trade",
        category: "debit",
      });
      var payloadObj = {
        symbol: (
          spotPairData.firstCurrencySymbol + spotPairData.secondCurrencySymbol
        ).toLowerCase(),
        buyorsell: newOrder.buyorsell,
        orderType: "STOP_LOSS_LIMIT",
        quantity: newOrder.quantity,
        curmarketprice: spotPairData.markPrice,
        price: newOrder.price,
        pairId: spotPairData._id,
        userId: newOrder.userId,
        markupPercentage: spotPairData.markupPercentage,
        botstatus: spotPairData.botstatus,
        firstCurrencySymbol: spotPairData.firstCurrencySymbol,
        secondCurrencySymbol: spotPairData.secondCurrencySymbol,
        minimumValue: spotPairData.minQuantity,
        stopPrice: newOrder.stopPrice ? newOrder.stopPrice : 0,
      };

      let binOrder = await binanceCtrl.orderPlace(payloadObj);
      if (binOrder.status) {
        newOrder.liquidityId = binOrder.data.orderId;
        newOrder.liquidityType = "binance";
        newOrder.isLiquidity = true;
      } else {
        return res.status(400).json({
          status: false,
          message: "Something went wrong, please try again later"
        });
      }
    }
    userAssetsData.spotwallet = balance - orderValue;
    let updateUserAsset = await Assets.updateOne(
      {
        userId: req.user.id,
        currency: currencyId,
        $where: `function() {return this.spotwallet - ${orderValue} >= 0}`,
      },
      {
        $inc: {
          spotwallet: -orderValue,
        },
      },
      {
        new: true,
      }
    );

    if (updateUserAsset && updateUserAsset.nModified != 1) {
      return res.status(400).json({
        status: false,
        message: "Due to insufficient balance order cannot be placed",
      });
    }
    let redixUpdatee = await newOrder.save();
    // let updateUserAsset = await userAssetsData.save();
    //   console.log("1022262222222", binOrder);
    //   if (binOrder.status) {
    //     newOrder.liquidityId = binOrder.data.orderId;
    //     newOrder.liquidityType = "binance";
    //     newOrder.isLiquidity = true;
    //     await newOrder.save();
    //   }
    // }

    socketEmitOne(
      "updateTradeAsset",
      {
        _id: userAssetsData._id,
        spotwallet: balance - orderValue,
        derivativeWallet: updateUserAsset.derivativeWallet,
      },
      req.user.id
    );

    getOpenOrderSocket(newOrder.userId, newOrder.pairId);
    return res
      .status(200)
      .json({ status: true, message: "Your order placed successfully." });
  } catch (err) {
    console.log("errrrrrrrrrrrrrrr", err);
    return res
      .status(400)
      .json({ status: false, message: "Limit order match error1" });
  }
};

/**
 * Stop Market order place
 * URL : /api/spotOrder
 * METHOD : POST
 * BODY : spotPairId, stopPrice, quantity, buyorsell, orderType(stop_limit)
 */
export const stopMarketOrderPlace = async (req, res) => {
  try {
    let reqBody = req.body;
    reqBody.stopPrice = parseFloat(reqBody.stopPrice);
    reqBody.price = parseFloat(reqBody.price);
    reqBody.quantity = parseFloat(reqBody.quantity);

    let spotPairData = await SpotPair.findOne({ _id: reqBody.spotPairId });

    if (!spotPairData) {
      return res.status(400).json({ status: false, message: "Invalid Pair" });
    }

    // if (reqBody.price < 0.00000001) {
    //     return res.json({ 'status': false, 'message': "Price of contract must not be lesser than 0.00000001" });
    // }
    // else if (reqBody.quantity < parseFloat(spotPairData.minQuantity)) {
    //     return res.json({ 'status': false, 'message': "Quantity of contract must not be lesser than " + spotPairData.minQuantity });
    // }
    // else if (reqBody.quantity > parseFloat(spotPairData.maxQuantity)) {
    //     return res.json({ 'status': false, 'message': "Quantity of contract must not be higher than " + spotPairData.maxQuantity, });
    // }

    let currencyId =
      reqBody.buyorsell == "buy"
        ? spotPairData.secondCurrencyId
        : spotPairData.firstCurrencyId;

    let userAssetsData = await Assets.findOne({
      userId: req.user.id,
      currency: currencyId,
    });
    if (!userAssetsData) {
      return res.status(500).json({ status: false, message: "Error occured" });
    }

    let balance = parseFloat(userAssetsData.spotwallet),
      orderValue =
        reqBody.buyorsell == "buy"
          ? reqBody.price * reqBody.quantity
          : reqBody.quantity;

    if (balance < orderValue) {
      return res.status(400).json({
        status: false,
        message: "Due to insufficient balance order cannot be placed",
      });
    }

    userAssetsData.spotwallet = balance - orderValue;
    let updateUserAsset = await userAssetsData.save();

    socketEmitOne(
      "updateTradeAsset",
      {
        _id: updateUserAsset._id,
        spotwallet: updateUserAsset.spotwallet,
        derivativeWallet: updateUserAsset.derivativeWallet,
      },
      req.user.id
    );

    let conditionalType = "equal";
    if (spotPairData.markPrice < reqBody.stopPrice) {
      conditionalType = "greater_than";
    } else if (spotPairData.markPrice > reqBody.stopPrice) {
      conditionalType = "lesser_than";
    }

    const newSpotTrade = new SpotTrade({
      userId: req.user.id,
      pairId: spotPairData._id,
      firstCurrencyId: spotPairData.firstCurrencyId,
      firstCurrency: spotPairData.firstCurrencySymbol,
      secondCurrencyId: spotPairData.secondCurrencyId,
      secondCurrency: spotPairData.secondCurrencySymbol,
      botstatus: spotPairData.botstatus,
      stopPrice: reqBody.stopPrice,
      price: reqBody.price,
      quantity: reqBody.quantity,

      orderValue: orderValue,

      pairName: `${spotPairData.firstCurrencySymbol}${spotPairData.secondCurrencySymbol}`,
      beforeBalance: balance,
      afterBalance: updateUserAsset.spotwallet,

      orderType: reqBody.orderType,
      orderDate: new Date(),
      buyorsell: reqBody.buyorsell,
      conditionalType,
      status: "conditional",
    });

    let newOrder = await newSpotTrade.save();
    getOpenOrderSocket(newOrder.userId, newOrder.pairId);
    return res
      .status(200)
      .json({ status: true, message: "Your order placed successfully." });
  } catch (err) {
    return res
      .status(400)
      .json({ status: false, message: "Stop Market order match error" });
  }
};

export const marketProcess = async (newOrder) => {
  try {
    let updateNewOrder = {},
      status = newOrder.filledQuantity > 0 ? "completed" : "cancel";
    updateNewOrder["status"] = status;
    if (status == "completed") {
      updateNewOrder["quantity"] = newOrder.filledQuantity;
    }

    let updateOrder = await SpotTrade.findByIdAndUpdate(newOrder._id,
      updateNewOrder,
      { new: true }
    );

    // console.log("----updateOrder", updateOrder)

    await getOrderHistorySocket(newOrder.userId, newOrder.pairId);
    await getTradeHistorySocket(newOrder.userId, newOrder.pairId);

    // Balance Retrieve
    await assetUpdate({
      currencyId:
        updateOrder.buyorsell == "sell"
          ? updateOrder.firstCurrencyId
          : updateOrder.secondCurrencyId,
      userId: updateOrder.userId,
      balance:
        updateOrder.buyorsell == "sell"
          ? updateOrder.quantity - updateOrder.filledQuantity
          : updateOrder.price *
          (updateOrder.quantity - updateOrder.filledQuantity),
      type: "spot_bal_retrive",
      tableId: updateOrder._id,
    });

    await getOrderBookSocket(pairData._id);

    return false;
  } catch (err) {
    return false;
  }
};

export const tradeList = async (newOrder, pairData) => {
  try {
    let matchQuery = {
      $or: [{ status: "open" }, { status: "pending" }],
      userId: { $ne: ObjectId(newOrder.userId) },
      pairId: ObjectId(newOrder.pairId),
    };

    let sortQuery = { price: 1 };

    if (newOrder.buyorsell == "buy") {
      matchQuery["buyorsell"] = "sell";
      matchQuery["price"] = { $lte: newOrder.price };
    } else if (newOrder.buyorsell == "sell") {
      matchQuery["buyorsell"] = "buy";
      matchQuery["price"] = { $gte: newOrder.price };
      sortQuery = { price: -1 };
    }

    let orderList = await SpotTrade.aggregate([
      { $match: matchQuery },
      { $sort: sortQuery },
      { $limit: 50 },
    ]);

    if (
      pairData &&
      pairData.botstatus == "off" &&
      orderList &&
      orderList.length > 0
    ) {
      if (!cancelOrderArr.includes(IncCntObjId(newOrder._id))) {
        cancelOrderArr.push(IncCntObjId(newOrder._id));
      }

      let matchListData =
        orderList &&
        orderList.length > 0 &&
        orderList.map((item) => {
          return IncCntObjId(item._id);
        });
      cancelOrderArr = [...cancelOrderArr, ...matchListData];
      let result = await tradeMatching(newOrder, orderList, 0, pairData);
      cancelOrderArr = [];
      return result;
    }
    else {
      if (newOrder.orderType == "market") {
        return await marketProcess(newOrder);
      }
      // return false;
    }

    return true;
  } catch (err) {
    console.log("Error on Trade match ", err);
    return false;
  }
};

export const tradeMatching = async (
  newOrder,
  orderData,
  count = 0,
  pairData
) => {
  try {


    if (!["open", "pending"].includes(newOrder.status)) {
      return true;
    } else if (isEmpty(orderData[count])) {
      // if (pairData.botstatus == "wazirx") {
      //   var payloadObj = {
      //     symbol: (
      //       pairData.firstCurrencySymbol + pairData.secondCurrencySymbol
      //     ).toLowerCase(),
      //     //  "symbol":"wrxinr",
      //     side: newOrder.buyorsell,
      //     type: newOrder.orderType,
      //     quantity: newOrder.quantity,
      //     price: newOrder.price,
      //     pairId: pairData._id,
      //     userId: newOrder.userId,
      //     botstatus: pairData.botstatus,
      //     markupPercentage: pairData.markupPercentage,
      //     newOrder_id: newOrder._id,
      //   };

      //   wazirixOrderPlace(payloadObj);
      // }
      // console.log('pairData',pairData)
      // if (pairData.botstatus == "binance") {
      //   var payloadObj = {
      //     symbol: pairData.firstCurrencySymbol + pairData.secondCurrencySymbol,
      //     buyorsell: newOrder.buyorsell,
      //     orderType: newOrder.orderType,
      //     quantity: newOrder.quantity,
      //     price: pairData.markPrice,
      //     pairId: pairData._id,
      //     userId: newOrder.userId,
      //     markupPercentage: pairData.markupPercentage,
      //     botstatus: pairData.botstatus,
      //     firstCurrencySymbol: pairData.firstCurrencySymbol,
      //     secondCurrencySymbol: pairData.secondCurrencySymbol,
      //     minimumValue: pairData.minQuantity,
      //     stopPrice: newOrder.stopPrice ? newOrder.stopPrice : 0,
      //   };
      //  console.log('payloadObj',payloadObj)
      //   let binOrder = await binanceCtrl.orderPlace(payloadObj);
      //   console.log('binOrder',binOrder)
      //   if (binOrder.status) {
      //     newOrder.liquidityId = binOrder.orderId;
      //     newOrder.liquidityType = "binance";
      //     newOrder.isLiquidity = true;
      //     await newOrder.save();
      //   }
      // }
      if (newOrder.orderType == "market") {
        marketProcess(newOrder);
        return count == 0 ? false : true;
      }

      return true;
    }
    let sellOrderData,
      buyOrderData,
      sellAdminFee = 0,
      buyAdminFee = 0,
      buyMaker = false,
      sellMaker = false,
      execPrice = 0,
      uniqueId = Math.floor(Math.random() * 1000000000);

    if (newOrder.buyorsell == "buy") {
      buyOrderData = newOrder;
      sellOrderData = orderData[count];
      buyAdminFee = pairData.taker_fees;
      sellAdminFee = pairData.maker_rebate;
      buyMaker = false;
      sellMaker = true;
      execPrice = sellOrderData.price;
    } else if (newOrder.buyorsell == "sell") {
      sellOrderData = newOrder;
      buyOrderData = orderData[count];
      sellAdminFee = pairData.taker_fees;
      buyAdminFee = pairData.maker_rebate;
      buyMaker = true;
      sellMaker = false;
      execPrice = buyOrderData.price;
    }
    let sellQuantity = sellOrderData.quantity - sellOrderData.filledQuantity;
    let buyQuantity = buyOrderData.quantity - buyOrderData.filledQuantity;

    sellQuantity = sellQuantity.toFixed(8);
    buyQuantity = buyQuantity.toFixed(8);
    sellQuantity = parseFloat(sellQuantity);
    buyQuantity = parseFloat(buyQuantity);

    // Equal quantity check
    if (sellQuantity == buyQuantity) {

      let updateNewOrder = {
        status: "completed",
        filledQuantity: sellOrderData.filledQuantity + sellQuantity,

        $push: {
          filled: {
            pairId: sellOrderData.pairId,
            sellUserId: sellOrderData.userId,
            buyUserId: buyOrderData.userId,
            userId: sellOrderData.userId,
            sellOrderId: sellOrderData._id,
            buyOrderId: buyOrderData._id,
            uniqueId: uniqueId,
            price: execPrice, // sellOrderData.price,
            filledQuantity: sellQuantity,
            Fees: calculateServiceFee({
              price: execPrice * sellQuantity, // sellOrderData.price * sellQuantity,
              serviceFee: sellAdminFee,
            }),
            isMaker: sellMaker,
            status: "filled",
            Type: "buy",
            createdAt: new Date(),
            orderValue: sellQuantity * execPrice, // sellQuantity * sellOrderData.price,
          },
        },
      };

      // Own Token Fee Calculation for sell update
      let final_fee_newOrder = await tokenFeecalculation({
        orderData: sellOrderData,
        fees: calculateServiceFee({
          price: sellQuantity * execPrice, // sellOrderData.price * sellQuantity,
          serviceFee: sellAdminFee,
        }),
        pairData,
        tradePrice: execPrice, // sellOrderData.price,
        tradeQuantity: sellQuantity,
        serviceFee: sellAdminFee,
        type: "spot_trade",
        tableId: sellOrderData._id,
      });

      updateNewOrder["$push"]["filled"]["Fees"] = final_fee_newOrder.fees;
      updateNewOrder["$push"]["filled"]["OwnToken"] =
        final_fee_newOrder.own_token;

      let updateSellOrder = await SpotTrade.findByIdAndUpdate(
        sellOrderData._id,
        updateNewOrder,
        { new: true }
      );

      await getOpenOrderSocket(sellOrderData.userId, sellOrderData.pairId);
      await getOrderHistorySocket(sellOrderData.userId, sellOrderData.pairId);
      await getTradeHistorySocket(sellOrderData.userId, sellOrderData.pairId);

      // Buy update

      let updateOrderData = {
        status: "completed",
        filledQuantity: buyOrderData.filledQuantity + buyQuantity,

        $push: {
          filled: {
            pairId: buyOrderData.pairId,
            sellUserId: sellOrderData.userId,
            buyUserId: buyOrderData.userId,
            userId: buyOrderData.userId,
            sellOrderId: sellOrderData._id,
            buyOrderId: buyOrderData._id,
            uniqueId: uniqueId,
            price: execPrice, // sellOrderData.price,
            filledQuantity: buyQuantity,
            Fees: calculateServiceFee({
              price: buyQuantity,
              serviceFee: buyAdminFee,
            }),
            isMaker: buyMaker,
            status: "filled",
            Type: "buy",
            createdAt: new Date(),
            orderValue: buyQuantity * execPrice, // buyQuantity * sellOrderData.price,
          },
        },
      };

      // Own Token Fee Calculation buy update
      let final_fee = await tokenFeecalculation({
        orderData: buyOrderData,
        fees: calculateServiceFee({
          price: buyQuantity,
          serviceFee: buyAdminFee,
        }),
        pairData,
        tradePrice: execPrice, // sellOrderData.price,
        tradeQuantity: buyQuantity,
        serviceFee: buyAdminFee,
        type: "spot_trade",
        tableId: buyOrderData._id,
      });


      updateOrderData["$push"]["filled"]["Fees"] = final_fee.fees;
      updateOrderData["$push"]["filled"]["OwnToken"] = final_fee.own_token;

      let updateBuyOrde = await SpotTrade.findByIdAndUpdate(
        buyOrderData._id,
        updateOrderData,
        { new: true }
      );


      // Balance Retrieve
      if (
        !buyMaker &&
        ["limit"].includes(newOrder.orderType) &&
        sellOrderData.price < buyOrderData.price
      ) {
        await assetUpdate({
          currencyId: buyOrderData.secondCurrencyId,
          userId: buyOrderData.userId,
          balance:
            buyOrderData.price * buyQuantity -
            sellOrderData.price * buyQuantity,
          type: "spot_bal_retrive",
          tableId: buyOrderData._id,
        });
      }

      await getOpenOrderSocket(buyOrderData.userId, buyOrderData.pairId);
      await getOrderHistorySocket(buyOrderData.userId, buyOrderData.pairId);
      await getTradeHistorySocket(buyOrderData.userId, buyOrderData.pairId);

      if (pairData.botstatus == "off") {
        await getOrderBookSocket(buyOrderData.pairId);
        await marketPriceSocket(buyOrderData.pairId);
      }
      await recentTradeSocket(buyOrderData.pairId);

      return true;
    }

    // buy quantity higher
    else if (sellQuantity < buyQuantity) {
      //Sell update

      let updateNewOrder = {
        $set: {
          status: "completed",
          filledQuantity: sellOrderData.filledQuantity + sellQuantity,
        },
        $push: {
          filled: {
            pairId: sellOrderData.pairId,
            sellUserId: sellOrderData.userId,
            buyUserId: buyOrderData.userId,
            userId: sellOrderData.userId,
            sellOrderId: sellOrderData._id,
            buyOrderId: buyOrderData._id,
            uniqueId: uniqueId,
            price: execPrice, // sellOrderData.price,
            filledQuantity: sellQuantity,
            Fees: calculateServiceFee({
              price: execPrice * sellQuantity, // sellOrderData.price * sellQuantity,
              serviceFee: sellAdminFee,
            }),
            isMaker: sellMaker,
            status: "filled",
            Type: "sell",
            createdAt: new Date(),
            orderValue: sellQuantity * execPrice, // sellQuantity * sellOrderData.price,
          },
        },
      };

      // Own Token Fee Calculation sell update
      let final_fee_newOrder = await tokenFeecalculation({
        orderData: sellOrderData,
        fees: calculateServiceFee({
          price: sellQuantity * execPrice, //sellOrderData.price * sellQuantity,
          serviceFee: sellAdminFee,
        }),
        pairData,
        tradePrice: execPrice, // sellOrderData.price,
        tradeQuantity: sellQuantity,
        serviceFee: sellAdminFee,
        type: "spot_trade",
        tableId: sellOrderData._id,
      });


      updateNewOrder["$push"]["filled"]["Fees"] = final_fee_newOrder.fees;
      updateNewOrder["$push"]["filled"]["OwnToken"] =
        final_fee_newOrder.own_token;

      let updateSellOrder = await SpotTrade.findByIdAndUpdate(
        sellOrderData._id,
        updateNewOrder,
        { new: true }
      );

      await getOpenOrderSocket(sellOrderData.userId, sellOrderData.pairId);
      await getOrderHistorySocket(sellOrderData.userId, sellOrderData.pairId);
      await getTradeHistorySocket(sellOrderData.userId, sellOrderData.pairId);

      // Buy update
      let updateOrderData = {
        $set: {
          status: "pending",
          filledQuantity: buyOrderData.filledQuantity + sellQuantity,
        },
        $push: {
          filled: {
            pairId: buyOrderData.pairId,
            sellUserId: sellOrderData.userId,
            buyUserId: buyOrderData.userId,
            userId: buyOrderData.userId,
            sellOrderId: sellOrderData._id,
            buyOrderId: buyOrderData._id,
            uniqueId: uniqueId,
            price: execPrice, // buyOrderData.price,
            filledQuantity: sellQuantity,
            Fees: calculateServiceFee({
              price: sellQuantity,
              serviceFee: buyAdminFee,
            }),
            isMaker: buyMaker,
            status: "filled",
            Type: "buy",
            createdAt: new Date(),
            orderValue: sellQuantity * execPrice, // sellQuantity * buyOrderData.price,
          },
        },
      };

      // Own Token Fee Calculation buy update
      let final_fee = await tokenFeecalculation({
        orderData: buyOrderData,
        fees: calculateServiceFee({
          price: sellQuantity,
          serviceFee: buyAdminFee,
        }),
        pairData,
        tradePrice: execPrice, // buyOrderData.price,
        tradeQuantity: sellQuantity,
        serviceFee: buyAdminFee,
        type: "spot_trade",
        tableId: buyOrderData._id,
      });
      // End

      updateOrderData["$push"]["filled"]["Fees"] = final_fee.fees;
      updateOrderData["$push"]["filled"]["OwnToken"] = final_fee.own_token;

      let updateBuyOrder = await SpotTrade.findByIdAndUpdate(
        buyOrderData._id,
        updateOrderData,
        { new: true }
      );

      // Balance Retrieve
      if (
        !buyMaker &&
        ["limit"].includes(newOrder.orderType) &&
        sellOrderData.price < buyOrderData.price
      ) {
        await assetUpdate({
          currencyId: buyOrderData.secondCurrencyId,
          userId: buyOrderData.userId,
          balance:
            buyOrderData.price * sellQuantity -
            sellOrderData.price * sellQuantity,
          type: "spot_bal_retrive",
          tableId: buyOrderData._id,
        });
      }

      await getOpenOrderSocket(buyOrderData.userId, buyOrderData.pairId);
      await getTradeHistorySocket(buyOrderData.userId, buyOrderData.pairId);

      if (pairData.botstatus == "off") {
        await getOrderBookSocket(buyOrderData.pairId);
        await marketPriceSocket(buyOrderData.pairId);
      }

      await recentTradeSocket(buyOrderData.pairId);

      if (newOrder.buyorsell == "sell") {
        return true;
      } else if (newOrder.buyorsell == "buy") {
        return await tradeMatching(
          updateBuyOrder,
          orderData,
          (count = count + 1),
          pairData
        );
      }
    }
    // seller quanity higher
    else if (sellQuantity > buyQuantity) {
      let updateNewOrder = {
        $set: {
          status: "pending",
          filledQuantity: sellOrderData.filledQuantity + buyQuantity,
        },
        $push: {
          filled: {
            pairId: sellOrderData.pairId,
            sellUserId: sellOrderData.userId,
            buyUserId: buyOrderData.userId,
            userId: sellOrderData.userId,
            sellOrderId: sellOrderData._id,
            buyOrderId: buyOrderData._id,
            uniqueId: uniqueId,
            price: execPrice, // sellOrderData.price,
            filledQuantity: buyQuantity,
            Fees: calculateServiceFee({
              price: execPrice * buyQuantity, // sellOrderData.price * buyQuantity,
              serviceFee: sellAdminFee,
            }),
            isMaker: sellMaker,
            status: "filled",
            Type: "sell",
            createdAt: new Date(),
            orderValue: buyQuantity * execPrice, // buyQuantity * sellOrderData.price,
          },
        },
      };

      // Own Token Fee Calculation for sell update
      let final_fee_newOrder = await tokenFeecalculation({
        orderData: sellOrderData,
        fees: calculateServiceFee({
          price: buyQuantity * execPrice, // sellOrderData.price * buyQuantity,
          serviceFee: sellAdminFee,
        }),
        pairData,
        tradePrice: execPrice, // sellOrderData.price,
        tradeQuantity: buyQuantity,
        serviceFee: sellAdminFee,
        type: "spot_trade",
        tableId: sellOrderData._id,
      });
      // End
      updateNewOrder["$push"]["filled"]["Fees"] = final_fee_newOrder.fees;
      updateNewOrder["$push"]["filled"]["OwnToken"] =
        final_fee_newOrder.own_token;

      let updateSellOrder = await SpotTrade.findByIdAndUpdate(
        sellOrderData._id,
        updateNewOrder,
        { new: true }
      );

      await getOpenOrderSocket(sellOrderData.userId, sellOrderData.pairId);
      await getTradeHistorySocket(sellOrderData.userId, sellOrderData.pairId);

      // Buy update

      var updateOrderData = {
        $set: {
          status: "completed",
          filledQuantity: buyOrderData.filledQuantity + buyQuantity,
        },
        $push: {
          filled: {
            pairId: buyOrderData.pairId,
            sellUserId: sellOrderData.userId,
            buyUserId: buyOrderData.userId,
            userId: buyOrderData.userId,
            sellOrderId: sellOrderData._id,
            buyOrderId: buyOrderData._id,
            uniqueId: uniqueId,
            price: execPrice, // buyOrderData.price,
            filledQuantity: buyQuantity,
            Fees: calculateServiceFee({
              price: buyQuantity,
              serviceFee: buyAdminFee,
            }),
            isMaker: buyMaker,
            status: "filled",
            Type: "buy",
            createdAt: new Date(),
            orderValue: buyQuantity * execPrice, // buyQuantity * buyOrderData.price,
          },
        },
      };

      // Own Token Fee Calculation buy update
      let final_fee = await tokenFeecalculation({
        orderData: buyOrderData,
        fees: calculateServiceFee({
          price: buyQuantity,
          serviceFee: buyAdminFee,
        }),
        pairData,
        tradePrice: execPrice, // buyOrderData.price,
        tradeQuantity: buyQuantity,
        serviceFee: buyAdminFee,
        type: "spot_trade",
        tableId: buyOrderData._id,
      });


      updateOrderData["$push"]["filled"]["Fees"] = final_fee.fees;
      updateOrderData["$push"]["filled"]["OwnToken"] = final_fee.own_token;

      let updateBuyOrder = await SpotTrade.findByIdAndUpdate(
        buyOrderData._id,
        updateOrderData,
        { new: true }
      );

      // Balance Retrieve
      if (
        !buyMaker &&
        ["limit"].includes(newOrder.orderType) &&
        sellOrderData.price < buyOrderData.price
      ) {
        await assetUpdate({
          currencyId: buyOrderData.secondCurrencyId,
          userId: buyOrderData.userId,
          balance:
            buyOrderData.price * buyQuantity -
            sellOrderData.price * buyQuantity,
          type: "spot_bal_retrive",
          tableId: buyOrderData._id,
        });
      }

      await getOpenOrderSocket(buyOrderData.userId, buyOrderData.pairId);
      await getOrderHistorySocket(buyOrderData.userId, buyOrderData.pairId);
      await getTradeHistorySocket(buyOrderData.userId, buyOrderData.pairId);

      if (pairData.botstatus == "off") {
        await getOrderBookSocket(buyOrderData.pairId);
        await marketPriceSocket(buyOrderData.pairId);
      }
      await recentTradeSocket(buyOrderData.pairId);

      if (newOrder.buyorsell == "buy") {

        return true;
      } else if (newOrder.buyorsell == "sell") {
        return await tradeMatching(
          updateSellOrder,
          orderData,
          (count = count + 1),
          pairData
        );
      }
    }
  } catch (err) {
    console.log("Error on buy side trade matching ", err);
  }
};

/**
 * Admin Liquidity
 */
let adminLiquidity = false;
export const adminLiquidityPair = async () => {
  if (adminLiquidity) {
    return false;
  }
  adminLiquidity = false;
  try {
    let pairList = await SpotPair.find({ botstatus: "off" }).lean();

    let botUsr = await User.findOne(
      { role: "trade_bot" },
      { firstName: 1, lastName: 1, email: 1 }
    ).lean();
    if (pairList.length > 0 && botUsr) {
      // let adminData = await Admin.findOne({ role: "superadmin" });
      for (let pairData of pairList) {
        if (pairData.markPrice > 0) {
          await adminLiquiditySellOrder(pairData, botUsr);
          await adminLiquidityBuyOrder(pairData, botUsr);
        }
      }
    }
    adminLiquidity = false;
  } catch (err) {
    adminLiquidity = false;
    console.log("Error on admin liquidity pair ", err);
  }
};

export const adminLiquiditySellOrder = async (pairData, adminData) => {
  try {
    let sellOrderList = await SpotTrade.find({
      pairId: pairData._id,
      buyorsell: "sell",
      price: {
        $lte: pairData.markPrice,
      },
      status: { $in: ["open", "pending"] },
    })
      .limit(100)
      .sort({ price: 1 });

    if (sellOrderList && sellOrderList.length > 0) {
      for (let sellOrderData of sellOrderList) {
        let remainingQuantity =
          sellOrderData.quantity - sellOrderData.filledQuantity;
        let buyOrderId = ObjectId();
        let uniqueId = Math.floor(Math.random() * 1000000000);

        const buyOrder = new SpotTrade({
          _id: buyOrderId,
          userId: adminData._id,
          pairId: sellOrderData.pairId,
          firstCurrencyId: sellOrderData.firstCurrencyId,
          firstCurrency: sellOrderData.firstCurrency,
          secondCurrencyId: sellOrderData.secondCurrencyId,
          secondCurrency: sellOrderData.secondCurrency,

          quantity: remainingQuantity,
          price: sellOrderData.price,
          orderValue: sellOrderData.price * remainingQuantity,

          pairName: `${sellOrderData.firstCurrency}${sellOrderData.secondCurrency}`,

          orderType: "market",
          orderDate: new Date(),
          buyorsell: "buy",
          status: "completed",

          filled: [
            {
              pairId: sellOrderData.pairId,
              sellUserId: sellOrderData.userId,
              buyUserId: adminData._id,
              userId: adminData._id,
              sellOrderId: sellOrderData._id,
              buyOrderId: buyOrderId,
              uniqueId: uniqueId,
              price: sellOrderData.price,
              filledQuantity: remainingQuantity,
              Fees: calculateServiceFee({
                price: remainingQuantity,
                serviceFee: pairData.maker_rebate,
              }),
              status: "filled",
              Type: "buy",
              createdAt: new Date(),
              orderValue: sellOrderData.price * remainingQuantity,
            },
          ],
        });

        await buyOrder.save();

        await SpotTrade.findOneAndUpdate(
          {
            _id: sellOrderData._id,
          },
          {
            $set: {
              status: "completed",
              filledQuantity: sellOrderData.filledQuantity + remainingQuantity,
            },
            $push: {
              filled: {
                pairId: sellOrderData.pairId,
                sellUserId: sellOrderData.userId,
                buyUserId: adminData._id,
                userId: sellOrderData.userId,
                sellOrderId: sellOrderData._id,
                buyOrderId: buyOrderId,
                uniqueId: uniqueId,
                price: sellOrderData.price,
                filledQuantity: remainingQuantity,
                Fees: calculateServiceFee({
                  price: sellOrderData.price * remainingQuantity,
                  serviceFee: pairData.taker_fees,
                }),
                status: "filled",
                Type: "sell",
                createdAt: new Date(),
                orderValue: sellOrderData.price * remainingQuantity,
              },
            },
          },
          { new: true }
        );

        await assetUpdate({
          currencyId: sellOrderData.secondCurrencyId,
          userId: sellOrderData.userId,
          balance: withServiceFee({
            price: sellOrderData.price * remainingQuantity,
            serviceFee: pairData.taker_fees,
          }),
        });

        await getOpenOrderSocket(sellOrderData.userId, sellOrderData.pairId);
        await getOrderHistorySocket(sellOrderData.userId, sellOrderData.pairId);
        await getTradeHistorySocket(sellOrderData.userId, sellOrderData.pairId);

        if (pairData.botstatus == "off") {
          await getOrderBookSocket(sellOrderData.pairId);
          await marketPriceSocket(sellOrderData.pairId);
        }
        await recentTradeSocket(sellOrderData.pairId);
      }
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const adminLiquidityBuyOrder = async (pairData, adminData) => {
  try {
    let buyOrderList = await SpotTrade.find({
      pairId: pairData._id,
      buyorsell: "buy",
      price: {
        $gte: pairData.markPrice,
      },
      status: { $in: ["open", "pending"] },
    })
      .limit(100)
      .sort({ price: 1 });
    if (buyOrderList && buyOrderList.length > 0) {
      for (let buyOrderData of buyOrderList) {
        let remainingQuantity =
          buyOrderData.quantity - buyOrderData.filledQuantity;
        let sellOrderId = ObjectId();
        let uniqueId = Math.floor(Math.random() * 1000000000);

        const sellOrder = new SpotTrade({
          _id: sellOrderId,
          userId: adminData._id,
          pairId: buyOrderData.pairId,
          firstCurrencyId: buyOrderData.firstCurrencyId,
          firstCurrency: buyOrderData.firstCurrency,
          secondCurrencyId: buyOrderData.secondCurrencyId,
          secondCurrency: buyOrderData.secondCurrency,

          quantity: remainingQuantity,
          price: buyOrderData.price,
          orderValue: buyOrderData.price * remainingQuantity,

          pairName: `${buyOrderData.firstCurrency}${buyOrderData.secondCurrency}`,

          orderType: "market",
          orderDate: new Date(),
          buyorsell: "sell",
          status: "completed",

          filled: [
            {
              pairId: buyOrderData.pairId,
              sellUserId: adminData._id,
              buyUserId: buyOrderData.userId,
              userId: adminData._id,
              sellOrderId: sellOrderId,
              buyOrderId: buyOrderData._id,
              uniqueId: uniqueId,
              price: buyOrderData.price,
              filledQuantity: remainingQuantity,
              Fees: calculateServiceFee({
                price: buyOrderData.price * remainingQuantity,
                serviceFee: pairData.maker_rebate,
              }),
              status: "filled",
              Type: "sell",
              createdAt: new Date(),
              orderValue: buyOrderData.price * remainingQuantity,
            },
          ],
        });

        await sellOrder.save();

        await SpotTrade.findOneAndUpdate(
          {
            _id: buyOrderData._id,
          },
          {
            $set: {
              status: "completed",
              filledQuantity: buyOrderData.filledQuantity + remainingQuantity,
            },
            $push: {
              filled: {
                pairId: buyOrderData.pairId,
                sellUserId: adminData._id,
                buyUserId: buyOrderData.userId,
                userId: buyOrderData.userId,
                sellOrderId: sellOrderId,
                buyOrderId: buyOrderData._id,
                uniqueId: uniqueId,
                price: buyOrderData.price,
                filledQuantity: remainingQuantity,
                Fees: calculateServiceFee({
                  price: remainingQuantity,
                  serviceFee: pairData.taker_fees,
                }),
                status: "filled",
                Type: "buy",
                createdAt: new Date(),
                orderValue: buyOrderData.price * remainingQuantity,
              },
            },
          },
          { new: true }
        );

        await assetUpdate({
          currencyId: buyOrderData.firstCurrencyId,
          userId: buyOrderData.userId,
          balance: withServiceFee({
            price: buyOrderData.price * remainingQuantity,
            serviceFee: pairData.taker_fees,
          }),
        });

        await getOpenOrderSocket(buyOrderData.userId, buyOrderData.pairId);
        await getOrderHistorySocket(buyOrderData.userId, buyOrderData.pairId);
        await getTradeHistorySocket(buyOrderData.userId, buyOrderData.pairId);

        if (pairData.botstatus == "off") {
          await getOrderBookSocket(buyOrderData.pairId);
          await marketPriceSocket(buyOrderData.pairId);
        }
        await recentTradeSocket(buyOrderData.pairId);
      }
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const assetUpdate = async ({
  currencyId,
  userId,
  balance,
  tableId = "",
  type = "",
  category = "",
}) => {
  try {
    let walletData = await Assets.findOne({
      userId: userId,
      currency: currencyId,
    });
    if (walletData) {
      let beforeBalance = parseFloat(walletData.spotwallet);
      walletData.spotwallet = walletData.spotwallet + parseFloat(balance);
      let updateData = await walletData.save();

      // add passbook
      let passbookData = {};
      passbookData.userId = walletData.userId;
      passbookData.coin = walletData.currencySymbol;
      passbookData.currencyId = walletData.currency;
      passbookData.tableId = tableId;
      passbookData.beforeBalance = beforeBalance;
      passbookData.afterBalance = walletData.spotwallet;
      passbookData.amount = category == "debit" ? -balance : balance;
      passbookData.type = type;
      passbookData.category = category ? category : "credit";
      let passbook = createPassBook(passbookData);

      socketEmitOne(
        "updateTradeAsset",
        {
          _id: updateData._id,
          spotwallet: updateData.spotwallet,
          derivativeWallet: updateData.derivativeWallet,
        },
        userId
      );
      return passbook;
    }
  } catch (err) {
    console.log("erer", err);
  }
};

/**
 * Get Order Book
 * URL : /api/spot/ordeBook/:{{pairId}}
 * METHOD : GET
 * PARAMS : pairId
 */
export const getOrderBook = async (req, res) => {
  try {
    let result = await orderBookData({
      pairId: req.params.pairId,
    });

    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

/**
 * Get Order Book Socket
 * PARAMS : pairId
 */
export const getOrderBookSocket = async (pairId) => {
  try {
    let result = await orderBookData({
      pairId: pairId,
    });

    result["pairId"] = pairId;
    socketEmitAll("orderBook", result);
    return true;
  } catch (err) {
    return false;
  }
};

export const orderBookData = async ({ pairId }) => {
  try {
    let buyOrder = await SpotTrade.aggregate([
      {
        $match: {
          pairId: ObjectId(pairId),
          $or: [{ status: "open" }, { status: "pending" }],
          buyorsell: "buy",
        },
      },
      {
        $group: {
          _id: "$price",
          quantity: { $sum: "$quantity" },
          filledQuantity: { $sum: "$filledQuantity" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 10 },
    ]);

    let sellOrder = await SpotTrade.aggregate([
      {
        $match: {
          pairId: ObjectId(pairId),
          $or: [{ status: "open" }, { status: "pending" }],
          buyorsell: "sell",
        },
      },
      {
        $group: {
          _id: "$price",
          quantity: { $sum: "$quantity" },
          filledQuantity: { $sum: "$filledQuantity" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 10 },
    ]);

    if (buyOrder.length > 0) {
      let sumamount = 0;
      for (let i = 0; i < buyOrder.length; i++) {
        let quantity =
          parseFloat(buyOrder[i].quantity) -
          parseFloat(buyOrder[i].filledQuantity);
        sumamount = parseFloat(sumamount) + parseFloat(quantity);
        buyOrder[i].total = sumamount;
        buyOrder[i].quantity = quantity;
      }
    }

    if (sellOrder.length > 0) {
      let sumamount = 0;
      for (let i = 0; i < sellOrder.length; i++) {
        let quantity =
          parseFloat(sellOrder[i].quantity) -
          parseFloat(sellOrder[i].filledQuantity);
        sumamount = parseFloat(sumamount) + parseFloat(quantity);
        sellOrder[i].total = sumamount;
        sellOrder[i].quantity = quantity;
      }
    }
    sellOrder = sellOrder.reverse();
    // console.log("vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv", buyOrder, sellOrder)
    return {
      buyOrder,
      sellOrder,
    };
  } catch (err) {
    return {
      buyOrder: [],
      sellOrder: [],
    };
  }
};

/**
 * Get User Open Order
 * URL : /api/spot/openOrder/{{pairId}}
 * METHOD : GET
 * Query : page, limit
 */
export const getOpenOrder = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);

    let count = await SpotTrade.countDocuments({
      userId: req.user.id,
      pairId: req.params.pairId,
      status: { $in: ["open", "pending", "wait", "idle", "conditional"] },
    });
    let data = await SpotTrade.aggregate([
      {
        $match: {
          userId: ObjectId(req.user.id),
          pairId: ObjectId(req.params.pairId),
          status: { $in: ["open", "pending", "wait", "idle", "conditional"] },
        },
      },
      { $sort: { _id: -1 } },
      { $skip: pagination.skip },
      { $limit: pagination.limit },
      {
        $project: {
          // "orderDate": {
          //     "$dateToString": {
          //         "date": '$orderDate',
          //         "format": "%Y-%m-%d %H:%M"
          //     }
          // },
          orderDate: 1,
          firstCurrency: 1,
          secondCurrency: 1,
          orderType: 1,
          buyorsell: 1,
          price: 1,
          quantity: 1,
          filledQuantity: 1,
          orderValue: 1,
          conditionalType: 1,
          stopPrice: 1,
        },
      },
    ]);

    // console.log("datadata",data)
    let result = {
      count,
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
 * Get User Open Order Socket
 * userId, pairId
 */
export const getOpenOrderSocket = async (userId, pairId) => {
  try {
    let count = await SpotTrade.countDocuments({
      userId: userId,
      pairId: pairId,
      status: { $in: ["open", "pending", "conditional", "wait", "idle"] },
    });
    let data = await SpotTrade.aggregate([
      {
        $match: {
          userId: ObjectId(userId),
          pairId: ObjectId(pairId),
          status: { $in: ["open", "pending", "conditional"] },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 10 },
      {
        $project: {
          // "orderDate": {
          //     "$dateToString": {
          //         "date": '$orderDate',
          //         "format": "%Y-%m-%d %H:%M"
          //     }
          // },
          orderDate: 1,
          firstCurrency: 1,
          secondCurrency: 1,
          orderType: 1,
          buyorsell: 1,
          price: 1,
          quantity: 1,
          filledQuantity: 1,
          orderValue: 1,
          conditionalType: 1,
          stopPrice: 1,
        },
      },
    ]);

    let result = {
      pairId,
      count,
      currentPage: 1,
      nextPage: count > data.length,
      limit: 10,
      data,
    };

    socketEmitOne("openOrder", result, userId);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Get User Filled Order
 * URL : /api/spot/openOrder/{{pairId}}
 * METHOD : GET
 * Query : page, limit
 */
export const getFilledOrder = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);

    let count = await SpotTrade.countDocuments({
      userId: req.user.id,
      pairId: req.params.pairId,
      status: "completed",
    });
    let data = await SpotTrade.aggregate([
      {
        $match: {
          userId: ObjectId(req.user.id),
          pairId: ObjectId(req.params.pairId),
          status: "completed",
        },
      },
      { $sort: { _id: -1 } },
      { $skip: pagination.skip },
      { $limit: pagination.limit },
      {
        $project: {
          // "orderDate": {
          //     "$dateToString": {
          //         "date": '$orderDate',
          //         "format": "%Y-%m-%d %H:%M"
          //     }
          // },
          orderDate: 1,
          firstCurrency: 1,
          secondCurrency: 1,
          orderType: 1,
          buyorsell: 1,
          price: 1,
          quantity: 1,
          filledQuantity: 1,
          orderValue: 1,
        },
      },
    ]);

    let result = {
      count,
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
 * Get User Filled Order Socket
 * userId, pairId
 */
export const getFilledOrderSocket = async (userId, pairId) => {
  try {
    let count = await SpotTrade.countDocuments({
      userId: userId,
      pairId: pairId,
      status: "completed",
    });
    let data = await SpotTrade.aggregate([
      {
        $match: {
          userId: ObjectId(userId),
          pairId: ObjectId(pairId),
          status: "completed",
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 10 },
      {
        $project: {
          // "orderDate": {
          //     "$dateToString": {
          //         "date": '$orderDate',
          //         "format": "%Y-%m-%d %H:%M"
          //     }
          // },
          orderDate: 1,
          firstCurrency: 1,
          secondCurrency: 1,
          orderType: 1,
          buyorsell: 1,
          price: 1,
          quantity: 1,
          filledQuantity: 1,
          orderValue: 1,
        },
      },
    ]);

    let result = {
      pairId,
      count,
      currentPage: 1,
      nextPage: count > data.length,
      limit: 10,
      data,
    };
    socketEmitOne("filledOrder", result, userId);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Get User Trade History
 * URL : /api/spot/orderHistory/{{pairId}}
 * METHOD : GET
 * Query : page, limit
 */
export const getOrderHistory = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);

    let count = await SpotTrade.countDocuments({
      userId: req.user.id,
      pairId: req.params.pairId,
      status: {
        $in: ["pending", "completed", "cancel", "wait", "idle"],
      },
    });

    let data = await SpotTrade.aggregate([
      {
        $match: {
          userId: ObjectId(req.user.id),
          pairId: ObjectId(req.params.pairId),
          status: {
            $in: ["pending", "completed", "cancel", "wait", "idle"],
          },
        },
      },
      { $sort: { _id: -1 } },
      { $skip: pagination.skip },
      { $limit: pagination.limit },
      {
        $project: {
          // "orderDate": {
          //     "$dateToString": {
          //         "date": '$orderDate',
          //         "format": "%Y-%m-%d %H:%M"
          //     }
          // },
          orderDate: 1,
          firstCurrency: 1,
          secondCurrency: 1,
          orderType: 1,
          buyorsell: 1,
          averagePrice: {
            $reduce: {
              input: "$filled",
              initialValue: 0,
              in: {
                $avg: {
                  $add: [
                    "$$value",
                    { $multiply: ["$$this.price", "$$this.filledQuantity"] },
                  ],
                },
              },
            },
          },
          filledCount: { $size: "$filled" },
          price: 1,
          filledQuantity: 1,
          quantity: 1,
          orderValue: 1,
          conditionalType: 1,
          status: 1,
          stopPrice: 1,
        },
      },
    ]);
    // console.log("dataaaaaaaaaa",data)
    let result = {
      count,
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
 * Get User Order History Socket
 * userId, pairId
 */
export const getOrderHistorySocket = async (userId, pairId) => {
  try {
    // console.log("dataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", userId, userId);
    let count = await SpotTrade.countDocuments({
      userId: ObjectId(userId),
      pairId: ObjectId(pairId),
      status: {
        $in: ["pending", "completed", "cancel", "wait", "idle"],
      },
    });

    let data = await SpotTrade.aggregate([
      {
        $match: {
          userId: ObjectId(userId),
          pairId: ObjectId(pairId),
          status: {
            $in: ["pending", "completed", "cancel", "wait", "idle"],
          },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 10 },
      {
        $project: {
          // "orderDate": {
          //     "$dateToString": {
          //         "date": '$orderDate',
          //         "format": "%Y-%m-%d %H:%M"
          //     }
          // },
          orderDate: 1,
          firstCurrency: 1,
          secondCurrency: 1,
          orderType: 1,
          buyorsell: 1,
          averagePrice: {
            $reduce: {
              input: "$filled",
              initialValue: 0,
              in: {
                $avg: {
                  $add: [
                    "$$value",
                    { $multiply: ["$$this.price", "$$this.filledQuantity"] },
                  ],
                },
              },
            },
          },
          filledCount: { $size: "$filled" },
          price: 1,
          filledQuantity: 1,
          quantity: 1,
          orderValue: 1,
          conditionalType: 1,
          status: 1,
        },
      },
    ]);

    let result = {
      pairId,
      count,
      currentPage: 1,
      nextPage: count > data.length,
      limit: 10,
      data,
    };

    // console.log("resultt...........", result);
    socketEmitOne("orderHistory", result, userId);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Get User Trade History
 * URL : /api/spot/tradeHistory/{{pairId}}
 * METHOD : GET
 * Query : page, limit
 */
export const getTradeHistory = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);

    let count = await SpotTrade.aggregate([
      {
        $match: {
          userId: ObjectId(req.user.id),
          pairId: ObjectId(req.params.pairId),
          status: {
            $in: ["pending", "completed", "cancel"],
          },
        },
      },
      { $unwind: "$filled" },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    let data = await SpotTrade.aggregate([
      {
        $match: {
          userId: ObjectId(req.user.id),
          pairId: ObjectId(req.params.pairId),
          status: {
            $in: ["pending", "completed", "cancel"],
          },
        },
      },
      { $unwind: "$filled" },
      { $sort: { createdAt: -1 } },
      { $skip: pagination.skip },
      { $limit: pagination.limit },

      {
        $project: {
          // "createdAt": {
          //     "$dateToString": {
          //         "date": '$filled.createdAt',
          //         "format": "%Y-%m-%d %H:%M"
          //     }
          // },
          createdAt: "$filled.createdAt",
          firstCurrency: 1,
          secondCurrency: 1,
          buyorsell: 1,
          price: "$filled.price",
          filledQuantity: "$filled.filledQuantity",
          Fees: "$filled.Fees",
          orderValue: "$filled.orderValue",
          OwnToken: "$filled.OwnToken"
        },
      },
    ]);

    let result = {
      count: count?.[0]?.count,
      currentPage: pagination.page,
      nextPage: count?.[0]?.count > data.length,
      limit: pagination.limit,
      data,
    };
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

/**
 * Get User Trade History Socket
 * URL : /api/spot/tradeHistory/{{pairId}}
 * METHOD : GET
 * Query : page, limit
 */
export const getTradeHistorySocket = async (userId, pairId) => {
  try {
    let count = await SpotTrade.aggregate([
      {
        $match: {
          userId: ObjectId(userId),
          pairId: ObjectId(pairId),
          status: {
            $in: ["pending", "completed", "cancel", "wait", "idle"],
          },
        },
      },
      { $unwind: "$filled" },
    ]);

    let data = await SpotTrade.aggregate([
      {
        $match: {
          userId: ObjectId(userId),
          pairId: ObjectId(pairId),
          status: {
            $in: ["pending", "completed", "cancel", "wait", "idle"],
          },
        },
      },
      { $unwind: "$filled" },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },

      {
        $project: {
          // "createdAt": {
          //     "$dateToString": {
          //         "date": '$filled.createdAt',
          //         "format": "%Y-%m-%d %H:%M"
          //     }
          // },
          createdAt: 1,
          firstCurrency: 1,
          secondCurrency: 1,
          buyorsell: 1,
          price: "$filled.price",
          filledQuantity: "$filled.filledQuantity",
          Fees: "$filled.Fees",
          orderValue: "$filled.orderValue",
          OwnToken: "$filled.OwnToken"
        },
      },
    ]);

    let result = {
      pairId,
      count: count.length,
      currentPage: 1,
      nextPage: count > data.length,
      limit: 10,
      data,
    };

    // console.log("trade  hisory...............", result);
    socketEmitOne("tradeHistory", result, userId);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Get market price
 * URL : /api/spot/marketPrice/{{pairId}}
 * METHOD : GET
 */
export const getMarketPrice = async (req, res) => {
  try {
    let tickerPrice = await marketPrice(req.params.pairId);
    if (tickerPrice.status) {
      return res
        .status(200)
        .json({ success: true, result: tickerPrice.result });
    }
    return res.status(409).json({ success: false });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

/**
 * Get market price socket
 * pairId
 */
export const marketPriceSocket = async (pairId) => {
  try {
    let tickerPrice = await marketPrice(pairId);
    if (tickerPrice.status) {
      socketEmitAll("marketPrice", {
        pairId,
        data: tickerPrice.result,
      });
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

export const marketPrice = async (pairId) => {
  try {
    let spotPairData = await SpotPair.findById(pairId);
    if (spotPairData) {
      if (spotPairData.botstatus == "off") {
        let ticker24hrs = await SpotTrade.aggregate([
          {
            $match: {
              pairId: ObjectId(pairId),
              buyorsell: "sell",
              status: { $in: ["pending", "completed"] },
            },
          },
          { $unwind: "$filled" },
          {
            $match: {
              "filled.createdAt": {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                $lte: new Date(),
              },
            },
          },
          {
            $sort: { "filled.createdAt": 1 },
          },
          {
            $group: {
              _id: null,
              open: { $first: "$filled.price" },
              close: { $last: "$filled.price" },
              high: { $max: "$filled.price" },
              low: { $min: "$filled.price" },
              firstVolume: { $sum: "$filled.filledQuantity" },
              secondVolume: { $sum: "$filled.orderValue" },
            },
          },
          {
            $project: {
              low: 1,
              high: 1,
              firstVolume: 1,
              secondVolume: 1,
              changePrice: {
                $subtract: [
                  { $cond: [{ $eq: ["$close", null] }, 0, "$close"] },
                  { $cond: [{ $eq: ["$open", null] }, 0, "$open"] },
                ],
              },
              changePercentage: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $subtract: [
                          { $cond: [{ $eq: ["$close", null] }, 0, "$close"] },
                          { $cond: [{ $eq: ["$open", null] }, 0, "$open"] },
                        ],
                      },
                      { $cond: [{ $eq: ["$open", null] }, 0, "$open"] },
                    ],
                  },
                  100,
                ],
              },
            },
          },
        ]);

        if (ticker24hrs.length > 0) {
          spotPairData.low = ticker24hrs[0].low;
          spotPairData.high = ticker24hrs[0].high;
          spotPairData.changePrice = ticker24hrs[0].changePrice;
          spotPairData.change = ticker24hrs[0].changePercentage;
          spotPairData.firstVolume = ticker24hrs[0].firstVolume;
          spotPairData.secondVolume = ticker24hrs[0].secondVolume;
        } else {
          spotPairData.low = 0;
          spotPairData.high = 0;
          spotPairData.changePrice = 0;
          spotPairData.change = 0;
          spotPairData.firstVolume = 0;
          spotPairData.secondVolume = 0;
        }

        let recentTrade = await SpotTrade.aggregate([
          {
            $match: {
              pairId: ObjectId(pairId),
              // buyorsell: "sell",
              status: { $in: ["pending", "completed"] },
            },
          },
          { $unwind: "$filled" },
          { $match: { "filled.isMaker": true } },
          {
            $sort: { "filled.createdAt": -1 },
          },
          { $limit: 1 },
          {
            $project: {
              price: "$filled.price",
            },
          },
        ]);

        if (recentTrade.length > 0) {
          spotPairData.last = recentTrade[0].price;
          spotPairData.markPrice = recentTrade[0].price;
        }

        let updateSpotPair = await spotPairData.save();
        let result = {
          last: updateSpotPair.last,
          markPrice: updateSpotPair.markPrice,
          low: updateSpotPair.low,
          high: updateSpotPair.high,
          firstVolume: updateSpotPair.firstVolume,
          secondVolume: updateSpotPair.secondVolume,
          changePrice: updateSpotPair.changePrice,
          change: updateSpotPair.change,
          botstatus: updateSpotPair.botstatus,
        };

        triggerStopLimitOrder(updateSpotPair);
        //  trailingStopOrder(updateSpotPair)
        return {
          status: true,
          result: result,
        };
      }
    }
    return {
      status: false,
    };
  } catch (err) {
    return {
      status: false,
    };
  }
};

/**
 * Trigger Stop Limit Order
 * price
 */
export const triggerStopLimitOrder = async (spotPairData) => {
  try {
    //      console.log("spotPairDataspotPairData",spotPairData)

    // if(spotPairData.botstatus=="wazirx")
    // {
    //  console.log("spotPairDataspotPairData",spotPairData)

    // }
    if (!isEmpty(spotPairData) && !isEmpty(spotPairData.markPrice)) {
      let takeProfitOrder = await SpotTrade.find({
        pairId: ObjectId(spotPairData._id),
        status: "conditional",
        orderType: "stop_limit",
        conditionalType: "greater_than",
        stopPrice: { $lte: spotPairData.markPrice },
      });
      // console.log("takeProfitOrdertakeProfitOrder", takeProfitOrder);
      if (takeProfitOrder && takeProfitOrder.length > 0) {
        for (let profitOrder of takeProfitOrder) {
          let newOrder = await SpotTrade.findOneAndUpdate(
            { _id: profitOrder._id },
            { status: "open" },
            { new: true }
          );
          getOpenOrderSocket(newOrder.userId, newOrder.pairId);
          getOrderBookSocket(newOrder.pairId);
          await tradeList(newOrder, spotPairData);
        }
      }

      let stopLossOrder = await SpotTrade.find({
        pairId: ObjectId(spotPairData._id),
        status: "conditional",
        orderType: "stop_limit",
        conditionalType: "lesser_than",
        stopPrice: { $gte: spotPairData.markPrice },
      });

      if (stopLossOrder && stopLossOrder.length > 0) {
        for (let lossOrder of stopLossOrder) {
          let newOrder = await SpotTrade.findOneAndUpdate(
            { _id: lossOrder._id },
            { status: "open" },
            { new: true }
          );
          getOpenOrderSocket(newOrder.userId, newOrder.pairId);
          getOrderBookSocket(newOrder.pairId);
          await tradeList(newOrder, spotPairData);
        }
      }
    }
  } catch (err) { }
};

/**
 * Get Recent Trade
 * URL : /api/spot/recentTrade/{{pairId}}
 * METHOD : GET
 */
export const getRecentTrade = async (req, res) => {
  try {
    let pairData = await SpotPair.findById(req.params.pairId,
      {
        firstCurrencySymbol: 1,
        secondCurrencySymbol: 1,
        botstatus: 1,
      }
    ).lean();
    if (!pairData) {
      return res.status(400).json({ success: false });
    }

    if (pairData.botstatus == "binance") {
      let recentTradeData = await binanceCtrl.recentTrade({
        firstCurrencySymbol: pairData.firstCurrencySymbol,
        secondCurrencySymbol: pairData.secondCurrencySymbol,
      });
      if (recentTradeData && recentTradeData.length > 0) {
        return res.status(200).json({ success: true, result: recentTradeData });
      }
    } else if (pairData.botstatus == "wazirx") {
      let recentTradeData = await wazaticxrecentTrade({
        firstCurrencySymbol: pairData.firstCurrencySymbol,
        secondCurrencySymbol: pairData.secondCurrencySymbol,
      });
      if (recentTradeData && recentTradeData.length > 0) {
        return res.status(200).json({ success: true, result: recentTradeData });
      }
    } else {
      let recentTradeData = await recentTrade(req.params.pairId);
      if (recentTradeData.status) {
        return res
          .status(200)
          .json({ success: true, result: recentTradeData.result });
      }
    }

    return res.status(409).json({ success: false });
  } catch (err) {
    console.log("aaaaaaaaaaaaaaaaaaaaaaaaa", err);
    return res.status(500).json({ success: false });
  }
};

/**
 * Get Recent Trade Socket
 * pairId
 */
export const recentTradeSocket = async (pairId) => {
  try {
    let recentTradeData = await recentTrade(pairId);
    if (recentTradeData.status) {
      socketEmitAll("recentTrade", {
        pairId,
        data: recentTradeData.result,
      });
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

export const recentTrade = async (pairId) => {
  try {
    let recentTrade = await SpotTrade.aggregate([
      {
        $match: {
          pairId: ObjectId(pairId),
          status: { $in: ["pending", "completed"] },
        },
      },
      { $unwind: "$filled" },
      { $sort: { "filled.createdAt": -1 } },
      { $limit: 20 },
      {
        $group: {
          _id: {
            buyUserId: "$filled.buyUserId",
            sellUserId: "$filled.sellUserId",
            sellOrderId: "$filled.sellOrderId",
            buyOrderId: "$filled.buyOrderId",
          },
          createdAt: { $first: "$filled.createdAt" },
          Type: { $first: "$filled.Type" },
          price: { $first: "$filled.price" },
          filledQuantity: { $first: "$filled.filledQuantity" },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    if (recentTrade.length > 0) {
      return {
        status: true,
        result: recentTrade,
      };
    }
    return {
      status: true,
      result: [],
    };
  } catch (err) {
    return {
      status: true,
      result: [],
    };
  }
};



export const wazrixNewMarketfunction = async (payloadObj = {}) => {
  try {
    // alert('ddddddddd')
    const api = config.WAZIRIX.API;
    const secret = config.WAZIRIX.SECRET;
    const serverTime = await axios.get("https://api.wazirx.com/sapi/v1/time");
    const timeStamp = serverTime.data.serverTime;
    // const timeStamp=Math.floor((new Date()).getTime() / 1000);
    // const checkWazirxBalance = await checkBalance({
    //   firstCurrencySymbol: payloadObj.firstCurrencySymbol,
    //   secondCurrencySymbol: payloadObj.secondCurrencySymbol,
    //   buyorsell: payloadObj.side,
    //   price: payloadObj.price,
    //   quantity: payloadObj.quantity,
    //   serverTime: timeStamp,
    // });
    // console.log('checkWazirxBalance',checkWazirxBalance)
    // if (!checkWazirxBalance.status) {
    //   return {
    //     status: false,
    //     message: checkWazirxBalance.message,
    //   };
    // }

    var sendPrice = 0;
    var payload = {};
    // let calculate_Markup_price = 0;
    let newOrderPayloadObj = payloadObj;


    // if (payloadObj.type == "stop_limit") {
    //   calculate_Markup_price = payloadObj.stopPrice;
    // }
    // if (payloadObj.type == "limit") {
    //   console.log("payloadObjpayloadObj",payloadObj.price);
    //   calculate_Markup_price = payloadObj.price;
    // }

    // console.log("calculate_Markup_price.....",calculate_Markup_price)
    if (payloadObj.side == "buy") {
      sendPrice = calculateMarkup(
        payloadObj.price,
        payloadObj.markupPercentage,
        "-"
      );
    } else if (payloadObj.side == "sell") {
      sendPrice = calculateMarkup(
        payloadObj.price,
        payloadObj.markupPercentage,
        "+"
      );
    }

    // if (payloadObj.type == "limit") {
    //   console.log("limit enterrrr ..........");
    //   payload = {
    //     symbol: payloadObj.symbol,
    //     side: payloadObj.side,
    //     type: payloadObj.type,
    //     quantity: payloadObj.quantity,
    //     price: sendPrice,
    //     timestamp: timeStamp,
    //     recvWindow: 50000,
    //   };
    // }

    if (payloadObj.type == "marketOrder") {

      payload = {
        symbol: payloadObj.symbol,
        side: payloadObj.side,
        type: "limit",
        quantity: payloadObj.quantity,
        price: payloadObj.price,
        timestamp: timeStamp,
        recvWindow: 50000,
      };
    }

    // if (payloadObj.type == "stop_limit") {
    //   console.log("stop  limit enterrrr ..........");

    //   payload = {
    //     symbol: payloadObj.symbol,
    //     side: payloadObj.side,
    //     type: payloadObj.type,
    //     quantity: payloadObj.quantity,
    //     price: sendPrice,
    //     stopPrice: payloadObj.stopPrice, //stop price
    //     timestamp: timeStamp,
    //     recvWindow: 50000,
    //   };
    // }

    // var payload = {
    //   symbol: "ltcbtc",
    //   side: "buy",
    //   type: "limit",
    //   quantity: 10,
    //   price: 500,
    //   recvWindow: 50000,
    //   timestamp: timeStamp,
    // };

    var queryString = qs.stringify(payload);
    let signature = crypto
      .createHmac("sha256", secret)
      .update(queryString)
      .digest("hex");


    return await orderPlacingwrx1(payload, signature, timeStamp, api, newOrderPayloadObj); // orderPlacingwrx ==order placing Wazirix
  } catch (err) {
    console.log("...wazirix orderpalce err  errr", err);
  }
};

const orderPlacingwrx1 = async (
  payloadObj,
  signature,
  timeStamp,
  api,
  newOrderPayloadObj
) => {
  try {
    console.log("mepauload obje .........", payloadObj);
    let sendPayload = {};

    if (payloadObj.type == "limit") {
      sendPayload = {
        ...payloadObj,
        ...{ timestamp: timeStamp, signature: signature },
      };
    }
    if (payloadObj.type == "stop_limit") {
      sendPayload = {
        ...payloadObj,
        ...{
          stopPrice: newOrderPayloadObj.stopPrice,
          timestamp: timeStamp,
          signature: signature,
        },
      };
    }


    // var payload = {
    //   symbol: "ltcbtc",
    //   side: "buy",
    //   type: "limit",
    //   quantity: 10,
    //   price: 500,
    //   recvWindow: 50000,
    //   timestamp: timeStamp,
    //   signature: signature,
    // };

    //   console.log("sendpayloaddddddddddddd", qs.stringify(sendPayload));
    //   const resData = await axios({
    //     method: "post",
    //     url: "https://api.wazirx.com/sapi/v1/order/ ",
    //     data: qs.stringify(sendPayload),
    //     headers: {
    //       "content-type": "application/x-www-form-urlencoded;charset=utf-8",
    //       "X-Api-Key": api,
    //     },
    //   });
    //   console.log("limit response........",  Object.keys(resData.data));

    //   return {
    //     status: true,
    //     data: resData.data,
    //   };
    // } catch {
    //   return {
    //     status: false,
    //     message: "Something went wrong, please try again later.",
    //   };
    // }
    // const resData={
    //   data:{
    //     "id": 28,
    //     "symbol": "wrxinr",
    //     "price": "9293.0",
    //     "origQty": "10.0",
    //     "executedQty": "8.2",
    //     "status": "wait",
    //     "type": "limit",
    //     "side": "sell",
    //     "createdTime": 1499827319559,
    //     "updatedTime": 1499827319559
    //   }
    // }
    //   console.log("limit response........", Object.keys(resData.data));

    //   console.log("newOrderPayloadObjnewOrderPayloadObj", newOrderPayloadObj);
    //   if (Object.keys(resData && resData.data).length > 0) {
    //     console.log("enter after response", resData.data);
    //     let tradeUpdateObj = {};
    //     console.log("orderiddddddddddd", typeof resData.data.id, resData.data.id);
    //     tradeUpdateObj["status"] = resData.data.status;
    //     tradeUpdateObj["createdAt"] = new Date();
    //     tradeUpdateObj["wazirixOrderId"] = resData.data.id;
    //     tradeUpdateObj["botstatus"] = newOrderPayloadObj.botstatus;

    //     // let newOrderUpdate = await SpotTrade.findOneAndUpdate(
    //     //   {
    //     //     _id: newOrderPayloadObj.newOrder_id,
    //     //   },
    //     //   tradeUpdateObj,
    //     //   { new: true }
    //     // );
    //   }

    //   // console.log("new order .......placing upate", newOrderUpdate);
    // } catch (err) {
    //   console.log("...wazirix orderpalce err  errr", err);
    // }
    // };
    try {
      console.log("sendpayloaddddddddddddd", qs.stringify(sendPayload));
      const resData = await axios({
        method: "post",
        url: "https://api.wazirx.com/sapi/v1/order/ ",
        data: qs.stringify(sendPayload),
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=utf-8",
          "X-Api-Key": api,
        },
      });

      console.log("limit response........", Object.keys(resData.data));

      return {
        status: true,
        data: resData.data,
      };
    } catch (err) {
      console.log(err, "wazirxOrderPlace ----errr11");

      return {
        status: false,
        message: "Something went wrong, please try again later.",
      };
    }

    // console.log("new order .......placing upate", newOrderUpdate);
  } catch (err) {
    console.log(err, "wazirxOrderPlace ----errr");
    return {
      status: false,
      message: "Something went wrong, please try again later.",
    };
  }
};
/**
 * Calculate Without Service Fee
 */
export const withServiceFee = ({ price, serviceFee }) => {
  price = parseFloat(price);
  serviceFee = parseFloat(serviceFee);
  return price - price * (serviceFee / 100);
};

export const withoutServiceFee = ({ price, serviceFee }) => {
  price = parseFloat(price);
  return price;
};

/**
 * Calculate Service Fee
 */
export const calculateServiceFee = ({ price, serviceFee }) => {
  price = parseFloat(price);
  serviceFee = parseFloat(serviceFee);
  return price * (serviceFee / 100);
};

export const getownfees = async (req, res) => {
  try {
    let data = await FeesOwnToken.findOne(
      {},
      {
        status: 1,
        createdDate: 1,
        currencyId: 1,
        percentage: 1,
      }
    )
      .populate("currencyId")
      .sort({ _id: -1 });
    let result = {
      data,
    };

    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    res.status(500).json({ success: false, message: "error on server" });
  }
};
export const tokenfeeget = async (checked) => {
  if (checked == true) {
    var tokenfeedetails = await FeesOwnToken.findOne({});
    var tokenfee = tokenfeedetails.percentage;
  } else {
    var tokenfee = 0;
  }
  return tokenfee;
};

export const calculateMarkup = (price, percentage, type = "+") => {
  price = parseFloat(price);
  percentage = parseFloat(percentage);

  if (!isEmpty(price)) {
    if (type == "+") {
      return price + price * (percentage / 100);
    } else if (type == "-") {
      return price - price * (percentage / 100);
    }
  }
  return 0;
};

export const calculateMarkup1 = (price, percentage, type = "+") => {
  price = parseFloat(price);
  percentage = parseFloat(percentage);

  // console.log("priceeeeeeeeeeeeeeee", price);
  // console.log("priceeeeeeeeeeeeeeee", percentage);

  if (!isEmpty(price)) {
    if (type == "+") {
      return price + price * (percentage / 100);
    } else if (type == "-") {
      return price - price * (percentage / 100);
    }
  }
  return 0;
};
export const tokenFeecalculation = async ({
  orderData,
  fees,
  pairData,
  tradePrice,
  tradeQuantity,
  serviceFee,
  type,
  tableId,
}) => {

  try {
    let data = await FeesOwnToken.findOne(
      {},
      {
        status: 1,
        createdDate: 1,
        currencyId: 1,
        percentage: 1,
      }
    ).populate("currencyId");
    if (orderData.tokenfee > 0) {
      let assetdetails = await Assets.findOne({
        userId: orderData.userId,
        currencySymbol: data.currencyId.currencySymbol,
      });

      // if (orderData.buyorsell == "buy") {
      var PriceConversionget = await PriceConversion.findOne({
        baseSymbol:
          orderData.buyorsell == "buy"
            ? pairData.firstCurrencySymbol
            : pairData.secondCurrencySymbol,
        convertSymbol: "INR",
      });
      // }

      let per_crypto =
        PriceConversionget && PriceConversionget.convertPrice
          ? PriceConversionget.convertPrice
          : 0;
      if (per_crypto == 0 && orderData.buyorsell == "sell" && pairData.secondCurrencySymbol == "INR")
        per_crypto = 1


      // if (pairData.secondCurrencySymbol == "INR") {
      //   per_crypto = 1;
      // }


      let per_mudra = 1.71;
      // let mudra = per_crypto / per_mudra;
      // New Scenario
      let mudraNew = fees * per_crypto;

      let mudra_Fee = mudraNew * per_mudra;

      let final_Fee = mudra_Fee - (mudra_Fee * (orderData.tokenfee / 100));

      let low_balance = false;
      if (final_Fee > assetdetails.spotwallet) {
        low_balance = true;
      }
      if (low_balance == true) {
        await assetUpdate({
          currencyId:
            orderData.buyorsell == "sell"
              ? orderData.secondCurrencyId
              : orderData.firstCurrencyId,
          userId: orderData.userId,
          // balance: final_Fee,
          balance: withServiceFee({
            price:
              orderData.buyorsell == "sell"
                ? tradePrice * tradeQuantity
                : tradeQuantity,
            serviceFee,
          }),
          type: type,
          tableId: tableId,
        });

        return { fees: fees, own_token: "No" };
      }
      else if (low_balance == false) {
        await assetUpdate({
          currencyId:
            orderData.buyorsell == "sell"
              ? orderData.secondCurrencyId
              : orderData.firstCurrencyId,
          userId: orderData.userId,
          // balance: final_Fee,

          balance: withoutServiceFee({
            price:
              orderData.buyorsell == "sell"
                ? tradePrice * tradeQuantity
                : tradeQuantity,
            serviceFee,
          }),
          type: type,
          tableId: tableId,
        });


        await assetUpdate({
          currencyId: assetdetails.currency,
          userId: orderData.userId,
          balance: -final_Fee,
          type: type + "_own_token",
          tableId: tableId,
          category: "debit",
        });

        return { fees: final_Fee, own_token: "MUDRA" };
      }
    } else if (orderData.tokenfee == 0) {
      await assetUpdate({
        currencyId:
          orderData.buyorsell == "sell"
            ? orderData.secondCurrencyId
            : orderData.firstCurrencyId,
        userId: orderData.userId,
        // balance: final_Fee,

        balance: withServiceFee({
          price:
            orderData.buyorsell == "sell"
              ? tradePrice * tradeQuantity
              : tradeQuantity,
          serviceFee,
        }),
        type: type,
        tableId: tableId,
      });

      return { fees: fees, own_token: "No" };
    }
  } catch (err) {
    console.log(err, "token cal error");
  }
};
// accountInfo()
/**
 * Balance Info
 * BODY : currencySymbol
 */
export const balanceInfo = async ({ currencySymbol, serverTime }) => {
  try {
    let info = await accountInfo(serverTime);
    // console.log(info,'--info')
    if (!info.status) {
      return {
        status: false,
        message: "Something went wrong, please try again later.",
      };
    }

    let currencyBalance = info.data.find((el) => el.asset == currencySymbol);
    // console.log(currencyBalance,'---currencyBalance')
    if (!currencyBalance) {
      return {
        status: false,
        message: "INVALID_CURRENCY",
      };
    }

    return {
      status: true,
      data: currencyBalance,
    };
  } catch (err) {
    console.log(err, "---err");
    return {
      status: false,
      message: "Something went wrong, please try again later.",
    };
  }
};
// balanceInfo({ currencySymbol: "inr" })
// balanceInfo({ currencySymbol: "BNB" })
/**
 * Check Currency Balance
 * BODY : firstCurrency, secondCurrency, buyorsell, price, quantity
 */
export const checkBalance = async ({
  firstCurrencySymbol,
  secondCurrencySymbol,
  buyorsell,
  price,
  quantity,
  serverTime,
}) => {
  try {
    let currencySymbol, orderValue;
    price = parseFloat(price);
    quantity = parseFloat(quantity);

    if (buyorsell == "buy") {
      currencySymbol = secondCurrencySymbol;
      orderValue = price * quantity;
    } else if (buyorsell == "sell") {
      currencySymbol = firstCurrencySymbol;
      orderValue = quantity;
    }


    let balanceData = await balanceInfo({
      currencySymbol: currencySymbol.toLowerCase(),
      serverTime: serverTime,
    });

    if (!balanceData.status) {
      return {
        status: false,
        message: balanceData.message,
      };
    }

    if (parseFloat(balanceData.data.free) >= orderValue) {
      return {
        status: true,
      };
    } else {
      return {
        status: false,
        message: "INSUFFICIENT_BALANCE",
      };
    }
  } catch (err) {
    console.log(err, "---err");
    return {
      status: false,
      message: "Something went wrong, please try again later.",
    };
  }
};
/**
 * Account Info
 */
export const accountInfo = async (serverTime) => {
  const timeStamp = serverTime;
  let payload = {
    recvWindow: 20000,
    timestamp: timeStamp,
  };

  let signature = createSignature(payload);

  try {
    let resData = await axios({
      url: `${config.WAZIRIX.API_URL}/sapi/v1/funds`,
      method: "get",
      params: {
        recvWindow: 20000,
        timestamp: timeStamp,
        signature: signature,
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=utf-8",
        "X-Api-Key": config.WAZIRIX.API,
      },
    });
    // console.log(resData,'---resData')
    return {
      status: true,
      data: resData.data,
    };
  } catch (err) {
    console.log(err, "---accountInfoaccountInfoaccountInfoerrr");
    return {
      status: false,
      message: "Something went wrong, please try again later.",
    };
  }
};
export const createSignature = (payload) => {
  try {
    const signature = crypto
      .createHmac("sha256", config.WAZIRIX.SECRET)
      .update(qs.stringify(payload))
      .digest("hex");

    return signature;
  } catch (err) {
    console.log(
      "createSignaturecreateSignaturecreateSignaturecreateSignature",
      err
    );
    return "";
  }
};


export const testSpot = (payload) => {
  try {


    return signature;
  } catch (err) {
    console.log("testSpot", err);
    return "";
  }
};