// import package
import mongoose from 'mongoose';
import lodash from 'lodash';

// import config
import { nodeBinanceAPI, binanceApiNode } from '../config/binance';
import { socketEmitOne, socketEmitAll } from '../config/socketIO';

// import model
import {
    SpotPair,
    SpotTrade
} from '../models';

// import lib
import isEmpty from '../lib/isEmpty';
import { toFixed } from '../lib/roundOf';
import { replacePair } from '../lib/pairHelper';

const rp = require("request-promise");


var timestamp = Date.now();

var apikey =""

var secret = ""





async function getSignature(params, secret) {
    var orderedParams = "";
    Object.keys(params).sort().forEach(function(key) {
      orderedParams += key + "=" + params[key] + "&";
    });
    orderedParams = orderedParams.substring(0, orderedParams.length - 1);

    return bybitcrypto.createHmac('sha256', secret).update(orderedParams).digest('hex');
}


export const Wazirxauthtoken =async () =>{

    return false

    var header = { "X-API-KEY":apikey };
    // var args = { email: v.userId.email, type: "getnewaddress" };


    const options = {
      url: "https://api.wazirx.com/sapi/v1/create_auth_token?recvWindow=20000&timestamp="+timestamp+"&signature=3c***e5",
      method: "POST",
      headers: header,
    //   body: JSON.stringify(args),
    };
    request(options, function(error, response, body) {
   console.log("0000000000000000000",body)
    }
    )




}


export const SpotOrderbookWazirx = async () => {
    try {
        let getSpotPair = await SpotPair.aggregate([
            { "$match": { 'botstatus': 'wazirx' } },
            {
                "$project": {
                    '_id': 1,
                    'symbol': {
                        "$concat": [
                            "$firstCurrencySymbol",
                            {
                                "$switch": {
                                    "branches": [
                                        { "case": { "$eq": ["$secondCurrencySymbol", 'USD'] }, then: "USDT" },
                                    ],
                                    "default": "$secondCurrencySymbol"
                                }
                            },
                        ]
                    },
                    'level': { "$literal": 20 },
                    'markupPercentage': 1
                }
            }
        ])

        console.log("spotapsssssss wazirxxxx",getSpotPair)
        return false
        if (getSpotPair && getSpotPair.length > 0) {

            binanceApiNode.ws.partialDepth(getSpotPair, async (depth) => {
                if (depth) {

                    let pairData = getSpotPair.find((el) => el.symbol == depth.symbol)

                    if (pairData) {

                        // sell order book
                        let sellOrder = [], binanceSellOrder = depth.asks;
                        let sellOrderData = await SpotTrade.aggregate([
                            {
                                "$match": {
                                    "pairId": ObjectId(pairData._id),
                                    "$or": [
                                        { "status": "open" },
                                        { "status": "pending" },
                                    ],
                                    'buyorsell': 'sell'
                                }
                            },
                            {
                                "$group": {
                                    '_id': "$price",
                                    'quantity': { "$sum": "$quantity" },
                                    'filledQuantity': { "$sum": "$filledQuantity" },
                                }
                            },
                            { "$sort": { "_id": 1 } },
                            { "$limit": 10 }
                        ])

                        sellOrder = sellOrderData;
                        for (let sellItem of binanceSellOrder) {

                            let orderData = sellOrderData.find((x) => x._id === parseFloat(sellItem.price));
                            if (!orderData) {

                                sellOrder.push({
                                    '_id': calculateMarkup(sellItem.price, pairData.markupPercentage, '+'),
                                    'quantity': parseFloat(sellItem.quantity),
                                    'filledQuantity': 0
                                })
                            }
                        }

                        sellOrder = sellOrder.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

                        if (sellOrder.length > 0) {
                            let sumAmount = 0
                            for (let i = 0; i < sellOrder.length; i++) {
                                let quantity = parseFloat(sellOrder[i].quantity) - parseFloat(sellOrder[i].filledQuantity);
                                sumAmount = parseFloat(sumAmount) + parseFloat(quantity);
                                sellOrder[i].total = sumAmount;
                                sellOrder[i].quantity = quantity;
                            }
                        }
                        sellOrder = sellOrder.reverse();


                        // buy order book
                        let buyOrder = [], binanceBuyOrder = depth.bids;

                        let buyOrderData = await SpotTrade.aggregate([
                            {
                                "$match": {
                                    "pairId": ObjectId(pairData._id),
                                    "$or": [
                                        { "status": "open" },
                                        { "status": "pending" },
                                    ],
                                    'buyorsell': 'buy'
                                }
                            },
                            {
                                "$group": {
                                    '_id': "$price",
                                    'quantity': { "$sum": "$quantity" },
                                    'filledQuantity': { "$sum": "$filledQuantity" },
                                }
                            },
                            { "$sort": { "_id": -1 } },
                            { "$limit": 10 }
                        ])

                        buyOrder = buyOrderData;

                        for (let buyItem of binanceBuyOrder) {
                            let orderData = buyOrderData.find((x) => x._id === parseFloat(buyItem.price));
                            if (!orderData) {
                                buyOrder.push({
                                    '_id': calculateMarkup(buyItem.price, pairData.markupPercentage, '-'),
                                    'quantity': parseFloat(buyItem.quantity),
                                    'filledQuantity': 0
                                })
                            }
                        }

                        buyOrder = buyOrder.sort((a, b) => parseFloat(b._id) - parseFloat(a._id));

                        if (buyOrder.length > 0) {
                            let sumAmount = 0
                            for (let i = 0; i < buyOrder.length; i++) {
                                let quantity = parseFloat(buyOrder[i].quantity) - parseFloat(buyOrder[i].filledQuantity);
                                sumAmount = parseFloat(sumAmount) + parseFloat(quantity);
                                buyOrder[i].total = sumAmount;
                                buyOrder[i].quantity = quantity;
                            }
                        }

                        socketEmitAll('orderBook', {
                            'pairId': pairData._id,
                            'sellOrder': sellOrder,
                            'buyOrder': buyOrder,
                        })
                    }
                }
            })
        }

    } catch (err) {
        console.log("Error on websocketcall in binanceHelper ", err)
    }
}

// SpotOrderbookWazirx();
Wazirxauthtoken();