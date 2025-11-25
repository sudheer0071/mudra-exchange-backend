// import model
import { SpotPair, SpotTrade, TradeBot, User } from "../models";

// import controller
import { createUserKyc } from "./userKyc.controller";
import { createUserAsset } from "./assets.controller";
import { defaultUserSetting } from "./user.controller";
import * as spotTradeCtrl from "./spotTrade.controller";

// import lib
import isEmpty from "../lib/isEmpty";
import * as random from "../lib/randomBytes";
import { IncCntObjId } from "../lib/generalFun";

/**
 * Add Trade Bot For Open Order
 * URL : /adminapi/orderBot/open
 * METHOD : POST
 * BODY : pairId, side, startPrice, endPrice, startQuantity, endQuantity, count
 */
export const openOrderBot = async (req, res) => {
  try {
    let reqBody = req.body;
    reqBody.startQuantity = parseFloat(reqBody.startQuantity);
    reqBody.endQuantity = parseFloat(reqBody.endQuantity);
    reqBody.startPrice = parseFloat(reqBody.startPrice);
    reqBody.endPrice = parseFloat(reqBody.endPrice);
    reqBody.count = parseFloat(reqBody.count);

    let pairData = await SpotPair.findOne({ _id: reqBody.pairId });

    if (!pairData) {
      return res
        .status(400)
        .json({ status: false, errors: { pairId: "Invalid Pair" } });
    }

    if (reqBody.startQuantity < pairData.minQuantity) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            startQuantity:
              "Quantity of contract must not be lesser than " +
              pairData.minQuantity,
          },
        });
    } else if (reqBody.endQuantity < pairData.maxQuantity) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            endQuantity:
              "Quantity of contract must not be lesser than " +
              pairData.maxQuantity,
          },
        });
    }

    let minPrice =
      pairData.markPrice -
      pairData.markPrice * (pairData.minPricePercentage / 100),
      maxPrice =
        pairData.markPrice +
        pairData.markPrice * (pairData.maxPricePercentage / 100);

    if (reqBody.startPrice < minPrice) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            startPrice: "Price of contract must not be lesser than " + minPrice,
          },
        });
    } else if (reqBody.endPrice < maxPrice) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            endPrice: "Price of contract must not be lesser than " + maxPrice,
          },
        });
    }

    if (reqBody.side == "buy" && reqBody.startPrice >= pairData.markPrice) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            startPrice:
              "Price of contract must not be higher than or equal market price",
          },
        });
    } else if (
      reqBody.side == "sell" &&
      reqBody.startPrice <= pairData.markPrice
    ) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            startPrice:
              "Price of contract must not be lesser than or equal market price",
          },
        });
    }

    placeBotOrder(pairData, reqBody, 0, reqBody.count);
    return res
      .status(200)
      .json({ success: false, message: "Order placed successfully" });
  } catch (err) { }
};

/**
 * Place Bot Order
 * startPrice, endPrice, startQuantity, endQuantity, side
 */
export const placeBotOrder = async (
  pairData,
  reqBody,
  startCnt = 0,
  endCnt = 0
) => {
  try {

    if (isEmpty(pairData)) {
      return true;
    } else if (startCnt >= endCnt) {
      return true;
    }

    let price = random.range(reqBody.startPrice, reqBody.endPrice),
      quantity = random.range(reqBody.startQuantity, reqBody.endQuantity);

    const newSpotTrade = new SpotTrade({
      userId: reqBody.botUsrId,
      pairId: pairData._id,
      firstCurrencyId: pairData.firstCurrencyId,
      firstCurrency: pairData.firstCurrencySymbol,
      secondCurrencyId: pairData.secondCurrencyId,
      secondCurrency: pairData.secondCurrencySymbol,
      quantity: quantity,
      price: price,
      orderValue: price * quantity,
      pairName: `${pairData.firstCurrencySymbol}${pairData.secondCurrencySymbol}`,
      orderDate: new Date(),
      orderType: "limit",
      buyorsell: reqBody.side,
      calledBy: "bot",
      status: "open",
    });

    let newOrder = await newSpotTrade.save();

    return await placeBotOrder(pairData, reqBody, startCnt + 1, endCnt);
  } catch (err) {
    console.log("------err", err);
    return false;
  }
};

/**
 * TradeBot
 * URL : /adminapi/newBot
 * METHOD : POST
 * BODY : pairId, side, startPrice, endPrice, startQuantity, endQuantity, count
 */
export const newBot = async (req, res) => {
  try {
    let reqBody = req.body;

    reqBody.startQuantity = parseFloat(reqBody.startQuantity);
    reqBody.endQuantity = parseFloat(reqBody.endQuantity);
    reqBody.startPrice = parseFloat(reqBody.startPrice);
    reqBody.endPrice = parseFloat(reqBody.endPrice);
    reqBody.count = parseFloat(reqBody.count);

    let pairData = await SpotPair.findById(reqBody.pairId);
    if (!pairData) {
      return res
        .status(400)
        .json({ status: false, errors: { pairId: "Invalid Pair" } });
    }

    if (pairData.botstatus != "off") {
      return res
        .status(400)
        .json({ status: false, message: "Permission denied for this pair" });
    }

    if (reqBody.startQuantity < pairData.minQuantity) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            startQuantity:
              "Quantity of contract must not be lesser than " +
              pairData.minQuantity,
          },
        });
    } else if (reqBody.endQuantity > pairData.maxQuantity) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            endQuantity:
              "Quantity of contract must not be lesser than " +
              pairData.maxQuantity,
          },
        });
    }

    let minPrice =
      pairData.markPrice -
      pairData.markPrice * (pairData.minPricePercentage / 100),
      maxPrice =
        pairData.markPrice +
        pairData.markPrice * (pairData.maxPricePercentage / 100);

    if (reqBody.startPrice < minPrice) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            startPrice: "Price of contract must not be lesser than " + minPrice,
          },
        });
    } else if (reqBody.endPrice < maxPrice) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            endPrice: "Price of contract must not be lesser than " + maxPrice,
          },
        });
    }

    if (reqBody.side == "buy" && reqBody.startPrice >= pairData.markPrice) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            startPrice:
              "Price of contract must not be higher than or equal market price",
          },
        });
    } else if (
      reqBody.side == "sell" &&
      reqBody.startPrice <= pairData.markPrice
    ) {
      return res
        .status(400)
        .json({
          status: false,
          errors: {
            startPrice:
              "Price of contract must not be lesser than or equal market price",
          },
        });
    }
    let newDoc = new TradeBot({
      pairId: reqBody.pairId,
      side: reqBody.side,
      buyStartPrice: reqBody.buyStartPrice,
      buyEndPrice: reqBody.buyEndPrice,
      sellStartPrice: reqBody.sellStartPrice,
      sellEndPrice: reqBody.sellEndPrice,
      startQuantity: reqBody.startQuantity,
      endQuantity: reqBody.endQuantity,
      count: reqBody.count,
    });
    let botDoc = await TradeBot.findOne({ pairId: reqBody.pairId });
    if (botDoc) {
      return res
        .status(400)
        .json({ status: false, errors: { pairId: "Pair already exists" } });
    } else {
      await newDoc.save();
    }
    return res
      .status(200)
      .json({ status: true, message: "Order placed successfully" });
  } catch (err) {
    console.log("---------err", err);
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
};

/**
 * Trade Bot List
 * METHOD : GET
 * URL : /adminapi/botList
 */
export const botList = (req, res) => {
  TradeBot.aggregate(
    [
      {
        $lookup: {
          from: "spotpairs",
          localField: "pairId",
          foreignField: "_id",
          as: "pairInfo",
        },
      },
      { $unwind: "$pairInfo" },
      {
        $project: {
          firstCoin: "$pairInfo.firstCurrencySymbol",
          secondCoin: "$pairInfo.secondCurrencySymbol",
          createdAt: 1,
          side: 1,
          buyStartPrice: 1,
          buyEndPrice: 1,
          sellStartPrice: 1,
          sellEndPrice: 1,
          startQuantity: 1,
          endQuantity: 1,
          count: 1,
          status: 1,
        },
      },
    ],
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ status: false, message: "Something went wrong" });
      }
      return res
        .status(200)
        .json({ status: true, message: "FETCH_SUCCESS", result: data });
    }
  );
};

/**
 * Remove Trade Bot
 * METHOD : GET
 * URL : /adminapi/removeBot
 */
export const removeBot = (req, res) => {
  TradeBot.remove({ _id: req.params.id }, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ status: false, message: "Something went wrong" });
    }
    return res
      .status(200)
      .json({ status: true, message: "Bot record deleted successfully" });
  });
};

/**
 * Get Bot User
 * METHOD : GET
 * URL : /adminapi/botUser
 */
export const getBotUser = (req, res) => {
  User.findOne(
    {
      role: "trade_bot",
    },
    {
      firstName: 1,
      lastName: 1,
      email: 1,
    },
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ status: false, message: "Something went wrong" });
      }

      if (!data) {
        return res
          .status(400)
          .json({ status: false, message: "There is no record" });
      }

      return res
        .status(200)
        .json({ status: true, message: "FETCH_SUCCESS", result: data });
    }
  );
};

/**
 * Create Bot User
 * METHOD : POST
 * URL : /adminapi/botUser
 * BODY : name, email
 */
export const newBotUser = async (req, res) => {
  try {
    let reqBody = req.body;

    let checkDoc = await User.findOne({ role: "trade_bot" });
    if (checkDoc) {
      checkDoc.firstName = reqBody.firstName;
      checkDoc.lastName = reqBody.lastName;
      checkDoc.email = reqBody.email;

      await checkDoc.save();
      return res
        .status(200)
        .json({ status: true, message: "Updated successfully" });
    } else {
      let newUser = new User({
        firstName: reqBody.firstName,
        lastName: reqBody.lastName,
        email: reqBody.email,
        password: "1a2b3c4d",
        role: "trade_bot",
      });

      newUser.uniqueId = IncCntObjId(newUser._id);

      let newDoc = await newUser.save();
      createUserKyc(newDoc._id);
      createUserAsset(newDoc);
      defaultUserSetting(newDoc);
      return res
        .status(200)
        .json({ status: true, message: "Added successfully" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
};

/**
 * Check Trade Bot
 */
let tradeBot = false;
export const checkBot = async () => {
  try {
    if (tradeBot) {
      return false;
    }
    tradeBot = true;
    let botDoc = await TradeBot.find({});
    if (botDoc && botDoc.length > 0) {
      let botUsr = await User.findOne(
        { role: "trade_bot" },
        { firstName: 1, lastName: 1, email: 1 }
      );
      if (botUsr) {
        for (let item of botDoc) {

          let pairData = await SpotPair.findById(item.pairId);

          if (pairData) {

            if (item.side.includes("buy")) {
              if (item.buyStartPrice >= 0) {
                let buyDoc = {
                  startPrice: item.buyStartPrice,
                  endPrice: item.buyEndPrice,
                  startQuantity: item.startQuantity,
                  endQuantity: item.endQuantity,
                  side: "buy",
                  botUsrId: botUsr._id,
                };
                await placeBotOrder(pairData, buyDoc, 0, item.count);
              }

            }

            if (item.side.includes("sell")) {
              if (item.sellStartPrice >= 0) {
                let sellDoc = {
                  startPrice: item.sellStartPrice,
                  endPrice: item.sellEndPrice,
                  startQuantity: item.startQuantity,
                  endQuantity: item.endQuantity,
                  side: "sell",
                  botUsrId: botUsr._id,
                };
                await placeBotOrder(pairData, sellDoc, 0, item.count);
              }

            }
            await spotTradeCtrl.getOrderBookSocket(item.pairId);
          }
        }
      }
    }
    tradeBot = false;
  } catch (err) {
    console.log("-----err", err);
  }
};


/**
 * BOT ALL OPEN ORDERS CANCEL
 * METHOD : GET
 * URL : /adminapi/bot-order-cancel/{{botId}}
 * PARAMS : botId
 */

export const botAllOpenOrderCancel = async (req, res) => {
  try {
    let botUsr = await User.findOne({ 'role': "trade_bot" }, { 'firstName': 1, 'lastName': 1, 'email': 1 });

    if (!botUsr) {
      return res.status(400).json({ 'success': false, 'message': 'NO_TRADE_BOT_USER' })
    }

    let reqParam = req.params;

    if (isEmpty(reqParam.botId)) {
      return res.status(400).json({ 'success': false, 'message': 'Bot Id is required' })
    }

    let botDoc = await TradeBot.findOne({ '_id': reqParam.botId });

    if (isEmpty(botDoc)) {
      return res.status(400).json({ 'success': false, 'message': 'NO_DATA' })
    }

    let pairData = await SpotPair.findOne({ '_id': botDoc.pairId });

    if (isEmpty(pairData)) {
      return res.status(400).json({ 'success': false, 'message': 'NO_DATA' })
    }

    let findQuery = { 'userId': botUsr._id, 'pairId': pairData._id, 'status': { '$in': ['open', 'pending'] }, 'buyorsell': { '$in': botDoc.side } };
    let count = await SpotTrade.countDocuments(findQuery)

    if (count == 0) {
      return res.status(400).json({ 'success': false, 'message': 'There is no open orders' })
    }

    let updateData = await SpotTrade.updateMany(
      findQuery,
      { '$set': { 'status': 'cancel' } },
      { 'new': true }
    )

    if (updateData && updateData.nModified == 0) {
      return res.status(400).json({ 'success': false, 'message': 'UPDATE_NOT_SUCCESS' })
    }

    await spotTradeCtrl.getOrderBookSocket(pairData._id);

    return res.status(200).json({ 'success': true, 'message': 'All open order cancelled successfully' })

  } catch (err) {
    return res.status(500).json({ 'success': false, 'message': 'Error on server' })
  }
}