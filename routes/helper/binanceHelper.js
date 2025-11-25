// import package
const mongoose = require('mongoose');
const Binance = require("binance-api-node").default;
const BinanceNodeAPI = require('node-binance-api');
const syncEach = require('sync-each');

// import modal
const Spotpairs = require("../../models/spotpairs");
const SpottradeTable = require('../../models/spottradeTable');
const SpotPrices = require('../../models/spotPrices');

// import config
const keys = require("../../config/keys");

// import function
const { initialChartSymbol } = require('../symbols_database');

const ObjectId = mongoose.Types.ObjectId;

// Setup
const binanceclient = Binance(keys.binance.apiKey1);
const binanceAPI = new BinanceNodeAPI().options({
    APIKEY: keys.binance.apiKey1.apiKey,
    APISECRET: keys.binance.apiKey1.apiSecret
});


// tickerwebsocket()
// websocketcall()
// chartSymbolsData();

async function tickerwebsocket() {
    try {
        let getSpotPair = await Spotpairs.find({ 'botstatus': 'On' }).distinct('tiker_root');

        if (getSpotPair && getSpotPair.length > 0) {
            let obj = getSpotPair;

            binanceclient.ws.ticker(obj, tickerdata => {
                // console.log(ticker)
                var tickerarray = []
                tickerarray.push(tickerdata)
                // for (var i = 0; i < tickerarray.length; i++) {
                for (let item of tickerarray) {
                    // console.log("----item", item)
                    var pairname = item.symbol

                    var update = {
                        low: item.low,
                        high: item.high,
                        last: item.bestBid,
                        markprice: item.bestBid,
                        volume: item.volume,
                        change: item.priceChangePercent,
                        secvolume: item.volumeQuote
                    }

                    Spotpairs.findOne({ tiker_root: pairname, botstatus: "On" }).then(pairdata => {
                        if (pairdata) {

                            Spotpairs.findOneAndUpdate({ tiker_root: pairname }, {
                                $set: update,
                            },
                                { new: true },

                                function (err, result) {
                                    // socketio.emit("PRICEDETAILS", result);
                                    // updateStopLimitOrder({ 'pairName': pairname, 'price': item.bestBid })

                                    // const newrecord = new SpotPrices({
                                    //     price: item.bestBid ? item.bestBid : 0,
                                    //     pair: ObjectId(result._id),
                                    //     pairname: pairname,
                                    //     createdAt: new Date(),
                                    // });

                                    // await newrecord.save();
                                    // eventEmitter.emit('stop-limit-order', { price: result.PRICE, pairname: pairname }, function () {
                                    // console.log("resultsss",result)
                                })
                        }
                    })
                }
            })
        }
    } catch (err) {
        console.log("Error on ticker websocket in binance Helper ", err)
    }
}
async function updateStopLimitOrder({ price, pairName }) {
    try {
        console.log("----updateStopLimitOrder=======", pairName)
        console.log("----Price=======", price)

        // SpottradeTable.find({status: '4',pairName: pairName,orderType: 'Stop Limit',})

        var currPrice = parseFloat(price);

        let cond = {
            status: '4',
            orderType: 'Stop Limit',
            spotType: 'lessthan',
            trigger_price: { "$gte": currPrice },
            pairName: pairName
        };

        var getData = await SpottradeTable.aggregate([
            { $match: cond },
            { $sort: { orderDate: 1 } },
            { $limit: 100 },
            { $project: { trigger_price: 1, _id: 1 } }
        ]).allowDiskUse(true);
        // console.log("------getData", getData)
        if (getData && getData.length > 0) {
            syncEach(getData, async function (items, next) {
                var update = await SpottradeTable.findOneAndUpdate(
                    { _id: items._id, status: "4", stopstatus: { $ne: "1" } },
                    { $set: { status: "0" } },
                    { new: true, fields: { status: 1 } });
                console.log('update/***********', update)

            }, function (err, transformedItems) {
            });
        } else {
            return
        }


        let greatercond = {
            status: '4',
            orderType: 'Stop Limit',
            spotType: 'greaterthan',
            trigger_price: { "$lte": currPrice },
            pairName: pairName
        };

        var greatercondgetData = await SpottradeTable.aggregate([
            { $match: greatercond },
            { $sort: { orderDate: 1 } },
            { $limit: 100 },
            { $project: { trigger_price: 1, _id: 1 } }
        ]).allowDiskUse(true);
        // console.log("------getData", getData)
        if (greatercondgetData && greatercondgetData.length > 0) {
            syncEach(greatercondgetData, async function (items, next) {
                var greatercondgetDataupdate = await SpottradeTable.findOneAndUpdate(
                    { _id: items._id, status: "4", stopstatus: { $ne: "1" } },
                    { $set: { status: "0" } },
                    { new: true, fields: { status: 1 } });
                console.log('update greater thannnnb', greatercondgetDataupdate)

            }, function (err, transformedItems) {
            });
        } else {
            return
        }


        let equalcond = {
            status: '4',
            orderType: 'Stop Limit',
            spotType: 'equal',
            trigger_price: currPrice,
            pairName: pairName
        };

        var equalgetData = await SpottradeTable.aggregate([
            { $match: equalcond },
            { $sort: { orderDate: 1 } },
            { $limit: 100 },
            { $project: { trigger_price: 1, _id: 1 } }
        ]).allowDiskUse(true);
        console.log("-----===========-------", equalgetData)
        if (equalgetData && equalgetData.length > 0) {
            console.log("NNNNNNNNNNNNNN")
            syncEach(equalgetData, async function (items, next) {
                var equalupdate = await SpottradeTable.findOneAndUpdate(
                    { _id: items._id, status: "4", stopstatus: { $ne: "1" } },
                    { $set: { status: "0" } },
                    { new: true, fields: { status: 1 } });
                console.log('update/***********', equalupdate)

            }, function (err, transformedItems) {
            });
        } else {
            return
        }

    } catch (err) {
        console.log("-------errr", err)
        return
    }
}

async function websocketcall() {
    try {
        let getSpotPair = await Spotpairs.aggregate([
            { "$match": { 'botstatus': 'On' } },
            {
                "$project": {
                    '_id': 0,
                    'symbol': "$tiker_root",
                    'level': { "$literal": 20 }
                }
            }
        ])

        if (getSpotPair && getSpotPair.length > 0) {
            let obj = getSpotPair;

            binanceclient.ws.partialDepth(obj, async (depth) => {
                // console.log(depth);

                if (depth) {
                    var deptharray = []
                    deptharray.push(depth)

                    for (var i = 0; i < deptharray.length; i++) {
                        var pairsellorders = deptharray[i].asks;
                        var pairbuyorders = deptharray[i].bids;
                        var pair = deptharray[i].symbol

                        var markuppercentage = "1";
                        var result = {};

                        let spotpairsdata = await Spotpairs.findOne({ 'tiker_root': pair })
                        if (spotpairsdata) {
                            markuppercentage = spotpairsdata.markuppercentage;

                            let buyOrderData = await SpottradeTable.aggregate([
                                {
                                    "$match": {
                                        "$or": [
                                            { status: "0" },
                                            { status: "2" }
                                        ],
                                        'firstCurrency': spotpairsdata.first_currency,
                                        'secondCurrency': spotpairsdata.second_currency,
                                        'buyorsell': "buy",
                                    }
                                },
                                {
                                    $group: {
                                        _id: "$price",
                                        quantity: { $sum: "$quantity" },
                                        filledAmount: { $sum: "$filledAmount" },
                                    },
                                },
                                { $sort: { _id: -1 } },
                                { $limit: 10 },
                            ])

                            let sellOrderData = await SpottradeTable.aggregate([
                                {
                                    "$match": {
                                        "$or": [
                                            { status: "0" },
                                            { status: "2" }
                                        ],
                                        'firstCurrency': spotpairsdata.first_currency,
                                        'secondCurrency': spotpairsdata.second_currency,
                                        'buyorsell': "sell",
                                    }
                                },
                                {
                                    $group: {
                                        _id: "$price",
                                        quantity: { $sum: "$quantity" },
                                        filledAmount: { $sum: "$filledAmount" },
                                    },
                                },
                                { $sort: { _id: 1 } },
                                { $limit: 10 },
                            ])

                            let sellOrder = sellOrderData;
                            let buyOrder = buyOrderData;

                            pairsellorders.map(function (binsell) {
                                // console.log("binsell",binsell);
                                var indexofsell = sellOrder.findIndex(
                                    (x) => x._id === parseFloat(binsell.price)
                                );
                                // console.log("indexofsell",indexofsell)
                                var withmarkuppricesell;
                                if ((indexofsell = -1)) {
                                    withmarkuppricesell =
                                        parseFloat(binsell.price) +
                                        (parseFloat(binsell.price) * parseFloat(markuppercentage)) /
                                        100;
                                    var newobsell = {
                                        _id: parseFloat(withmarkuppricesell),
                                        // _id:parseFloat(binsell.price),

                                        quantity: parseFloat(binsell.quantity),
                                        filledAmount: 0,
                                        // total:quantity,
                                    };
                                    sellOrder.push(newobsell);
                                }
                            });

                            sellOrder = sellOrder.sort(
                                (a, b) => parseFloat(a._id) - parseFloat(b._id)
                            );

                            var withmarkuppricebuy;

                            pairbuyorders.map(function (binbuy) {
                                // console.log("binbuy",binbuy);
                                var indexofbuy = buyOrder.findIndex(
                                    (x) => x._id === parseFloat(binbuy.price)
                                );
                                // console.log("indexofbuy",indexofbuy)
                                if ((indexofbuy = -1)) {
                                    withmarkuppricebuy =
                                        parseFloat(binbuy.price) -
                                        (parseFloat(binbuy.price) * parseFloat(markuppercentage)) /
                                        100;

                                    var newobbuy = {
                                        _id: parseFloat(withmarkuppricebuy),
                                        // _id:parseFloat(binbuy.price),
                                        quantity: parseFloat(binbuy.quantity),
                                        filledAmount: 0,
                                        // total:quantity,
                                    };
                                    buyOrder.push(newobbuy);
                                }
                            });
                            buyOrder = buyOrder.sort(
                                (a, b) => parseFloat(b._id) - parseFloat(a._id)
                            );


                            if (buyOrder.length > 0) {
                                var sumamount = 0;
                                for (i = 0; i < buyOrder.length; i++) {
                                    var quantity =
                                        parseFloat(buyOrder[i].quantity) -
                                        parseFloat(buyOrder[i].filledAmount);
                                    var _id = buyOrder[i]._id;
                                    sumamount = parseFloat(sumamount) + parseFloat(quantity);
                                    buyOrder[i].total = sumamount;
                                    buyOrder[i].quantity = quantity;
                                }
                            }

                            if (sellOrder.length > 0) {
                                var sumamount = 0;
                                for (i = 0; i < sellOrder.length; i++) {
                                    var quantity =
                                        parseFloat(sellOrder[i].quantity) -
                                        parseFloat(sellOrder[i].filledAmount);
                                    var _id = sellOrder[i]._id;
                                    sumamount = parseFloat(sumamount) + parseFloat(quantity);
                                    sellOrder[i].total = sumamount;
                                    sellOrder[i].quantity = quantity;
                                }
                            }

                            sellOrder = sellOrder.reverse();

                            result.status = true;
                            result.message = "tradeTableAll";
                            result.buyOrder = buyOrder;
                            result.sellOrder = sellOrder;
                            result.notify_show = "no";
                            (result.firstCurrency = spotpairsdata.first_currency),
                                (result.secondCurrency = spotpairsdata.second_currency);


                            // if (typeof socketio != "undefined") {
                            //     socketio.emit("TRADEBIN", result);
                            // }

                        }
                    }
                }
            });
        }
    } catch (err) {
        console.log("Error on websocketcall in binanceHelper ", err)
    }
}

async function binanceChart({ pairName, timeType }) {
    try {
        let getSpotPair = await Spotpairs.findOne({ "tiker_root": pairName, 'botstatus': 'On' })
        if (getSpotPair) {
            return {
                result: await binanceAPI.candlesticks(pairName, timeType),
                type: 'binance'
            }
        } else {
            return {
                result: await chartData({ pairName, 'resol': timeType }),
                type: 'spotTradeTabel'
            }
        }
    } catch (err) {
        console.log("----err", err)
        return []
    }
}


async function chartData({ pairName, resol }) {
    try {
        let project = {
            Date: "$Date",
            pair: "$pair",
            low: "$low",
            high: "$high",
            open: "$open",
            close: "$close",
            volume: "$volume",
            exchange: "GlobalCryptoX",
        };

        if (resol) {
            if (resol == "1d") {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$orderDate",
                        },
                        month: {
                            $month: "$orderDate",
                        },
                        day: {
                            $dayOfMonth: "$orderDate",
                        },
                        hour: { $hour: "$orderDate" },
                        minute: {
                            $add: [
                                {
                                    $subtract: [
                                        { $minute: "$orderDate" },
                                        { $mod: [{ $minute: "$orderDate" }, +1440] },
                                    ],
                                },
                                +1440,
                            ],
                        },
                    },
                    Date: { $last: "$orderDate" },
                    pair: { $first: "$pair" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledAmount" },
                };
            } else if (resol == "1M") {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$orderDate",
                        },
                        month: {
                            $month: "$orderDate",
                        },
                        week: { $week: "$orderDate" },
                    },
                    Date: { $last: "$orderDate" },
                    pair: { $first: "$pair" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledAmount" },
                };
            } else if (resol == "m") {
                _trProject = {
                    month: { $month: "$createdAt" },
                    filledAmount: 1,
                    price: 1,
                    pair: "$pairname",
                    modifiedDate: "$createdAt",
                };
                _trGroup = {
                    _id: {
                        month: "$month",
                    },
                    count: {
                        $sum: 1,
                    },
                    Date: { $last: "$modifiedDate" },
                    pair: { $first: "$pairname" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledAmount" },
                };

            } else if (resol == '1m') {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$orderDate",
                        },
                        month: {
                            $month: "$orderDate",
                        },
                        day: {
                            $dayOfMonth: "$orderDate",
                        },
                        hour: { $hour: "$orderDate" },
                        minute: { $minute: "$orderDate" },
                    },
                    Date: { $last: "$orderDate" },
                    pair: { $first: "$pair" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledAmount" },
                };
            } else if (resol == "5m") {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$orderDate",
                        },
                        month: {
                            $month: "$orderDate",
                        },
                        day: {
                            $dayOfMonth: "$orderDate",
                        },
                        hour: { $hour: "$orderDate" },
                        minute: {
                            $subtract: [
                                { $minute: "$orderDate" },
                                { $mod: [{ $minute: "$orderDate" }, 5] },
                            ],
                        },
                    },
                    Date: { $last: "$orderDate" },
                    pair: { $first: "$pair" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledAmount" },
                };
            } else if (resol == "15m") {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$orderDate",
                        },
                        month: {
                            $month: "$orderDate",
                        },
                        day: {
                            $dayOfMonth: "$orderDate",
                        },
                        hour: { $hour: "$orderDate" },
                        minute: {
                            $subtract: [
                                { $minute: "$orderDate" },
                                { $mod: [{ $minute: "$orderDate" }, 15] },
                            ],
                        },
                    },
                    Date: { $last: "$orderDate" },
                    pair: { $first: "$pair" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledAmount" },
                };
            } else if (resol == "30m") {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$orderDate",
                        },
                        month: {
                            $month: "$orderDate",
                        },
                        day: {
                            $dayOfMonth: "$orderDate",
                        },
                        hour: { $hour: "$orderDate" },
                        minute: {
                            $subtract: [
                                { $minute: "$orderDate" },
                                { $mod: [{ $minute: "$orderDate" }, 30] },
                            ],
                        },
                    },
                    Date: { $last: "$orderDate" },
                    pair: { $first: "$pair" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledAmount" },
                };
            } else if (resol == "1h") {
                _trGroup = {
                    "_id": {
                        year: {
                            $year: "$orderDate",
                        },
                        month: {
                            $month: "$orderDate",
                        },
                        day: {
                            $dayOfMonth: "$orderDate",
                        },
                        hour: { $hour: "$orderDate" },
                    },
                    Date: { $last: "$orderDate" },
                    pair: { $first: '$pair' },
                    low: { $min: '$price' },
                    high: { $max: '$price' },
                    open: { $first: '$price' },
                    close: { $last: '$price' },
                    volume: { $sum: '$filledAmount' }

                }
            } else {
                resol = 1440;
                _trProject = {
                    yr: {
                        $year: "$createdAt",
                    },
                    mn: {
                        $month: "$createdAt",
                    },
                    dt: {
                        $dayOfMonth: "$createdAt",
                    },
                    hour: {
                        $hour: "$createdAt",
                    },
                    minute: { $minute: "$createdAt" },
                    filledAmount: 1,
                    price: 1,
                    pair: "$pairname",
                    modifiedDate: "$createdAt",
                };
                _trGroup = {
                    _id: {
                        year: "$yr",
                        month: "$mn",
                        day: "$dt",
                        hour: "$hour",
                        minute: {
                            $add: [
                                {
                                    $subtract: [
                                        { $minute: "$modifiedDate" },
                                        { $mod: [{ $minute: "$modifiedDate" }, +resol] },
                                    ],
                                },
                            ],
                        },
                    },
                    count: {
                        $sum: 1,
                    },
                    Date: { $last: "$modifiedDate" },
                    pair: { $first: "$pair" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledAmount" },
                };
            }
        }

        let chartDoc = await SpottradeTable.aggregate([
            {
                "$match": {
                    "pairName": pairName,
                    'status': '1',
                    "buyorsell": "sell"
                }
            },
            // { "$unwind": "$filled" },
            // {
            //     "$match": {
            //         "filled.Type": "sell"
            //     }
            // },
            // {
            //     "$project": {
            //         "orderDate": 1,
            //         "pair": 1,
            //         "price": "$filled.Price",
            //         "filledAmount": "$filled.filledAmount"
            //     }
            // },
            {
                $group: _trGroup,
            },
            {
                $project: project,
            },
            {
                $sort: {
                    Date: 1,
                },
            },
        ])

        return chartDoc
    } catch (e) {
        return []
    }
}

async function chartSymbolsData() {
    try {
        let symbolData = await Spotpairs.aggregate([
            {
                "$project": {
                    "_id": 0,
                    "name": "$tiker_root",
                    "description": "$tiker_root",
                    "exchange": 'Trading',
                    "type": 'crypto'
                }
            }
        ])
        initialChartSymbol(symbolData)
    } catch (e) {
        return []
    }
}

module.exports = {
    tickerwebsocket,
    websocketcall,
    binanceChart,
    updateStopLimitOrder
};