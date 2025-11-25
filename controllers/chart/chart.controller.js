// import package
import url from 'url';

// import model
import {
    SpotPair,
    SpotTrade,
    Assets,
    PerpetualOrder
} from '../../models';

// import config
import { nodeBinanceAPI } from '../../config/binance';

import * as symbolsDatabase from './symbols_database';
import { RequestProcessor } from './request-processor';
import { getSymbol } from './symbols_database';

import * as CoindcxCtrl from "../coindcx.controller"

const requestProcessor = new RequestProcessor(symbolsDatabase);


/** 
 * Get Chart markets
 * METHOD : GET
 * URL : /api/markets
*/
export const getMarketsData = (req, res) => {
    SpotPair.aggregate([
        {
            "$lookup":
            {
                "from": 'currency',
                "localField": "firstCurrencyId",
                "foreignField": "_id",
                "as": "firstCurrencyInfo"
            }
        },
        { "$unwind": "$firstCurrencyInfo" },

        {
            "$lookup":
            {
                "from": 'currency',
                "localField": "secondCurrencyId",
                "foreignField": "_id",
                "as": "secondCurrencyInfo"
            }
        },
        { "$unwind": "$secondCurrencyInfo" },

        {
            "$project": {
                '_id': 0,
                'name': {
                    "$concat": [
                        "$firstCurrencyInfo.currencySymbol",
                        "$secondCurrencyInfo.currencySymbol"
                    ]
                },
                'type': "crypto",
                'exchange': "Alwin",
            }
        }

    ], (err, spotpairData) => {
        if (err) {
            return res.status(200).json([])
        }
        return res.status(200).json(spotpairData);
    })
}

/** 
 * Get Chart Data
 * METHOD : GET
 * URL : /api/chart/:config
*/
export const getChartData = (req, res) => {
    let uri = url.parse(req.url, true);
    let action = uri.pathname;
    switch (action) {
        case '/chart/config':
            action = '/config';
            break;
        case '/chart/time':
            action = '/time';
            break;
        case '/chart/symbols':
            action = '/symbols';
            break;
        case '/chart/history':
            action = '/history';
            break;
    }

    return requestProcessor.processRequest(action, uri.query, res, 'spot');
}

/** 
 * Get Chart Data
 * METHOD : GET
 * URL : /api/perpetual/chart/:config
*/
export const getPerpetualChart = (req, res) => {
    let uri = url.parse(req.url, true);
    let action = uri.pathname;

    switch (action) {
        case '/perpetual/chart/config':
            action = '/config';
            break;
        case '/perpetual/chart/time':
            action = '/time';
            break;
        case '/perpetual/chart/symbols':
            action = '/symbols';
            break;
        case '/perpetual/chart/history':
            action = '/history';
            break;
    }

    return requestProcessor.processRequest(action, uri.query, res, 'perpetual');
}


export const chart = async ({ pairName, timeType,startDateTimestamp }) => {
    try {
        let pairList = getSymbol();
        if (pairList && pairList.length > 0) {
            let pairData = pairList.find(el => el.name == pairName)
            if (pairData) {

                if (pairData.botstatus == 'binance') {
                    // pairName = pairName.replace('USD', 'USDT')
                    return {
                        "chartData": await nodeBinanceAPI.candlesticks(pairName, timeType),
                        "callBy": "binance"
                    }
                }else if(pairData.botstatus=="wazirx"){
                    return {
                        "chartData":  await CoindcxCtrl.ChartData(pairName, timeType,startDateTimestamp),
                        "callBy": "wazirx"
                    }
                }
                 else {
                    return {
                        "chartData": await chartData({
                            pairName,
                            "resol": timeType
                        }),
                        "callBy": "spotTrade"
                    }
                }
            }
            return []
        }
        return []
    } catch (err) {
        return []
    }
}

async function chartData({ pairName, resol }) {
    // console.log("dasssssssssssss",pairName,resol)
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

        var _trGroup = {}
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
                    pair: { $first: "$pairName" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledQuantity" },
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
                    pair: { $first: "$pairName" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledQuantity" },
                };
            } else if (resol == "m") {
                _trProject = {
                    month: { $month: "$orderDate" },
                    filledQuantity: 1,
                    price: 1,
                    pair: "$pairName",
                    modifiedDate: "$orderDate",
                };
                _trGroup = {
                    _id: {
                        month: "$month",
                    },
                    count: {
                        $sum: 1,
                    },
                    Date: { $last: "$modifiedDate" },
                    pair: { $first: "$pairName" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledQuantity" },
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
                    pair: { $first: "$pairName" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledQuantity" },
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
                    pair: { $first: "$pairName" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledQuantity" },
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
                    pair: { $first: "$pairName" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledQuantity" },
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
                    pair: { $first: "$pairName" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledQuantity" },
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
                    pair: { $first: '$pairName' },
                    low: { $min: '$price' },
                    high: { $max: '$price' },
                    open: { $first: '$price' },
                    close: { $last: '$price' },
                    volume: { $sum: '$filledQuantity' }

                }
            } else {
                resol = 1440;
                _trProject = {
                    yr: {
                        $year: "$orderDate",
                    },
                    mn: {
                        $month: "$orderDate",
                    },
                    dt: {
                        $dayOfMonth: "$orderDate",
                    },
                    hour: {
                        $hour: "$orderDate",
                    },
                    minute: { $minute: "$orderDate" },
                    filledAmount: 1,
                    price: 1,
                    pair: "$pairname",
                    modifiedDate: "$orderDate",
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
                    pair: { $first: "$pairName" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledQuantity" },
                };
            }
        }

        let chartDoc = await SpotTrade.aggregate([
            {
                "$match": {
                    "pairName": pairName,
                    'status': 'completed',
                    // "buyorsell": "sell"
                }
            },
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

        // console.log("*************ssssssssssss*****",chartDoc)

        return chartDoc
    } catch (e) {
        console.log(e, 'eeeeeeeeeeeeeeeeeeeee')
        return []
    }
}

export const perpetualChart = async ({ pairName, resol, fromDateTime, toDateTime }) => {
    try {
        let project = {
            Date: "$Date",
            pair: "$pair",
            low: "$low",
            high: "$high",
            open: "$open",
            close: "$close",
            volume: "$volume",
            exchange: "Mudra",
        };

        var _trGroup = {}
        if (resol) {
            if (resol == "1d") {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$filled.createdAt",
                        },
                        month: {
                            $month: "$filled.createdAt",
                        },
                        day: {
                            $dayOfMonth: "$filled.createdAt",
                        },
                        hour: { $hour: "$filled.createdAt" },
                        minute: {
                            $add: [
                                {
                                    $subtract: [
                                        { $minute: "$filled.createdAt" },
                                        { $mod: [{ $minute: "$filled.createdAt" }, +1440] },
                                    ],
                                },
                                +1440,
                            ],
                        },
                    },
                    Date: { $last: "$filled.createdAt" },
                    pair: { $first: "$pairName" },
                    low: { $min: "$filled.price" },
                    high: { $max: "$filled.price" },
                    open: { $first: "$filled.price" },
                    close: { $last: "$filled.price" },
                    volume: { $sum: "$filled.filledQuantity" },
                };
            } else if (resol == "1M") {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$filled.createdAt",
                        },
                        month: {
                            $month: "$filled.createdAt",
                        },
                        week: { $week: "$filled.createdAt" },
                    },
                    Date: { $last: "$filled.createdAt" },
                    pair: { $first: "$pairName" },
                    low: { $min: "$filled.price" },
                    high: { $max: "$filled.price" },
                    open: { $first: "$filled.price" },
                    close: { $last: "$filled.price" },
                    volume: { $sum: "$filled.filledQuantity" },
                };
            } else if (resol == "m") {
                _trProject = {
                    month: { $month: "$filled.createdAt" },
                    filledQuantity: "$filled.filledQuantity",
                    price: "$filled.price",
                    pair: "$pairName",
                    modifiedDate: "$filled.createdAt",
                };
                _trGroup = {
                    _id: {
                        month: "$month",
                    },
                    count: {
                        $sum: 1,
                    },
                    Date: { $last: "$modifiedDate" },
                    pair: { $first: "$pairName" },
                    low: { $min: "$price" },
                    high: { $max: "$price" },
                    open: { $first: "$price" },
                    close: { $last: "$price" },
                    volume: { $sum: "$filledQuantity" },
                };

            } else if (resol == '1m') {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$filled.createdAt",
                        },
                        month: {
                            $month: "$filled.createdAt",
                        },
                        day: {
                            $dayOfMonth: "$filled.createdAt",
                        },
                        hour: { $hour: "$filled.createdAt" },
                        minute: { $minute: "$filled.createdAt" },
                    },
                    Date: { $last: "$filled.createdAt" },
                    pair: { $first: "$pairName" },
                    low: { $min: "$filled.price" },
                    high: { $max: "$filled.price" },
                    open: { $first: "$filled.price" },
                    close: { $last: "$filled.price" },
                    volume: { $sum: "$filled.filledQuantity" },
                };
            } else if (resol == "5m") {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$filled.createdAt",
                        },
                        month: {
                            $month: "$filled.createdAt",
                        },
                        day: {
                            $dayOfMonth: "$filled.createdAt",
                        },
                        hour: { $hour: "$filled.createdAt" },
                        minute: {
                            $subtract: [
                                { $minute: "$filled.createdAt" },
                                { $mod: [{ $minute: "$filled.createdAt" }, 5] },
                            ],
                        },
                    },
                    Date: { $last: "$filled.createdAt" },
                    pair: { $first: "$pairName" },
                    low: { $min: "$filled.price" },
                    high: { $max: "$filled.price" },
                    open: { $first: "$filled.price" },
                    close: { $last: "$filled.price" },
                    volume: { $sum: "$filled.filledQuantity" },
                };
            } else if (resol == "15m") {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$$filled.createdAt",
                        },
                        month: {
                            $month: "$$filled.createdAt",
                        },
                        day: {
                            $dayOfMonth: "$$filled.createdAt",
                        },
                        hour: { $hour: "$$filled.createdAt" },
                        minute: {
                            $subtract: [
                                { $minute: "$$filled.createdAt" },
                                { $mod: [{ $minute: "$$filled.createdAt" }, 15] },
                            ],
                        },
                    },
                    Date: { $last: "$$filled.createdAt" },
                    pair: { $first: "$pairName" },
                    low: { $min: "$filled.price" },
                    high: { $max: "$filled.price" },
                    open: { $first: "$filled.price" },
                    close: { $last: "$filled.price" },
                    volume: { $sum: "$filled.filledQuantity" },
                };
            } else if (resol == "30m") {
                _trGroup = {
                    _id: {
                        year: {
                            $year: "$filled.createdAt",
                        },
                        month: {
                            $month: "$filled.createdAt",
                        },
                        day: {
                            $dayOfMonth: "$filled.createdAt",
                        },
                        hour: { $hour: "$filled.createdAt" },
                        minute: {
                            $subtract: [
                                { $minute: "$filled.createdAt" },
                                { $mod: [{ $minute: "$filled.createdAt" }, 30] },
                            ],
                        },
                    },
                    Date: { $last: "$filled.createdAt" },
                    pair: { $first: "$pairName" },
                    low: { $min: "$filled.price" },
                    high: { $max: "$filled.price" },
                    open: { $first: "$filled.price" },
                    close: { $last: "$filled.price" },
                    volume: { $sum: "$filled.filledQuantity" },
                };
            } else if (resol == "1h") {
                _trGroup = {
                    "_id": {
                        year: {
                            $year: "$filled.createdAt",
                        },
                        month: {
                            $month: "$filled.createdAt",
                        },
                        day: {
                            $dayOfMonth: "$filled.createdAt",
                        },
                        hour: { $hour: "$filled.createdAt" },
                    },
                    Date: { $last: "$filled.createdAt" },
                    pair: { $first: '$pairName' },
                    low: { $min: '$filled.price' },
                    high: { $max: '$filled.price' },
                    open: { $first: '$filled.price' },
                    close: { $last: '$filled.price' },
                    volume: { $sum: '$filled.filledQuantity' }

                }
            } else {
                resol = 1440;
                _trProject = {
                    yr: {
                        $year: "$filled.createdAt",
                    },
                    mn: {
                        $month: "$filled.createdAt",
                    },
                    dt: {
                        $dayOfMonth: "$filled.createdAt",
                    },
                    hour: {
                        $hour: "$filled.createdAt",
                    },
                    minute: { $minute: "$filled.createdAt" },
                    filledQuantity: 1,
                    price: 1,
                    pair: "$pairname",
                    modifiedDate: "$filled.createdAt",
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
                    pair: { $first: "$pairName" },
                    low: { $min: "$filled.price" },
                    high: { $max: "$filled.price" },
                    open: { $first: "$filled.price" },
                    close: { $last: "$filled.price" },
                    volume: { $sum: "$filled.filledQuantity" },
                };
            }
        }

        let chartDoc = await PerpetualOrder.aggregate([
            {
                "$match": {
                    "pairName": pairName,
                    'status': { "$in": ['pending', 'completed', 'cancel'] },
                }
            },
            { "$unwind": "$filled" },
            // {
            //     "$match": {
            //         "filled.created_at": {
            //             "$gte": fromDateTime,
            //             "$lte": toDateTime
            //         }
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

        return {
            "chartData": chartDoc,
            "callBy": "perpetualTrade"
        }

    } catch (err) {
        return {
            "chartData": [],
            "callBy": "perpetualTrade"
        }
    }
}