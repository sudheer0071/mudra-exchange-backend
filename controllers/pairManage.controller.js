// import package

// import model
import {
  Currency,
  SpotPair,
  SpotTrade,
  AdminLog,
  P2PSpotpairs,
} from "../models";

import { paginationQuery, filterSearchQuery } from "../lib/adminHelpers";

// import controller
import * as binanceCtrl from "./binance.controller";
import * as symbolDatabase from "./chart/symbols_database";
const pm2 = require('pm2')
/**
 * Add Spot Trade Pair
 * METHOD : POST
 * URL : /adminapi/spotPair
 * BODY : firstCurrencyId, firstFloatDigit, secondCurrencyId, secondFloatDigit, minPricePercentage, maxPricePercentage, maxQuantity, minQuantity, maker_rebate, taker_fees, markupPercentage, botstatus
 */
export const addSpotPair = async (req, res) => {
  try {
    let reqBody = req.body;

    let firstCurrencyData = await Currency.findOne({
      _id: reqBody.firstCurrencyId,
    });
    if (!firstCurrencyData) {
      return res.status(400).json({
        success: false,
        errors: { firstCurrencyId: "Invalid currency" },
      });
    }

    let secondCurrencyData = await Currency.findOne({
      _id: reqBody.secondCurrencyId,
    });
    if (!secondCurrencyData) {
      return res.status(400).json({
        success: false,
        errors: { secondCurrencyId: "Invalid currency" },
      });
    }
    let newDoc = new SpotPair({
      firstCurrencyId: reqBody.firstCurrencyId,
      firstCurrencySymbol: firstCurrencyData.currencySymbol,
      firstFloatDigit: reqBody.firstFloatDigit,
      secondCurrencyId: reqBody.secondCurrencyId,
      secondCurrencySymbol: secondCurrencyData.currencySymbol,
      secondFloatDigit: reqBody.secondFloatDigit,
      minPricePercentage: reqBody.minPricePercentage,
      maxPricePercentage: reqBody.maxPricePercentage,
      minQuantity: reqBody.minQuantity,
      maxQuantity: reqBody.maxQuantity,
      maker_rebate: reqBody.maker_rebate,
      markPrice: reqBody.markPrice,
      taker_fees: reqBody.taker_fees,
      markupPercentage: reqBody.markupPercentage,
      botstatus: reqBody.botstatus,
    });
    let checkSpotPair = await SpotPair.findOne({
      firstCurrencyId: reqBody.firstCurrencyId,
      secondCurrencyId: reqBody.secondCurrencyId,
    });
    if (checkSpotPair) {
      return res.status(400).json({
        success: false,
        errors: { firstCurrencyId: "Currency pair is already exists" },
      });
    }

    var addedDoc = await newDoc.save();

    symbolDatabase.initialChartSymbol();
    if (addedDoc.botstatus == "binance") {
      binanceCtrl.getSpotPair();
      binanceCtrl.spotOrderBookWS();
      binanceCtrl.spotTickerPriceWS();
    }
    // pm2.list((err, list) => {
    //   console.log(err, list)

    //   pm2.restart('server', (err, proc) => {
    //     // Disconnects from PM2
    //     //   pm2.disconnect()
    //     console.log("errrrrrrrrr", err, "procproc", proc)

    //   })
    // })
    return res
      .status(200)
      .json({ message: "Pair added successfully. Refreshing data..." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Add Spot Trade Pair
 * METHOD : POST
 * URL : /adminapi/spotPair
 * BODY : pairId, firstCurrencyId, firstFloatDigit, secondCurrencyId, secondFloatDigit, minPricePercentage, maxPricePercentage, maxQuantity, minQuantity, maker_rebate, taker_fees, markupPercentage, botstatus
 */
export const editSpotPair = async (req, res) => {
  try {
    let reqBody = req.body;

    let firstCurrencyData = await Currency.findOne({
      _id: reqBody.firstCurrencyId,
    });
    if (!firstCurrencyData) {
      return res.status(400).json({
        success: false,
        errors: { firstCurrencyId: "Invalid currency" },
      });
    }

    let secondCurrencyData = await Currency.findOne({
      _id: reqBody.secondCurrencyId,
    });
    if (!secondCurrencyData) {
      return res.status(400).json({
        success: false,
        errors: { secondCurrencyId: "Invalid currency" },
      });
    }

    let checkSpotPair = await SpotPair.findOne({
      firstCurrencyId: reqBody.firstCurrencyId,
      secondCurrencyId: reqBody.secondCurrencyId,
      _id: { $ne: reqBody.pairId },
    });
    if (checkSpotPair) {
      return res.status(400).json({
        success: false,
        errors: { firstCurrencyId: "Currency pair is already exists" },
      });
    }

    var updateDoc = await SpotPair.findByIdAndUpdate(
      reqBody.pairId,
      {
        $set: {
          firstCurrencyId: reqBody.firstCurrencyId,
          firstCurrencySymbol: firstCurrencyData.currencySymbol,
          firstFloatDigit: reqBody.firstFloatDigit,
          secondCurrencyId: reqBody.secondCurrencyId,
          secondCurrencySymbol: secondCurrencyData.currencySymbol,
          secondFloatDigit: reqBody.secondFloatDigit,
          minPricePercentage: reqBody.minPricePercentage,
          maxPricePercentage: reqBody.maxPricePercentage,
          minQuantity: reqBody.minQuantity,
          maxQuantity: reqBody.maxQuantity,
          maker_rebate: reqBody.maker_rebate,
          taker_fees: reqBody.taker_fees,
          markPrice: reqBody.markPrice,
          markupPercentage: reqBody.markupPercentage,
          botstatus: reqBody.botstatus,
          status: reqBody.status,
        },
      }
    );
    let Logsss = await AdminLog.create({ userId: req.user.id, before: reqBody, after: updateDoc, table: "spot pair update" })

    // symbolDatabase.initialChartSymbol();
    if (global.binanceTradeWs) await binanceTradeWs({ keepClosed: false });
    await binanceCtrl.getSpotPair();

    // binance order book socket disconnect & reset
    if (global.binanceOrderBookWs)
      await binanceOrderBookWs({ keepClosed: false });
    await binanceCtrl.spotOrderBookWS();

    // binance market price socket disconnect & reset
    if (global.binanceTickerPriceWs)
      await binanceTickerPriceWs({ keepClosed: false });
    await binanceCtrl.spotTickerPriceWS();

    //server restart for wazarix socket
    pm2.list((err, list) => {
      console.log(err, list)

      pm2.restart("all", (err, proc) => {
        // Disconnects from PM2
        //   pm2.disconnect()
        console.log("errrrrrrrrr", err, "procproc", proc)

      })
    })
    return res
      .status(200)
      .json({ message: "Pair updated successfully. Refreshing data..." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Get Spot Trade Pair
 * METHOD : GET
 */
export const spotPairList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, [
      "firstCurrencySymbol",
      "secondCurrencySymbol",
      "botstatus",
      "status",
    ]);

    let count = await SpotPair.countDocuments(filter);
    let data = await SpotPair.find(filter, {
      firstCurrencyId: 1,
      firstCurrencySymbol: 1,
      firstFloatDigit: 1,
      secondCurrencyId: 1,
      secondCurrencySymbol: 1,
      secondFloatDigit: 1,
      minPricePercentage: 1,
      maxPricePercentage: 1,
      minQuantity: 1,
      maxQuantity: 1,
      maker_rebate: 1,
      taker_fees: 1,
      markPrice: 1,
      markupPercentage: 1,
      botstatus: 1,
      status: 1,
    })
      .skip(pagination.skip)
      .limit(pagination.limit);

    let result = {
      count,
      data,
    };
    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

/**
 * Get Spot Trade Pair
 * METHOD : GET
 */
export const spotPairListFees = async (req, res) => {
  try {
    // let pagination = paginationQuery(req.query);
    // let filter = filterSearchQuery(req.query, [
    //   "firstCurrencySymbol",
    //   "secondCurrencySymbol",
    //   "botstatus",
    //   "status",
    // ]);

    let count = await SpotPair.countDocuments();
    let data = await SpotPair.find({})
    // .skip(pagination.skip)
    // .limit(pagination.limit);

    let result = {
      count,
      data,
    };
    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};
export const addP2PPair = async (req, res) => {
  try {
    let reqBody = req.body;

    let firstCurrencyData = await Currency.findOne({
      currencySymbol: reqBody.firstCurrency,
    });
    if (!firstCurrencyData) {
      return res.status(400).json({
        success: false,
        errors: { firstCurrency: "Invalid currency" },
      });
    }

    let secondCurrencyData = await Currency.findOne({
      currencySymbol: reqBody.secondCurrency,
    });
    if (!secondCurrencyData) {
      return res.status(400).json({
        success: false,
        errors: { secondCurrency: "Invalid currency" },
      });
    }

    let checkSpotPair = await P2PSpotpairs.findOne({
      first_currency: reqBody.firstCurrency,
      second_currency: reqBody.secondCurrency,
    });
    if (checkSpotPair) {
      return res.status(400).json({
        success: false,
        errors: { firstCurrency: "Pair is already exists" },
      });
    }

    let newDoc = new P2PSpotpairs({
      first_currency: reqBody.firstCurrency,

      second_currency: reqBody.secondCurrency,
      mark_price: reqBody.markPrice,
      index_price: reqBody.markPrice,
      transactionfee: reqBody.transactionfee,
      tiker_root: reqBody.firstCurrency + reqBody.secondCurrency,
    });
    console.log("newdoc---", newDoc);
    await newDoc.save();

    return res
      .status(200)
      .json({ message: "P2P Pair added successfully." });
  } catch (err) {
    console.log("Error---", err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

export const editP2PPair = async (req, res) => {
  try {
    let reqBody = req.body;

    let firstCurrencyData = await Currency.findOne({
      currencySymbol: reqBody.firstCurrency,
    });
    if (!firstCurrencyData) {
      return res.status(400).json({
        success: false,
        errors: { firstCurrency: "Invalid currency" },
      });
    }

    let secondCurrencyData = await Currency.findOne({
      currencySymbol: reqBody.secondCurrency,
    });
    if (!secondCurrencyData) {
      return res.status(400).json({
        success: false,
        errors: { secondCurrency: "Invalid currency" },
      });
    }

    let checkSpotPair = await P2PSpotpairs.findOne({
      first_currency: reqBody.firstCurrency,
      second_currency: reqBody.secondCurrency,
      _id: { $ne: reqBody.pairId },
    });
    if (checkSpotPair) {
      return res.status(400).json({
        success: false,
        errors: { firstCurrency: "Currency pair is already exists" },
      });
    }

    await P2PSpotpairs.updateOne(
      {
        _id: reqBody.pairId,
      },
      {
        $set: {
          first_currency: reqBody.firstCurrency,
          second_currency: reqBody.secondCurrency,
          transactionfee: reqBody.transactionfee,
          mark_price: reqBody.markPrice,
          index_price: reqBody.markPrice,
          tiker_root: reqBody.firstCurrency + reqBody.secondCurrency,
          status: reqBody.status,
        },
      }
    );

    return res
      .status(200)
      .json({ message: "Pair updated successfully. Refreshing data..." });
  } catch (err) {
    console.log("----err", err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

export const p2pPairList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, [
      "firstCurrencySymbol",
      "secondCurrencySymbol",
      "botstatus",
      "status",
    ]);

    let count = await P2PSpotpairs.countDocuments(filter);
    let data = await P2PSpotpairs.find(filter, {
      transactionfee: 1,
      first_currency: 1,
      second_currency: 1,
      index_price: 1,
      mark_price: 1,
      tiker_root: 1,
      status: 1,
    })
      .skip(pagination.skip)
      .limit(pagination.limit);

    let result = {
      count,
      data,
    };

    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    console.log("Admin Pair Error---", err);

    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};
export const p2pPairListFees = async (req, res) => {
  try {
    // let pagination = paginationQuery(req.query);
    // let filter = filterSearchQuery(req.query, [
    //   "firstCurrencySymbol",
    //   "secondCurrencySymbol",
    //   "botstatus",
    //   "status",
    // ]);

    let count = await P2PSpotpairs.countDocuments();
    let data = await P2PSpotpairs.find({})


    let result = {
      count,
      data,
    };

    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    console.log("Admin Pair Error---", err);

    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};