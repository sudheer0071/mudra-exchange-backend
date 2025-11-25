// import package
import mongoose from 'mongoose';

// import model
import {
    SpotPair,
    SpotTrade
} from '../../models'

// import controller
import { wazaticxrecentTrade } from "../wazarix.controller";
import * as binanceCtrl from "../binance.controller";
import { recentTrade } from '../spotTrade.controller'
// import lib
import isEmpty from '../../lib/isEmpty';

const ObjectId = mongoose.Types.ObjectId;

/** 
 * Get All Spot Order
 * URL : /api/v1/spot/allOrders
 * METHOD : GET
 * Query : symbol
*/
let orderBookArr = []
export const getAllOrder = async (req, res) => {
    try {
        let reqQuery = req.query;
        if (isEmpty(reqQuery.symbol)) {
            return res.status(400).json({ 'success': false, 'message': "Parameter 'symbol' was empty." })
        }

        let pairData = await SpotPair.findOne({ 'tikerRoot': reqQuery.symbol });
        if (!pairData) {
            return res.status(400).json({ 'success': false, 'message': 'INVALID_SYMBOL' })
        }


        let orderData = await SpotTrade.aggregate([
            {
                '$match': {
                    'userId': ObjectId(req.user.id),
                    'pairId': ObjectId(pairData._id),

                }
            },
            {
                "$project": {
                    'symbol': {
                        "$concat": ["$firstCurrency", "$secondCurrency"]
                    },
                    'orderId': "$_id",
                    'price': 1,
                    'quantity': 1,
                    'filledQuantity': 1,
                    'status': 1,
                    'orderType': 1,
                    'side': "$buyorsell"
                }
            }
        ])

        return res.status(200).json(orderData)
    } catch (err) {
        return res.status(400).json({ 'success': false, 'message': 'SOMETHING_WRONG' })
    }
}

/** 
 * Get Spot Order by order id
 * URL : /api/v1/spot/order
 * METHOD : GET
 * Query : symbol
*/
export const getOrder = async (req, res) => {
    try {
        let reqQuery = req.query;
        if (isEmpty(reqQuery.symbol)) {
            return res.status(400).json({ 'success': false, 'message': "Parameter 'symbol' was empty." })
        }

        if (isEmpty(reqQuery.orderId)) {
            return res.status(400).json({ 'success': false, 'message': "Parameter 'orderId' was empty." })
        }

        let pairData = await SpotPair.findOne({ 'tikerRoot': reqQuery.symbol });
        if (!pairData) {
            return res.status(400).json({ 'success': false, 'message': 'INVALID_SYMBOL' })
        }

        let orderData = await SpotTrade.aggregate([
            {
                '$match': {
                    'userId': ObjectId(req.user.id),
                    'pairId': ObjectId(pairData._id),
                }
            },
            {
                "$project": {
                    'symbol': {
                        "$concat": ["$firstCurrency", "$secondCurrency"]
                    },
                    'orderId': "$_id",
                    'price': 1,
                    'quantity': 1,
                    'filledQuantity': 1,
                    'status': 1,
                    'orderType': 1,
                    'side': "$buyorsell"
                }
            }
        ])

        return res.status(200).json(orderData && orderData.length > 0 ? orderData[0] : {})
    } catch (err) {
        return res.status(400).json({ 'success': false, 'message': 'SOMETHING_WRONG' })
    }
}

/** 
 * Get Spot Open Order by order id
 * URL : /api/v1/spot/order
 * METHOD : GET
 * Query : symbol
*/
export const getOpenOrders = async (req, res) => {
    try {
        let reqQuery = req.query;
        if (isEmpty(reqQuery.symbol)) {
            return res.status(400).json({ 'success': false, 'message': "Parameter 'symbol' was empty." })
        }

        let pairData = await SpotPair.findOne({ 'tikerRoot': reqQuery.symbol });
        if (!pairData) {
            return res.status(400).json({ 'success': false, 'message': 'INVALID_SYMBOL' })
        }

        let orderData = await SpotTrade.aggregate([
            {
                '$match': {
                    'userId': ObjectId(req.user.id),
                    'pairId': ObjectId(pairData._id),
                    'status': { "$in": ['open', 'pending'] }
                }
            },
            {
                "$project": {
                    'symbol': {
                        "$concat": ["$firstCurrency", "$secondCurrency"]
                    },
                    'orderId': "$_id",
                    'price': 1,
                    'quantity': 1,
                    'filledQuantity': 1,
                    'status': 1,
                    'orderType': 1,
                    'side': "$buyorsell"
                }
            }
        ])

        return res.status(200).json(orderData)
    } catch (err) {
        return res.status(400).json({ 'success': false, 'message': 'SOMETHING_WRONG' })
    }
}

/** 
 * Get Spot Trade History
 * URL : /api/v1/spot/tradeHistory
 * METHOD : GET
 * Query : symbol, limit
*/
export const getTradeHistory = async (req, res) => {
    try {
        let reqQuery = req.query;
        let limit = 500;
        if (isEmpty(reqQuery.symbol)) {
            return res.status(400).json({ 'success': false, 'message': "Parameter 'symbol' was empty." })
        }

        if (isEmpty(reqQuery.limit) || reqQuery.limit > 500) {
            limit = 500;
        } else {
            limit = parseInt(reqQuery.limit)
        }
        let pairData = await SpotPair.findOne({ 'tikerRoot': reqQuery.symbol });

        if (!pairData) {
            return res.status(400).json({ 'success': false, 'message': 'INVALID_SYMBOL' })
        }

        let orderData = await SpotTrade.aggregate([
            {
                '$match': {
                    'userId': ObjectId(req.user.id),
                    'pairId': ObjectId(pairData._id),
                    'status': { "$in": ['pending', 'completed', 'cancel'] }
                }
            },
            { "$unwind": "$filled" },
            {
                "$sort": { 'filled.createdAt': -1 }
            },
            { "$limit": limit },
            {
                "$project": {
                    'id': "$filled._id",
                    'price': "$filled.price",
                    'quantity': "$filled.filledQuantity",
                }
            }
        ])

        return res.status(200).json(orderData)
    } catch (err) {
        return res.status(400).json({ 'success': false, 'message': 'SOMETHING_WRONG' })
    }
}

/** 
 * Get Spot Ticker 24hrs
 * URL : /api/v1/spot/ticker/24hr
 * METHOD : GET
 * Query : symbol (or) symbols
*/
export const ticker24hr = async (req, res) => {
    try {
        const reqQuery = req.query;
        let findQuery = {}
        let spotPair = await SpotPair.aggregate([
            {
                "$project": {
                    '_id': 0,
                    'symbol': { "$concat": ["$firstCurrencySymbol", "$secondCurrencySymbol"] },
                    "highPrice": "$high",
                    "lowPrice": "$low",
                    "lastPrice": "$markPrice",
                    "firstVolume": "$firstVolume",
                    "secondVolume": "$secondVolume",
                    "priceChangePercent": "$changePrice",
                    "priceChange": "$change",
                }
            },
        ])
        return res.status(200).json(spotPair)
    } catch (err) {
        return res.status(400).json({ message: "Error occured" })
    }
}

/** 
 * Get Spot Ticker 24hrs
 * URL : /api/v1/spot/ticker/price
 * METHOD : GET
*/
export const tickerPrice = async (req, res) => {
    try {
        let spotPair = await SpotPair.aggregate([
            {
                "$project": {
                    '_id': 0,
                    'symbol': { "$concat": ["$firstCurrencySymbol", "$secondCurrencySymbol"] },
                    'price': "$markPrice"
                }
            },
        ])
        return res.status(200).json(spotPair)
    } catch (err) {
        return res.status(400).json({ message: "Error occured" })
    }
}
/** 
 * Get Spot Ticker 24hrs
 * URL : /api/v1/spot/pairs
 * METHOD : GET
 * Query : symbol (or) symbols
*/
export const getTradepairs = async (req, res) => {
    try {
        let spotPairData = await SpotPair.aggregate([
            {
                "$project": {
                    '_id': 0,
                    'ticker_root': { "$concat": ["$firstCurrencySymbol", "_", "$secondCurrencySymbol"] },
                    'base': '$firstCurrencySymbol',
                    'quote': '$secondCurrencySymbol',
                    'pair_id': '$_id'
                }
            },
        ])
        return res.status(200).json(spotPairData)
    } catch (err) {
        return res.status(500).json({ status: false, message: "Error occured" });
    }
};

export const getRecentTrade = async (req, res) => {
    try {
        let ticker = req.query.ticker_root
        if (!isEmpty(ticker)) {
            let base = ticker.split("_")[0]
            let quote = ticker.split("_")[1]
            let pairData = await SpotPair.findOne(
                {
                    firstCurrencySymbol: base,
                    secondCurrencySymbol: quote
                    // botstatus: "off"
                },
                {
                    firstCurrencySymbol: 1,
                    secondCurrencySymbol: 1,
                    botstatus: 1,
                }
            );
            if (!pairData) {
                return res.status(400).json({ success: false });
            }

            if (pairData.botstatus == "binance") {
                let recentTradeData = await binanceCtrl.recentTrade({
                    firstCurrencySymbol: pairData.firstCurrencySymbol,
                    secondCurrencySymbol: pairData.secondCurrencySymbol,
                });
                if (recentTradeData && recentTradeData.length > 0) {
                    return res.status(200).json(recentTradeData);
                }
            } else if (pairData.botstatus == "wazirx") {
                let recentTradeData = await wazaticxrecentTrade({
                    firstCurrencySymbol: pairData.firstCurrencySymbol,
                    secondCurrencySymbol: pairData.secondCurrencySymbol,
                });
                if (recentTradeData && recentTradeData.length > 0) {
                    return res.status(200).json(recentTradeData);
                }
            } else {
                let recentTradeData = await recentTrade(req.params.pairId);
                if (recentTradeData.status) {
                    return res
                        .status(200)
                        .json(recentTradeData.result);
                }
            }

            return res.status(409).json({ success: false });
        } else {
            return res.status(500).json({ success: false });
        }

    } catch (err) {
        return res.status(500).json({ success: false });
    }
};


export const getOrderBook = async (req, res) => {
    try {
        if (req.query.ticker_root) {
            let orderBoookDoc = orderBookArr.find(item => item.symbol == req.query.ticker_root)
            if (orderBoookDoc) {
                return res.status(200).json(orderBoookDoc)
            }
            return res.status(400).json({ success: false })
        } else {
            return res.status(400).json({ success: false })
        }
    } catch (err) { }
    return res.status(500).json({ success: false })
}


export const setOrderBookData = (data) => {
    let checkLimit = (element) => element.symbol == data.symbol;
    let checkIndex = orderBookArr.findIndex(checkLimit)
    if (checkIndex >= 0) {
        orderBookArr.splice(checkIndex, 1, data)
    } else {
        orderBookArr.push(data)
    }
}

