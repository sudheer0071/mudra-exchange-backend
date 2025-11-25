// import package\
import axios from "axios";

// import config
import config from "../config";

// import model
import { PriceConversion, Currency,P2PSpotpairs } from "../models";
// import controller
import * as binanceCtrl from "./binance.controller";

// import lib
import isEmpty from "../lib/isEmpty";
import { replacePair } from "../lib/pairHelper";
import {
  paginationQuery,
  filterSearchQuery
} from '../lib/adminHelpers';
const getJSON = require("get-json");

var coinmarketcap = "ac7c4cd1-2fa8-4e95-8114-6109ca36e73f";
/**
 * Price conversion in CRON
 */
export const priceCNV = async () => {
  try {
    let conversionList = await PriceConversion.find({});
    let p2pconversionList = await P2PSpotpairs.find({});

    if (conversionList && conversionList.length > 0) {
      let binancePrice = await binanceCtrl.marketPrice();

      
      for (let item of conversionList) {
        if (
          !isEmpty(binancePrice) &&
          binancePrice[item.baseSymbol + replacePair(item.convertSymbol)]
        ) {
          await PriceConversion.updateOne(
            {
              _id: item._id,
            },
            {
              $set: {
                convertPrice:
                  binancePrice[
                    item.baseSymbol + replacePair(item.convertSymbol)
                  ],
              },
            }
          );
        }
      }
           
      for (let pair of p2pconversionList) {
        if (
          !isEmpty(binancePrice) &&
          binancePrice[pair.first_currency + replacePair(pair.second_currency)]
        ) {
          await P2PSpotpairs.updateOne(
            {
              _id: pair._id,
            },
            {
              $set: {
                index_price:
                  binancePrice[
                    pair.first_currency + replacePair(pair.second_currency)
                  ],
              },
            }
          );
        }
      }
    }
  } catch (err) {
    console.log("Error on Price conversion");
  }
};

// priceCNV()
/**
 * Add Price Conversion
 */
export const addPriceCNV = async (currencyData) => {
  try {

    if (currencyData.type == "fiat") {
      let currencyList = await Currency.find({
        type: {
          $in: ["crypto", "token"],
        },
      });

      if (currencyList && currencyList.length > 0) {
        let binancePrice = await binanceCtrl.marketPrice();

        for (let item of currencyList) {
          if (item.currencySymbol != currencyData.currencySymbol) {
            let checkPrice = await PriceConversion.findOne({
              baseSymbol: item.currencySymbol,
              convertSymbol: currencyData.currencySymbol,
            });

            if (!checkPrice) {
              let newDoc = new PriceConversion({
                baseSymbol: item.currencySymbol,
                convertSymbol: currencyData.currencySymbol,
                convertPrice:
                  !isEmpty(binancePrice) &&
                  binancePrice[
                    item.currencySymbol +
                      replacePair(currencyData.currencySymbol)
                  ]
                    ? binancePrice[
                        item.currencySymbol +
                          replacePair(currencyData.currencySymbol)
                      ]
                    : 1,
              });
              await newDoc.save();
            }
          }
        }
      }
      return true;
    }else{
      
      let newDoc = new PriceConversion({
        baseSymbol: currencyData.currencySymbol,
        convertSymbol: "INR",
        convertPrice: 1,
      });
      await newDoc.save();
      let newDoc1 = new PriceConversion({
        baseSymbol: currencyData.currencySymbol,
        convertSymbol: "USD",
        convertPrice: 1,
      });
      await newDoc1.save();
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};
export const addPriceConverStion = async (req, res) => {
  try {
    let symbol = req.body.symbol;
    console.log("sdsdsssssssss", symbol);
    let currencyList = await Currency.find({
      type: {
        $in: ["crypto", "token"],
      },
    });

    if (currencyList && currencyList.length > 0) {
      let binancePrice = await binanceCtrl.marketPrice();

      for (let item of currencyList) {
        if (item.currencySymbol != symbol) {
          let checkPrice = await PriceConversion.findOne({
            baseSymbol: item.currencySymbol,
            convertSymbol: symbol,
          });

          if (!checkPrice) {
            let newDoc = new PriceConversion({
              baseSymbol: item.currencySymbol,
              convertSymbol: symbol,
              convertPrice:
                !isEmpty(binancePrice) &&
                binancePrice[item.currencySymbol + replacePair(symbol)]
                  ? binancePrice[item.currencySymbol + replacePair(symbol)]
                  : 1,
            });
            await newDoc.save();
          }
        }
      }
    }

    return false;
  } catch (err) {
    console.log("sddddddddd", err);
    return false;
  }
};

// try {
//     let respData = await axios({
//         'method': 'get',
//         'url': config.COINMARKETCAP.PRICE_CONVERSION,
//         'headers': {
//             'X-CMC_PRO_API_KEY': config.COINMARKETCAP.API_KEY
//         },
//         'params': {
//             'amount': 1,
//             'symbol': item.baseSymbol,
//             'convert': item.convertSymbol
//         }
//     });

//     if (respData && respData.data) {
//         const { data } = respData.data
//         console.log("---data", data)
//     }

// } catch (err) { }

// priceCNVCMC()
// let newDoc = new PriceConversion({
//     baseSymbol:"BTC",
//     convertSymbol:"USD",
//     convertPrice:5
// })

// newDoc.save((err,data)=>{
//     console.log(err,'-----')
//     console.log(data,'---data--')
// })

// ---data {
//     id: 1,
//     symbol: 'BTC',
//     name: 'Bitcoin',
//     amount: 1,
//     last_updated: '2021-09-20T11:41:02.000Z',
//     quote: {
//       USD: {
//         price: 43944.280751262275,
//         last_updated: '2021-09-20T11:41:02.000Z'
//       }
//     }
//   }

export const getPriceCNVlist = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, ["baseSymbol", "convertSymbol"]);
    let count = await PriceConversion.countDocuments(filter);
    let data = await PriceConversion.find(filter, {
      baseSymbol: 1,
      convertSymbol: 1,
      convertPrice: 1,
    })
      .skip(pagination.skip)
      .limit(pagination.limit);

    let result = {
      count,
      data,
    };
    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    console.log("priceCNVpriceCNVpriceCNV",err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

export const priceCNVUpdate = async (req, res) => {
  try {
    const reqBody = req.body;

    await PriceConversion.updateOne(
      {
        _id: reqBody.priceCNVId,
      },
      {
        $set: {
          convertPrice: reqBody.convertPrice,
        },
      }
    );

    return res
      .status(200)
      .json({ message: "Price updated successfully. Refreshing data..." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

export const INRPRICEUpdate = async (req, res) => {
  try {
    let respData = await axios({
      method: "get",
      url: "https://api.wazirx.com/sapi/v1/tickers/24hr",
    });

    // console.log("respData",respData.data)

    var wazdata = respData.data;
    if (wazdata && wazdata.length > 0) {
      var Priceconversiondata = await PriceConversion.find({});
      
      if (Priceconversiondata) {
        for (let item of Priceconversiondata) {
           
          var pairname =
            item.baseSymbol.toLowerCase() + item.convertSymbol.toLowerCase();

          let index = wazdata.findIndex((item) => item.symbol == pairname);

          // console.log("indessdasdsadxxx",index)

          if (index != -1) {
            await PriceConversion.updateOne(
              {
                _id: item._id,
              },
              {
                $set: {
                  convertPrice: wazdata[index].openPrice,
                },
              }
            );
          }
        }
      }

    let p2pconversionList = await P2PSpotpairs.find({});

      if (p2pconversionList) {
        for (let item of p2pconversionList) {
           
          var pairname =
            item.first_currency.toLowerCase() + item.second_currency.toLowerCase();

          let index = wazdata.findIndex((item) => item.symbol == pairname);

          // console.log("indessdasdsadxxx",index)

          if (index != -1) {
            await P2PSpotpairs.updateOne(
              {
                _id: item._id,
              },
              {
                $set: {
                  index_price: wazdata[index].openPrice,
                },
              }
            );
          }
        }
      }
    }
  } catch (err) {
    console.log("err on wzz",err);
  }
};
// INRPRICEUpdate()





export const CoinMarketcapupdate = async (req, res) => {
  try {
 
    // console.log("respData",respData.data)

 
 
      var Priceconversiondata = await PriceConversion.find({});
      // console.log("respData",Priceconversiondata)
      if (Priceconversiondata) {
        for (let item of Priceconversiondata) {
      
     let firstcur=item.baseSymbol;let secondcur=item.convertSymbol;
   try{

   
           getJSON(
            "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=" +
              firstcur +
              "&convert=" +
              secondcur +
              "&CMC_PRO_API_KEY=" +
              coinmarketcap,
            function (errorBal, response) {
              // console.log("respData",firstcur,secondcur,item._id)
              if (response) {
                
                var indexprice =
                  response.data[firstcur] &&
                  response.data[firstcur].quote[secondcur] &&
                  response.data[firstcur].quote[secondcur].price;
                  if(indexprice){
                    var updateObj = {
                      convertPrice: indexprice.toFixed(8),
                    };
                  }else{
                    var updateObj = {
                      convertPrice: 0,
                    };
                  }
            
                console.log("updateObj----", updateObj);
                PriceConversion.findByIdAndUpdate(
                  {_id:item._id},
                  updateObj,
                  {
                    new: true,
                  },
                  function (err, user) {
                    console.log(err, "PriceConversionerrr");
               
                  }
                );
              } else {
                console.log(errorBal, "errorBalerrorBalerrorBalerrorBalerrorBal");
               
              }
            }
          );
   }catch(err){
    console.log(err, "errorBalerrorBalerrorBalerrorBalerrorBal");
   }
          
        }
      }
    
  } catch (err) {
    console.log("err on wzz");
  }
};