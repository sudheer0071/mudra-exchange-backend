// import package
import mongoose from "mongoose";
import lodash from "lodash";

// import config
import { nodeBinanceAPI, binanceApiNode } from "../config/binance";
import { socketEmitOne, socketEmitAll } from "../config/socketIO";
import { binOrderTask } from "../config/cron";

// import model
import { SpotPair, SpotTrade } from "../models";

// import lib
import isEmpty from "../lib/isEmpty";
import { toFixed } from "../lib/roundOf";
import { replacePair } from "../lib/pairHelper";

//import controller

import {
  triggerStopLimitOrder,
  calculateServiceFee,
  assetUpdate,
  withServiceFee, tokenFeecalculation
} from "./spotTrade.controller";

const ObjectId = mongoose.Types.ObjectId;

export const spotOrderBookWS = async () => {
  try {
    let getSpotPair = await SpotPair.aggregate([
      { $match: { botstatus: "binance" } },
      {
        $project: {
          _id: 1,
          symbol: {
            $concat: [
              "$firstCurrencySymbol",
              {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$secondCurrencySymbol", "USD"] },
                      then: "USDT",
                    },
                  ],
                  default: "$secondCurrencySymbol",
                },
              },
            ],
          },
          level: { $literal: 20 },
          markupPercentage: 1,
        },
      },
    ]);

    if (getSpotPair && getSpotPair.length > 0) {
      const binanceOrderBookWs = binanceApiNode.ws.partialDepth(getSpotPair, async (depth) => {
        if (depth) {
          let pairData = getSpotPair.find((el) => el.symbol == depth.symbol);
          if (pairData) {
            // sell order book
            let sellOrder = [],
              binanceSellOrder = depth.asks;

            let sellOrderData = await SpotTrade.aggregate([
              {
                $match: {
                  pairId: ObjectId(pairData._id),
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

            sellOrder = sellOrderData;

            for (let sellItem of binanceSellOrder) {
              let orderData = sellOrderData.find(
                (x) => x._id === parseFloat(sellItem.price)
              );

              if (!orderData) {
                sellOrder.push({
                  _id: calculateMarkup(
                    sellItem.price,
                    pairData.markupPercentage,
                    "+"
                  ),
                  quantity: parseFloat(sellItem.quantity),
                  filledQuantity: 0,
                });
              }
            }
            sellOrder = sellOrder.sort(
              (a, b) => parseFloat(a.price) - parseFloat(b.price)
            );

            if (sellOrder.length > 0) {
              let sumAmount = 0;
              for (let i = 0; i < sellOrder.length; i++) {
                let quantity =
                  parseFloat(sellOrder[i].quantity) -
                  parseFloat(sellOrder[i].filledQuantity);
                sumAmount = parseFloat(sumAmount) + parseFloat(quantity);
                sellOrder[i].total = sumAmount;
                sellOrder[i].quantity = quantity;
              }
            }
            sellOrder = sellOrder.reverse();
            //  console.log("aaaaaaa",sellOrder)

            // buy order book
            let buyOrder = [],
              binanceBuyOrder = depth.bids;

            let buyOrderData = await SpotTrade.aggregate([
              {
                $match: {
                  pairId: ObjectId(pairData._id),
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

            buyOrder = buyOrderData;

            for (let buyItem of binanceBuyOrder) {
              let orderData = buyOrderData.find(
                (x) => x._id === parseFloat(buyItem.price)
              );
              if (!orderData) {
                buyOrder.push({
                  _id: calculateMarkup(
                    buyItem.price,
                    pairData.markupPercentage,
                    "-"
                  ),
                  quantity: parseFloat(buyItem.quantity),
                  filledQuantity: 0,
                });
              }
            }

            buyOrder = buyOrder.sort(
              (a, b) => parseFloat(b._id) - parseFloat(a._id)
            );

            if (buyOrder.length > 0) {
              let sumAmount = 0;
              for (let i = 0; i < buyOrder.length; i++) {
                let quantity =
                  parseFloat(buyOrder[i].quantity) -
                  parseFloat(buyOrder[i].filledQuantity);
                sumAmount = parseFloat(sumAmount) + parseFloat(quantity);
                buyOrder[i].total = sumAmount;
                buyOrder[i].quantity = quantity;
              }
            }
            if (pairData) {
              socketEmitAll("orderBook", {
                pairId: pairData._id,
                symbol: pairData.symbol,
                sellOrder: sellOrder,
                buyOrder: buyOrder,
              });
            }
          }
        }
      });
      global.binanceOrderBookWs = binanceOrderBookWs;
    }
  } catch (err) {
    console.log("Error on websocketcall in binanceHelper ", err);
  }
};

export const spotTickerPriceWS = async () => {
  try {
    let getSpotPair = await SpotPair.aggregate([
      { $match: { botstatus: "binance" } },
      {
        $group: {
          _id: null,
          symbol: {
            $push: {
              $concat: [
                "$firstCurrencySymbol",
                {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$secondCurrencySymbol", "USD"] },
                        then: "USDT",
                      },
                    ],
                    default: "$secondCurrencySymbol",
                  },
                },
              ],
            },
          },
          pairData: {
            $push: {
              pairId: "$_id",
              markupPercentage: "$markupPercentage",
              symbol: {
                $concat: [
                  "$firstCurrencySymbol",
                  {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: ["$secondCurrencySymbol", "USD"] },
                          then: "USDT",
                        },
                      ],
                      default: "$secondCurrencySymbol",
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]);
    // console.log("getSpotPairgetSpotPair",getSpotPair[0].pairData)
    if (
      getSpotPair &&
      getSpotPair.length > 0 &&
      getSpotPair[0].symbol &&
      getSpotPair[0].symbol.length > 0
    ) {
      const binanceTickerPriceWs = binanceApiNode.ws.ticker(getSpotPair[0].symbol, async (tickerdata) => {
        // console.log("getSpotPairgetSpotPairgetS÷potPairgetSpotPairgetSpotPair",getSpotPair[0])
        // console.log("tickerdata.symboltickerdata.symboltickerdata.symboltickerdata.symbol",tickerdata)

        let pairData = getSpotPair[0].pairData.find(
          (el) => el.symbol == tickerdata.symbol
        );
        if (pairData) {
          // console.log("pairDatapairDatapairDatapairData",tickerdata)
          let updateSpotPair = await SpotPair.findByIdAndUpdate(
            pairData.pairId,

            {
              // 'low': tickerdata.low,
              // 'high': tickerdata.high,
              low: calculateMarkup(
                tickerdata.low,
                pairData.markupPercentage,
                "+"
              ),
              high: calculateMarkup(
                tickerdata.high,
                pairData.markupPercentage,
                "+"
              ),
              changePrice: tickerdata.priceChange,
              change: tickerdata.priceChangePercent,
              firstVolume: tickerdata.volume,
              secondVolume: tickerdata.volumeQuote,
              // 'last': tickerdata.bestBid,
              // 'markPrice': tickerdata.bestBid,
              last: calculateMarkup(
                tickerdata.bestBid,
                pairData.markupPercentage,
                "+"
              ),
              // markPrice: calculateMarkup(
              //   tickerdata.bestBid,
              //   pairData.markupPercentage,
              //   "+"
              // ),
              markPrice: tickerdata.bestBid
            },
            {
              new: true,
            }
          );
          // "fields": {
          //     "last": 1,
          //     "markPrice": 1,
          //     "low": 1,
          //     "high": 1,
          //     "firstVolume": 1,
          //     "secondVolume": 1,
          //     "changePrice": 1,
          //     "change": 1,
          //     "botstatus": 1,
          // }
          let marketPriceData = {
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
          // console.log("updateSpotPairupdateSpotPairupdateSpotPairupdateSpotPairupdateSpotPair",updateSpotPair)
          socketEmitAll("marketPrice", {
            pairId: pairData.pairId,
            data: marketPriceData,
          });
          triggerStopLimitOrder(updateSpotPair);
          // trailingStopOrder(updateSpotPair)
        }
      });
      global.binanceTickerPriceWs = binanceTickerPriceWs;
    }
  } catch (err) {
    console.log("Error on ticker binance ", err);
  }
};

/**
 * Account Info
 */
export const accountInfo = async () => {
  try {
    let accountInfo = await binanceApiNode.accountInfo();
    if (accountInfo) {
      return {
        status: true,
        data: accountInfo,
      };
    }
    return {
      status: false,
    };
  } catch (err) {
    console.log('errdddddddd', err)
    return {
      status: false,
    };
  }
};

/**
 * Balance Info
 * BODY : currencySymbol
 */
export const balanceInfo = async ({ currencySymbol }) => {
  try {
    let info = await accountInfo();

    if (!info.status) {
      return {
        status: false,
      };
    }

    let currencyBalance = info.data.balances.find(
      (el) => el.asset == currencySymbol
    );

    if (!currencyBalance) {
      return {
        status: false,
      };
    }
    return {
      status: true,
      data: currencyBalance,
    };
  } catch (err) {
    console.log("-----bal---err", err);
    return {
      status: false,
    };
  }
};

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
    let balanceData = await balanceInfo({ currencySymbol });

    if (!balanceData.status) {
      return {
        status: false,
      };
    }

    if (parseFloat(balanceData.data.free) > orderValue) {
      return {
        status: true,
      };
    } else {
      return {
        status: false,
      };
    }
  } catch (err) {
    console.log("-------err", err);
    return {
      status: false,
    };
  }
};

/**
 * Binance Order Place
 * firstCurrencySymbol, secondCurrencySymbol, buyorsell, price, quantity, orderType (limit, market, stop_limit, stop_market), markupPercentage, minimumValue
 */
export const orderPlace = async (reqBody) => {
  try {
    // let reqBody = req.body;
    reqBody.quantity = parseFloat(reqBody.quantity);
    reqBody.price = parseFloat(reqBody.price);
    const checkBinanceBalance = await checkBalance({
      firstCurrencySymbol: reqBody.firstCurrencySymbol,
      secondCurrencySymbol: replacePair(reqBody.secondCurrencySymbol),
      buyorsell: reqBody.buyorsell,
      price: reqBody.price,
      quantity: reqBody.quantity,
    });
    if (!checkBinanceBalance.status) {
      return {
        status: false,
      };
    }

    console.log("------orderTypeError----1", reqBody.orderType);
    if (reqBody.orderType == "limit") {
      return await limitOrderPlace({
        price: reqBody.price,
        quantity: reqBody.quantity,
        buyorsell: reqBody.buyorsell,
        markupPercentage: reqBody.markupPercentage,
        minimumValue: reqBody.minimumValue,
        firstCurrencySymbol: reqBody.firstCurrencySymbol,
        secondCurrencySymbol: reqBody.secondCurrencySymbol,
      });
    } else if (reqBody.orderType == "market") {
      return await marketOrderPlace({
        price: reqBody.price,
        quantity: reqBody.quantity,
        buyorsell: reqBody.buyorsell,
        markupPercentage: reqBody.markupPercentage,
        minimumValue: reqBody.minimumValue,
        firstCurrencySymbol: reqBody.firstCurrencySymbol,
        secondCurrencySymbol: reqBody.secondCurrencySymbol,
      });
    } else if (reqBody.orderType == "STOP_LOSS_LIMIT") {
      return await StoplimitOrderPlace({
        price: reqBody.price,
        stopPrice: reqBody.stopPrice,
        quantity: reqBody.quantity,
        buyorsell: reqBody.buyorsell,
        markupPercentage: reqBody.markupPercentage,
        minimumValue: reqBody.minimumValue,
        firstCurrencySymbol: reqBody.firstCurrencySymbol,
        secondCurrencySymbol: reqBody.secondCurrencySymbol,
        curmarketprice: reqBody.curmarketprice,
      });
    }
    return {
      status: false,
    };
  } catch (err) {
    console.log("----err", err);
    return {
      status: false,
    };
  }
};

export const StoplimitOrderPlace = async ({
  price,
  stopPrice,
  quantity,
  buyorsell,
  markupPercentage,
  minimumValue,
  firstCurrencySymbol,
  secondCurrencySymbol,
  curmarketprice,
}) => {
  try {

    price = parseFloat(price);
    quantity = parseFloat(quantity);
    stopPrice = parseFloat(stopPrice);
    curmarketprice = parseFloat(curmarketprice);

    let withMarkupPrice;
    let withStopMarkupprice;

    var currentprice = calculateMarkup(curmarketprice, markupPercentage, "-");

    let filterDoc = filter[firstCurrencySymbol + secondCurrencySymbol]
    if (!filterDoc) {
      return {
        status: false,
        message: 'Order filter error'
      }
    }

    var type;
    // currentprice < stopPrice ? "TAKE_PROFIT_LIMIT" : "STOP_LOSS_LIMIT";

    // if (buyorsell == "buy") {
    //   withMarkupPrice = calculateMarkup(price, markupPercentage, "-");
    //   withStopMarkupprice = calculateMarkup(stopPrice, markupPercentage, "-");
    // } else if (buyorsell == "sell") {
    //   withMarkupPrice = calculateMarkup(price, markupPercentage, "+");
    //   withStopMarkupprice = calculateMarkup(stopPrice, markupPercentage, "+");
    // }
    // let tradeRule = condition[firstCurrencySymbol + secondCurrencySymbol];
    // if (!tradeRule) {
    //   return {
    //     status: false,
    //   };
    // }

    if (buyorsell == "buy") {
      withMarkupPrice = calculateMarkup(price, markupPercentage, "-");
      if (((currentprice < stopPrice && stopPrice < withMarkupPrice.toFixed(filterDoc.size)) || (currentprice < stopPrice && stopPrice > withMarkupPrice.toFixed(filterDoc.size)))) {
        type = "STOP_LOSS_LIMIT"
      }
      else if (((currentprice > stopPrice && stopPrice > withMarkupPrice.toFixed(filterDoc.size)) || (currentprice > stopPrice && stopPrice < withMarkupPrice.toFixed(filterDoc.size)))) {
        type = "TAKE_PROFIT_LIMIT"
      }
      withStopMarkupprice = stopPrice
    } else if (buyorsell == "sell") {
      withMarkupPrice = calculateMarkup(price, markupPercentage, "+");
      if (((currentprice > stopPrice && stopPrice < withMarkupPrice.toFixed(filterDoc.size)) || (currentprice > stopPrice && stopPrice > withMarkupPrice.toFixed(filterDoc.size)))) {
        type = "STOP_LOSS_LIMIT"
      }
      else if (((currentprice < stopPrice && stopPrice < withMarkupPrice.toFixed(filterDoc.size)) || (currentprice < stopPrice && stopPrice > withMarkupPrice.toFixed(filterDoc.size)))) {
        type = "TAKE_PROFIT_LIMIT"
      }
      withStopMarkupprice = stopPrice
    }

    let orderValue = quantity * withMarkupPrice;

    if (orderValue >= minimumValue) {
      console.log("Inside the Minimum Valueee");
      let orderOption = {
        symbol: firstCurrencySymbol + secondCurrencySymbol,
        side: buyorsell.toUpperCase(),
        type: type,
        quantity: quantity,
        price: withMarkupPrice.toFixed(filterDoc.size),
        stopPrice: withStopMarkupprice.toFixed(filterDoc.size),
      };

      console.log("orderOptionorderOptionorderOptionorderOption", orderOption);

      let neworder = await binanceApiNode.order(orderOption);

      console.log("neworderneworderneworderneworderneworderneworder", neworder);

      if (!neworder) {
        return {
          status: false,
          message: "Error occured",

        };
      }
      return {
        status: true,
        data: neworder,

        // data: {
        //   orderId: neworder.orderId,
        //   status: neworder.status,
        //   executedQty: neworder.executedQty,
        //   origQty: neworder.origQty,
        // },
      };
    } else {
      return {
        status: false,
        message: "Error occured",

      };
    }
  } catch (err) {
    // console.log("Stoplimiterrorrrrrrrr", err);
    return {
      status: false,
      message: err.toString(),

    };
  }
};

export const marketOrderPlace = async ({
  price,
  quantity,
  buyorsell,
  markupPercentage,
  minimumValue,
  firstCurrencySymbol,
  secondCurrencySymbol,
}) => {

  try {
    price = parseFloat(price);
    quantity = parseFloat(quantity);

    let withMarkupPrice;

    if (buyorsell == "buy") {
      withMarkupPrice = calculateMarkup(price, markupPercentage, "-");
    } else if (buyorsell == "sell") {
      withMarkupPrice = calculateMarkup(price, markupPercentage, "+");
    }

    let orderValue = quantity * withMarkupPrice;


    if (orderValue >= minimumValue) {
      let orderOption = {
        symbol: firstCurrencySymbol + secondCurrencySymbol,
        side: buyorsell.toUpperCase(),
        type: "MARKET",
        quantity: quantity,
        // price: withMarkupPrice
      };

  
      let neworder = await binanceApiNode.order(orderOption);
      console.log("neworderneworderneworderneworder", neworder);
      if (!neworder) {
        return {
          status: false,
        };
      }
      return {
        status: true,
        data: {
          orderId: neworder.orderId,
          status: neworder.status,
          executedQty: neworder.executedQty,
          origQty: neworder.origQty,
        },
      };
    } else {
      return {
        status: false,
      };
    }
  } catch (err) {
    console.log("Markett order", err);

    return {
      status: false,
    };
  }
};
export const marketOrderPlaceNew = async ({
  firstCoin,
  secondCoin,
  side,
  quantity,
}) => {
  try {
    quantity = parseFloat(quantity);
    
    let orderOption = {
      symbol: firstCoin + secondCoin,
      side: side.toUpperCase(),
      type: "MARKET",
      quantity: quantity,
    };

    let neworder = await binanceApiNode.order(orderOption);
    if (!neworder) {
      return {
        status: false,
        message: "Error occured",
      };
    }
    return {
      status: true,
      data: neworder,
    };
  } catch (err) {
    console.log('ddddddddddd', err)
    return {
      status: false,
      message: err.toString(),
    };
  }
};
let condition = {
  XRPUSDT: {
    minOrderSize: 10,
  },
  BTCUSDT: {
    minOrderSize: 10,
  },
  ETHUSDT: {
    minOrderSize: 10,
  },
};

const filter = {
  'BNBUSDT': {
    'size': 1
  },
  'ETHUSDT': {
    'size': 2
  },
  'BTCUSDT': {
    'size': 2
  },
}
export const limitOrderPlace = async ({
  price,
  quantity,
  buyorsell,
  markupPercentage,
  minimumValue,
  firstCurrencySymbol,
  secondCurrencySymbol,
}) => {
  try {
    price = parseFloat(price);
    quantity = parseFloat(quantity);

    let withMarkupPrice;

    if (buyorsell == "buy") {
      withMarkupPrice = calculateMarkup(price, markupPercentage, "-");
    } else if (buyorsell == "sell") {
      withMarkupPrice = calculateMarkup(price, markupPercentage, "+");
    }

    let tradeRule = condition[firstCurrencySymbol + secondCurrencySymbol];
    console.log("-----tradeRule", tradeRule);
    if (!tradeRule) {
      return {
        status: false,
        message: 'Order value error'
      };
    }

    let filterDoc = filter[firstCurrencySymbol + secondCurrencySymbol]
    if (!filterDoc) {
      return {
        status: false,
        message: 'Order value error'
      }
    }

    withMarkupPrice = toFixed(withMarkupPrice, filterDoc.size)
    let orderValue = quantity * withMarkupPrice;


    if (orderValue >= tradeRule.minOrderSize) {
      let orderOption = {
        symbol: firstCurrencySymbol + secondCurrencySymbol,
        side: buyorsell.toUpperCase(),
        type: "LIMIT",
        quantity: quantity,
        price: withMarkupPrice,
      };

      let neworder = await binanceApiNode.order(orderOption);

      if (!neworder) {
        return {
          status: false,
        };
      }
      return {
        status: true,
        data: {
          orderId: neworder.orderId,
          status: neworder.status,
          executedQty: neworder.executedQty,
          origQty: neworder.origQty,
        },
      };
    } else {
      return {
        status: false,
        message: 'Order value error'
      };
    }
  } catch (err) {
    console.log("-----err", err);
    return {
      status: false,
    };
  }
};

export const calculateMarkup = (price, percentage, type = "+") => {
  price = parseFloat(price);
  percentage = parseFloat(percentage);
  //  console.log('calculateMarkup',price,percentage)
  if (!isEmpty(price)) {
    if (type == "+") {
      return price + price * (percentage / 100);
    } else if (type == "-") {
      return price - price * (percentage / 100);
    }
  }
  return 0;
};

/**
 * Get Order Status
 * BODY : pairName, binanceOrderId
 */
export const orderStatus = async ({ pairName, binanceOrderId }) => {
  try {
    var orderstatus = await binanceApiNode.getOrder({
      symbol: pairName,
      orderId: binanceOrderId,
    });
    if (orderstatus) {
      return {
        status: true,
        data: orderstatus,
      };
    } else {
      return {
        status: false,
      };
    }
  } catch (err) {
    return {
      status: false,
    };
  }
};

/**
 * Check Binance Order
 */
binOrderTask.start();

let binOrderCheck = false;
export const checkOrder = async () => {
  // binOrderTask.stop();
  // console.log("Binance Check Order Status")
  try {

    if (binOrderCheck) {
      return false;
    }

    binOrderCheck = true;
    // console.log('binOrderCheck',binOrderCheck)
    const orderList = await SpotTrade.find({
      isLiquidity: true,
      liquidityType: "binance",
      status: { $in: ["open", "pending", 'conditional'] },
    });
    // console.log("-----orderList", orderList)
    if (orderList && orderList.length > 0) {
      for (let orderData of orderList) {
        let binOrder = await orderStatus({
          pairName: orderData.firstCurrency + orderData.secondCurrency,
          binanceOrderId: parseFloat(orderData.liquidityId),
        });
        console.log("-----binOrder", binOrder);
        if (binOrder.status) {
          let pairData = await SpotPair.findById(orderData.pairId);
          let binData = binOrder.data;

          if (pairData && binOrder.data.status == "PARTIALLY_FILLED") {
            let uniqueId = Math.floor(Math.random() * 1000000000);
            let filledQty = Math.abs(
              orderData.filledQuantity - binData.executedQty
            );

            await SpotTrade.findByIdAndUpdate(
              orderData._id,
              {
                status: "pending",
                filledQuantity: orderData.filledQuantity + filledQty,
                $push: {
                  filled: {
                    pairId: orderData.pairId,
                    // "sellUserId": orderData.buyorsell == 'sell' ? orderData.userId : newOrder.userId,
                    // "buyUserId": orderData[count].buyorsell == 'buy' ? orderData[count].userId : newOrder.userId,
                    userId: orderData.userId,
                    // "sellOrderId": orderData.buyorsell == 'sell' ? orderData._id : newOrder._id,
                    // "buyOrderId": orderData[count].buyorsell == 'buy' ? orderData[count]._id : newOrder._id,
                    uniqueId: uniqueId,
                    price: orderData.price,
                    filledQuantity: filledQty,
                    Fees: calculateServiceFee({
                      price:
                        orderData.buyorsell == "sell"
                          ? orderData.price * filledQty
                          : filledQty,
                      serviceFee: pairData.taker_fees,
                    }),
                    status: "filled",
                    Type: orderData.buyorsell,
                    createdAt: new Date(),
                    orderValue: orderData.price * filledQty,
                  },
                },
              },
              { new: true }
            );

            await assetUpdate({
              currencyId:
                orderData.buyorsell == "sell"
                  ? orderData.secondCurrencyId
                  : orderData.firstCurrencyId,
              userId: orderData.userId,
              tableId: orderData._id,
              type: "spot_trade",
              balance: withServiceFee({
                price:
                  orderData.buyorsell == "sell"
                    ? orderData.price * filledQty
                    : filledQty,
                serviceFee: pairData.taker_fees,
              }),
            });
          } else if (pairData && binOrder.data.status == "FILLED") {
            let uniqueId = Math.floor(Math.random() * 1000000000);
            let filledQty = Math.abs(
              orderData.filledQuantity - binData.executedQty
            );
            let filledOrder = {
              pairId: orderData.pairId,
              // "sellUserId": orderData.buyorsell == 'sell' ? orderData.userId : newOrder.userId,
              // "buyUserId": orderData[count].buyorsell == 'buy' ? orderData[count].userId : newOrder.userId,
              userId: orderData.userId,
              // "sellOrderId": orderData.buyorsell == 'sell' ? orderData._id : newOrder._id,
              // "buyOrderId": orderData[count].buyorsell == 'buy' ? orderData[count]._id : newOrder._id,
              uniqueId: uniqueId,
              price: orderData.price,
              filledQuantity: filledQty,
              Fees: calculateServiceFee({
                price:
                  orderData.buyorsell == "sell"
                    ? orderData.price * filledQty
                    : filledQty,
                serviceFee: pairData.taker_fees,
              }),
              status: "filled",
              Type: orderData.buyorsell,
              createdAt: new Date(),
              orderValue: orderData.price * filledQty,
            };
            if (orderData.buyorsell == "buy")
              filledOrder.buyUserId = orderData.userId;
            else
              filledOrder.sellUserId = orderData.userId;

            // Own Token Fee Calculation for sell update
            let final_fee_newOrder = await tokenFeecalculation({
              orderData: orderData,
              fees: calculateServiceFee({
                price:
                  orderData.buyorsell == "sell"
                    ? orderData.price * filledQty
                    : filledQty,
                serviceFee: pairData.taker_fees,
              }),
              pairData,
              tradePrice: orderData.price, // sellOrderData.price,
              tradeQuantity: filledQty,
              serviceFee: pairData.taker_fees,
              type: "spot_trade",
              tableId: orderData._id,
            });
            filledOrder.Fees = final_fee_newOrder.fees;
            filledOrder.OwnToken =
              final_fee_newOrder.own_token;

            await SpotTrade.findByIdAndUpdate(
              orderData._id,
              {
                status: "completed",
                filledQuantity: orderData.filledQuantity + filledQty,
                $push: {
                  filled: filledOrder
                },
              },
              { new: true }
            );
            await getOpenOrderSocket(orderData.userId, orderData.pairId);
            await getOrderHistorySocket(orderData.userId, orderData.pairId);
            await getTradeHistorySocket(orderData.userId, orderData.pairId);
            // await assetUpdate({
            //   currencyId:
            //     orderData.buyorsell == "sell"
            //       ? orderData.secondCurrencyId
            //       : orderData.firstCurrencyId,
            //   userId: orderData.userId,
            //   tableId: orderData._id,
            //   type: "spot_trade",
            //   balance: withServiceFee({
            //     price:
            //       orderData.buyorsell == "sell"
            //         ? orderData.price * filledQty
            //         : filledQty,
            //     serviceFee: pairData.taker_fees,
            //   }),
            // });
          } else if (pairData && binOrder.data.status == "CANCELED") {
            let filledQty = Math.abs(
              orderData.quantity - orderData.filledQuantity
            );
            var cancelup = await SpotTrade.findByIdAndUpdate(
              orderData._id,
              {
                status: "cancel",
              },
              { new: true }
            );

            await assetUpdate({
              currencyId:
                orderData.buyorsell == "buy"
                  ? orderData.secondCurrencyId
                  : orderData.firstCurrencyId,
              userId: orderData.userId,
              tableId: orderData._id,
              type: "spot_trade",
              balance:
                orderData.buyorsell == "buy"
                  ? orderData.price * filledQty
                  : filledQty,
            });
            await getOpenOrderSocket(orderData.userId, orderData.pairId);
            await getOrderHistorySocket(orderData.userId, orderData.pairId);
            await getTradeHistorySocket(orderData.userId, orderData.pairId);
          }
        }
      }
    }
    binOrderCheck = false;

    // binOrderTask.start();
  } catch (err) {
    console.log("errerrerrbinanceoRedrrrrrrrrrrrrrr", err);
    binOrderCheck = false;

    // binOrderTask.start();
  }
};

/**
 * Recent Trade
 */
export const recentTrade = async ({
  firstCurrencySymbol,
  secondCurrencySymbol,
}) => {
  try {
    secondCurrencySymbol = replacePair(secondCurrencySymbol);
    let recentTradeData = await binanceApiNode.trades({
      symbol: firstCurrencySymbol + secondCurrencySymbol,
      limit: 50,
    });
    let recentTrade = [];
    recentTradeData.filter((el) => {
      recentTrade.push({
        createdAt: new Date(el.time),
        Type: el.isBuyerMaker ? "buy" : "sell",
        price: el.price,
        filledQuantity: el.qty,
      });
    });

    return recentTrade;
  } catch (err) {
    console.log("\x1b[31m", "Error on binance trade list");
    return [];
  }
};

export const getSpotPair = async () => {
  try {
    let pairLists = await SpotPair.find(
      { botstatus: "binance" },
      {
        firstCurrencySymbol: 1,
        secondCurrencySymbol: 1,
      }
    );

    if (pairLists && pairLists.length > 0) {
      recentTradeWS(pairLists);
    }
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Cancel Order
 * symbol
 */
export const cancelOrder = async ({
  firstCoin,
  secondCoin,
  binanceId,
  orderType,
}) => {
  try {
    let cancelOrder;

    cancelOrder = await binanceApiNode.cancelOrder({
      symbol: firstCoin + secondCoin,
      orderId: binanceId,
    });

    console.log("------cancelOrder", cancelOrder);
    if (cancelOrder) {
      return {
        status: true,
        data: cancelOrder,
      };
    } else {
      return {
        status: false,
      };
    }
  } catch (err) {
    console.log("------err", err);
    return {
      status: false,
    };
  }
};

export const recentTradeWS = async (pairList) => {
  try {
    let symbolList = lodash.map(pairList, (item) => {
      return item.firstCurrencySymbol + replacePair(item.secondCurrencySymbol);
    });

    if (symbolList && symbolList.length > 0) {
      const binanceTradeWs = binanceApiNode.ws.trades(symbolList, async (trade) => {
        if (trade) {
          let pairData = pairList.find(
            (el) =>
              el.firstCurrencySymbol + replacePair(el.secondCurrencySymbol) ==
              trade.symbol
          );
          let recentTrade = [
            {
              createdAt: new Date(trade.tradeTime),
              Type: trade.isBuyerMaker ? "buy" : "sell",
              price: trade.price,
              filledQuantity: trade.quantity,
            },
          ];

          socketEmitAll("recentTrade", {
            pairId: pairData._id,
            data: recentTrade,
          });
        }
      });
      global.binanceTradeWs = binanceTradeWs;
    }
  } catch (err) {
    console.log("Error on recentTradeWS");
  }
};

export const marketPrice = async () => {
  try {
    return binanceApiNode.prices();
  } catch (err) {
    return "";
  }
};

// Initial Function Call
getSpotPair();
spotOrderBookWS();
spotTickerPriceWS();
