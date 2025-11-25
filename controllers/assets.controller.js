// import package
import mongoose from "mongoose";
import lodash from "lodash";

// import modal
import Assets from "../models/Assets";
import Currency from "../models/currency";
// import User from "../models/User"
// import SpotPairs from '../modals/spotPairs';

import { User } from "../models";

// import controller
import * as ethGateway from "./coin/ethGateway";
import * as bnbGateway from "./coin/bnbGateway";
import * as coinpaymentGateway from "./coin/coinpaymentGateway";
// import { updateRecoverySpotBalance } from './trade.controller';

// import config
import config from "../config";

import { encryptString, decryptString } from "../lib/cryptoJS";

// import lib
import isEmpty from "../lib/isEmpty";
import roundOf from "../lib/roundOf";

const ObjectId = mongoose.Types.ObjectId;

/**
 * Get User Assets Details
 * URL: /api/getAssetsDetails
 * METHOD : GET
 */
export const getAssetsDetails = async (req, res) => {
    try {
        let newDoc = [];
        // let userAssetsData = await Assets.find({ 'userId': req.user.id }).populate("currency");
        let userAssetsData = await Assets.aggregate([
            { $match: { userId: ObjectId(req.user.id) } },

            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userInfo",
                },
            },
            { $unwind: "$userInfo" },

            {
                $lookup: {
                    from: "currency",
                    let: {
                        currencyId: "$currency",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$currencyId"],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                currencyName: 1,
                                currencySymbol: 1,
                                type: 1,
                                withdrawFee: 1,
                                minimumWithdraw: 1,
                                depositFee: 1,
                                minimumdeposit: 1,
                                status: 1,
                                gateWay: 1,
                                CoinpaymetNetWorkFee: 1,
                                status: 1,
                                displaypriority: 1,
                                withdrawFeeType: 1,
                                withdrawFeeFlat: 1,
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
                                bankDetails: 1,
                            },
                        },
                    ],
                    as: "currencyInfo",
                },
            },
            { $unwind: "$currencyInfo" },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    balance: 1,
                    derivativeWallet: 1,
                    spotwallet: 1,
                    p2pwallet: 1,
                    p2pbalance: 1,
                    currencySymbol: 1,
                    currencyAddress: 1,
                    privateKey: 1,
                    alt_tag: 1,
                    recoverySpotBalance: 1,
                    currency: "$currencyInfo",
                    email: "$userInfo.email",
                },
            },
            { $sort: { "currency.displaypriority": 1 } },
        ]);

        // console.log("userAssetSData......./////  ", userAssetsData)

        if (userAssetsData && userAssetsData.length > 0) {
            // console.log("userAssetsDatauserAssetsDatauserAssetsData",userAssetsData)
            let createAddressDoc = userAssetsData.filter(
                (el) => el.currencyAddress == ""
            );

            // console.log("createAddressDoc........./////////////  ",createAddressDoc)

           console.log("getting the asset details...........//////////////////////")
            if (createAddressDoc && createAddressDoc.length > 0) {
                for (let item of createAddressDoc) {
                    
                    console.log("itemitemitemitemitemitemitemitemitem.......//////......",item.currency.currencySymbol)
                    if (item.currency.type == "crypto") {
                        console.log("insideee cryptooooo//////////")
                        if (item.currency.currencySymbol == "ETH") {
                        console.log("insideee ETH //////////")
                            
                            let ethResp = await ethGateway.createAddress();
                            if (ethResp && ethResp?.address) {
                                await Assets.updateOne(
                                    { _id: item._id },
                                    {
                                        $set: {
                                            currencyAddress: ethResp.address,
                                            privateKey: encryptString(
                                                ethResp.privateKey
                                            ),
                                            currencySymbol:
                                                item.currency.currencySymbol,
                                        },
                                    }
                                );
                                newDoc.push(item);
                            }

                        } else if (item.currency.currencySymbol == "BNB") {
                        console.log("insideee BNB //////////")

                            let bnbResp = await bnbGateway.createAddress();
                            if (bnbResp && bnbResp?.address) {
                                if (bnbResp && bnbResp?.address) {
                                    await Assets.updateOne(
                                        { _id: item._id },
                                        {
                                            $set: {
                                                currencyAddress: bnbResp.address,
                                                privateKey: encryptString(
                                                    bnbResp.privateKey
                                                ),
                                                currencySymbol:
                                                    item.currency.currencySymbol,
                                            },
                                        }
                                    );
                                    newDoc.push(item);
                                }
                            }
                        } else {
                        console.log("insideee crypto else //////////")

                            let reqData = {
                                email: item.email,
                            };
                            // let btcResp = await btcGateway.createAddress(reqData)
                            let btcResp =
                                await coinpaymentGateway.createAddress({
                                    currencySymbol:
                                        item.currency.currencySymbol,
                                    emailId: item.email,
                                    ipnUrl: "/api/depositwebhook",
                                });

                            if (item.currency.currencySymbol == "XRP") {

                                await Assets.updateOne(
                                    { _id: item._id },
                                    {
                                        $set: {
                                            currencyAddress: btcResp.address,
                                            privateKey: btcResp.privateKey,
                                            alt_tag: btcResp.alt_tag,
                                        },
                                    }
                                );



                            } else {
                                await Assets.updateOne(
                                    { _id: item._id },
                                    {
                                        $set: {
                                            currencyAddress: btcResp.address,
                                            privateKey: btcResp.privateKey,
                                            alt_tag: btcResp.alt_tag,
                                        },
                                    }
                                );
                            }


                            newDoc.push(item);
                        }
                    } else if (item.currency.type == "token") {
                        console.log("insideee Token. //////////")

                        if (item.currency.gateWay == "ERC") {
                        console.log("insideee ERC //////////")
                            let bebResp = await bnbGateway.createAddress();
                            await Assets.updateOne(
                                { _id: item._id },
                                {
                                    $set: {
                                        currencyAddress: bebResp.address,
                                        privateKey: encryptString(
                                            bebResp.privateKey
                                        ),
                                        currencySymbol:
                                            item.currency.currencySymbol,
                                    },
                                }
                            );
                        } else if (item.currency.gateWay == "BEB") {
                        console.log("insideee BEB //////////")
                            let ethResp = await ethGateway.createAddress();
                            await Assets.updateOne(
                                { _id: item._id },
                                {
                                    $set: {
                                        currencyAddress: ethResp.address,
                                        privateKey: encryptString(
                                            ethResp.privateKey
                                        ),
                                        currencySymbol:
                                            item.currency.currencySymbol,
                                    },
                                }
                            );
                        } else if (item.currency.gateWay == "CoinPayment") {
                        console.log("insideee Cpinpayment //////////")
                            console.log("item.currency.currencySymbol....", item.currency.currencySymbol);
                            console.log("email.//////////...", item.email)
                            let reqData = {
                                email: item.email,
                            };
                            console.log("/////////item.currency.currencySymbol....", item.currency.currencySymbol);
                            // let btcResp = await btcGateway.createAddress(reqData)
                            let btcResp =
                                await coinpaymentGateway.createAddress({
                                    currencySymbol:
                                        item.currency.currencySymbol,
                                    emailId: item.email,
                                    ipnUrl: "/api/depositwebhook",
                                });
                            await Assets.updateOne(
                                { _id: item._id },
                                {
                                    $set: {
                                        currencyAddress: btcResp.address,
                                        privateKey: btcResp.privateKey,
                                        currencySymbol:
                                            item.currency.currencySymbol,
                                    },
                                }
                            );
                            newDoc.push(item);
                        }
                        // }
                        // token
                    } else if (item.type == "fiat") {
                        console.log("insideee Flat //////////")
                        await Assets.updateOne(
                            { _id: item._id },
                            {
                                $set: {
                                    currencyAddress: item._id,
                                    currencySymbol:
                                        item.currency.currencySymbol,
                                },
                            }
                        );
                    }
                }
            }
            let result = lodash.unionBy(newDoc, userAssetsData, "_id");

            // console.log("result....//////// ", result)

            return res
                .status(200)
                .json({ success: true, messages: "successfully", result });
        }

        return res.status(400).json({ success: false });
    } catch (err) {
        console.log("errsdsds", err);
        return res.status(500).json({ success: false });
    }
};

/**
 * Get Asset By Curreny
 * METHOD: GET
 * URL : /api/asset/:currencyId
 */
export const getAssetByCurrency = async (req, res) => {
    try {
        Assets.findOne(
            {
                userId: req.user.id,
                currency: req.params.currencyId,
            },
            {
                _id: 1,
                spotwallet: 1,
                derivativeWallet: 1,
                currencyId: "$currency",
            },
            (err, assetData) => {
                if (err) {
                    return res
                        .status(500)
                        .json({ status: false, message: "Error occured" });
                }
                return res.status(200).json({
                    success: true,
                    messages: "success",
                    result: assetData,
                });
            }
        );
    } catch (err) {
        return res
            .status(500)
            .json({ status: false, message: "Error occured" });
    }
};

/**
 * Create Asset at Signup
 */
export const createUserAsset = async (userData) => {
    try {

        console.log("Creating user aassseet....//////////////////")
        let userAssetDoc = [];
        let currencyData = await Currency.find().lean();
        if (currencyData && currencyData.length > 0) {
            for (let item of currencyData) {
                if (item.type == "crypto") {
                    if (item.currencySymbol == "ETH") {
                        let ethResp = await ethGateway.createAddress();
                        if (ethResp && ethResp?.address) {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: ethResp.address,
                                privateKey: encryptString(ethResp.privateKey),
                            });
                        } else {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: "",
                                privateKey: "",
                            });
                        }
                    } else if (item.currencySymbol == "BNB") {
                        let bnbResp = await bnbGateway.createAddress();
                        if (bnbResp && bnbResp?.address) {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: bnbResp.address,
                                privateKey: encryptString(bnbResp.privateKey),
                            });
                        } else {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: "",
                                privateKey: "",
                            });
                        }
                    } else {
                        let btcResp = await coinpaymentGateway.createAddress({
                            currencySymbol: item.currencySymbol,
                            emailId: userData.email,
                            ipnUrl: "/api/depositwebhook",
                        });

                        if (item.currencySymbol == "XRP") {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: btcResp.address,
                                privateKey: btcResp.privateKey,
                                alt_tag: btcResp.alt_tag,
                            });
                        } else {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: btcResp.address,
                                privateKey: "",
                            });
                        }


                    }
                } else if (item.type == "token") {
                    /**
                     * ERC Token
                     */
                    if (item.gateWay == "ERC") {

                        let ethResp = await ethGateway.createAddress();
                        if (ethResp && ethResp?.address) {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: ethResp.address,
                                privateKey: encryptString(ethResp.privateKey),
                            });
                        } else {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: "",
                                privateKey: "",
                            });
                        }
                        // token
                    } else if (item.gateWay == "BEB") {

                        let bnbResp = await bnbGateway.createAddress();
                        if (bnbResp && bnbResp?.address) {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: bnbResp.address,
                                privateKey: encryptString(bnbResp.privateKey),
                            });
                        } else {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: "",
                                privateKey: "",
                            });
                        }

                        // token
                    } else if (item.gateWay == "CoinPayment") {
                        let btcResp = await coinpaymentGateway.createAddress({
                            currencySymbol: item.currencySymbol,
                            emailId: userData.email,
                            ipnUrl: "/api/depositwebhook",
                        });

                        if (item.currencySymbol == "XRP") {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: btcResp.address,
                                privateKey: btcResp.privateKey,
                                alt_tag: btcResp.alt_tag,
                            });
                        } else {
                            userAssetDoc.push({
                                userId: userData._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                currencyAddress: btcResp.address,
                                privateKey: "",
                            });
                        }
                    }
                } else if (item.type == "fiat") {
                    let id = new ObjectId();
                    userAssetDoc.push({
                        _id: id,
                        userId: userData._id,
                        currency: item._id,
                        currencySymbol: item.currencySymbol,
                        currencyAddress: id,
                        privateKey: "",
                    });
                } else {
                    let id = new ObjectId();
                    userAssetDoc.push({
                        _id: id,
                        userId: userData._id,
                        currency: item._id,
                        currencySymbol: item.currencySymbol,
                        currencyAddress: id,
                        privateKey: "",
                    });
                }
            }
        }

        if (userAssetDoc.length > 0) {
            await Assets.create(userAssetDoc);
            console.log("Assset/.//////// ", userAssetDoc)
            return;
        } else {
            return;
        }
    } catch (err) {
        console.log("assetregistercreate",err)
        return;
    }
};

/**
 * Create Asset at new currency
 */
export const createAssetAtAddCurrency = async (currencyData) => {
    try {
        // console.log("createAssetAtAddCurrency",currencyData)

        let userData = await User.aggregate([
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    currency: currencyData._id,
                    currencySymbol: currencyData.currencySymbol,
                    contractAddress: currencyData&&currencyData.contractAddress ? currencyData.contractAddress : "",
                    // decimals: currencyData&&currencyData?.decimals ? currencyData.decimals : 0,
                },
            },
        ]);
        // console.log("userDatauserData",userData)
        await Assets.create(userData);
        return;
    } catch (err) {
        console.log(err, "---err");
        return;
    }
};

/**
 * Create Asset at Signup
 */
export const CreateDummyAsset = async (userData) => {
    try {
        let userAssetDoc = [];
        let currencyData = await Currency.find();

        if (currencyData && currencyData.length > 0) {
            for (let item of currencyData) {
                if (item.type == "crypto") {
                    if (item.currencySymbol == "ETH") {
                        userAssetDoc.push({
                            userId: userData._id,
                            currency: item._id,
                            currencySymbol: item.currencySymbol,
                            currencyAddress: "",
                            privateKey: "",
                            // 'currencyAddress': ethResp.address,
                            // 'privateKey': ethResp.privateKey,
                        });
                    } else if (item.currencySymbol == "BTC") {
                        userAssetDoc.push({
                            userId: userData._id,
                            currency: item._id,
                            currencySymbol: item.currencySymbol,
                            currencyAddress: "",
                            privateKey: "",
                        });
                    } else if (item.currencySymbol == "TRX") {
                        userAssetDoc.push({
                            userId: userData._id,
                            currency: item._id,
                            currencySymbol: item.currencySymbol,
                            currencyAddress: "",
                            privateKey: "",
                        });
                    } else if (item.currencySymbol == "DOGE") {
                        // let btcResp = await btcGateway.createAddress()

                        userAssetDoc.push({
                            userId: userData._id,
                            currency: item._id,
                            currencySymbol: item.currencySymbol,
                            currencyAddress: "",
                            privateKey: "",
                        });
                    } else if (item.currencySymbol == "ETC") {
                        // let btcResp = await btcGateway.createAddress()

                        userAssetDoc.push({
                            userId: userData._id,
                            currency: item._id,
                            currencySymbol: item.currencySymbol,
                            currencyAddress: "",
                            privateKey: "",
                        });
                    } else if (item.currencySymbol == "XRP") {
                        userAssetDoc.push({
                            userId: userData._id,
                            currency: item._id,
                            currencySymbol: item.currencySymbol,
                            currencyAddress: "",
                            privateKey: "",
                        });
                    }
                } else if (item.type == "token") {
                    /**
                     * ERC Token
                     */
                    // if (item.tokenType == 1) {
                    if (item.currencySymbol == "USDT") {
                        userAssetDoc.push({
                            userId: userData._id,
                            currency: item._id,
                            currencySymbol: item.currencySymbol,
                            currencyAddress: "",
                            privateKey: "",
                        });
                    } else {
                        userAssetDoc.push({
                            userId: userData._id,
                            currency: item._id,
                            currencySymbol: item.currencySymbol,
                            currencyAddress: "",
                            privateKey: "",
                        });

                        // let id = new ObjectId();
                        // userAssetDoc.push({
                        //     "_id": id,
                        //     "userId": userData._id,
                        //     "currency": item._id,
                        //     "currencySymbol": item.currencySymbol,
                        //     'currencyAddress': id,
                        //     'privateKey': '',
                        // })
                    }
                    // token
                } else if (item.type == "fiat") {
                    let id = new ObjectId();
                    userAssetDoc.push({
                        _id: id,
                        userId: userData._id,
                        currency: item._id,
                        currencySymbol: item.currencySymbol,
                        currencyAddress: id,
                        privateKey: "",
                    });
                } else {
                    let id = new ObjectId();
                    userAssetDoc.push({
                        _id: id,
                        userId: userData._id,
                        currency: item._id,
                        currencySymbol: item.currencySymbol,
                        currencyAddress: id,
                        privateKey: "",
                    });
                }
            }
        }

        if (userAssetDoc.length > 0) {
            await Assets.create(userAssetDoc);
            return;
        } else {
            return;
        }
    } catch (err) {
        return;
    }
};

/**
 * Create Asset at new currency
 */
// export const createAssetAtAddCurrency = async (currencyData) => {
//     try {
//         let userData = await User.aggregate([
//             {
//                 "$project": {
//                     '_id': 0,
//                     "userId": '$_id',
//                     "currency": currencyData._id,
//                 }
//             }
//         ])

//         await Assets.create(userData);
//         return
//     } catch (err) {
//         return
//     }
// }
// export const calculateTradeFee = ({ percentage, price }) => {
//     let finalPrice = 0;
//     if (!isEmpty(percentage) && !isEmpty(price)) {
//         finalPrice = price - (price * (percentage / 100))
//     }
//     return roundOf(finalPrice)
// }

/**
 * Update User Asset at Trade Match
 * PARAMS: userId, pairId, buyorsell(sell,buy), price, filledQuantity, type(maker,taker)
 */
// export const updateSpotBalance = async (tradeData) => {
//     try {
//         let spotPairData = await SpotPairs.findOne({ '_id': tradeData.pairId })
//         if (spotPairData) {
//             let percentage = 0;
//             if (tradeData.type == 'maker') {
//                 percentage = spotPairData.maker_rebate
//             } else if (tradeData.type == 'taker') {
//                 percentage = spotPairData.taker_fees
//             }

//             if (tradeData.buyorsell == 'sell') {

//                 let updateAsset = await Assets.findOneAndUpdate(
//                     {
//                         'userId': tradeData.userId,
//                         'currency': spotPairData.secondCurrencyId
//                     },
//                     {
//                         "$inc": {
//                             "spotwallet": calculateTradeFee({
//                                 percentage,
//                                 'price': parseFloat(tradeData.price) * parseFloat(tradeData.filledQuantity)
//                             })
//                         }
//                     },
//                     { "new": true }
//                 )

//                 await updateRecoverySpotBalance({
//                     'userId': tradeData.userId,
//                     'currencyId': spotPairData.secondCurrencyId,
//                     'balance': parseFloat(tradeData.price) * parseFloat(tradeData.filledQuantity),
//                     'type': "-"
//                 })

//                 let respData = {
//                     'type': 'secondCurrency',
//                     'result': {
//                         '_id': updateAsset._id,
//                         'spotwallet': updateAsset.spotwallet,
//                         'currencyId': updateAsset.currency,
//                     }
//                 }

//                 socketEmitOne('updateUserAsset', respData, tradeData.userId)

//             } else if (tradeData.buyorsell == 'buy') {
//                 let updateAsset = await Assets.findOneAndUpdate(
//                     {
//                         'userId': tradeData.userId,
//                         'currency': spotPairData.firstCurrencyId
//                     },
//                     {
//                         "$inc": {
//                             "spotwallet": calculateTradeFee({ percentage, 'price': tradeData.filledQuantity })
//                         }
//                     },
//                     { "new": true }
//                 )

//                 await updateRecoverySpotBalance({
//                     'userId': tradeData.userId,
//                     'currencyId': spotPairData.firstCurrencyId,
//                     'balance': tradeData.filledQuantity,
//                     'type': "-"
//                 })

//                 let respData = {
//                     'type': 'firstCurrency',
//                     'result': {
//                         '_id': updateAsset._id,
//                         'spotwallet': updateAsset.spotwallet,
//                         'currencyId': updateAsset.currency,
//                     }
//                 }

//                 socketEmitOne('updateUserAsset', respData, tradeData.userId)
//             }
//             // firstCurrency
//         }
//     } catch (err) {
//         console.log("Error on Update Spot Balance")
//         return
//     }
// }

/**
 * Update User Asset at Cancel Order
 * PARAMS: userId, pairId, buyorsell(sell,buy), price, quantity
 */
// export const updateBalance = async (tradeData) => {
//     try {
//         let spotPairData = await SpotPairs.findOne({ '_id': tradeData.pairId })
//         if (spotPairData) {
//             if (tradeData.buyorsell == 'buy') {
//                 let updateAsset = await Assets.findOneAndUpdate(
//                     {
//                         'userId': tradeData.userId,
//                         'currency': spotPairData.secondCurrencyId
//                     },
//                     {
//                         "$inc": {
//                             "spotwallet": parseFloat(tradeData.price) * parseFloat(tradeData.quantity)
//                         }
//                     },
//                     { "new": true }

//                 )

//                 await updateRecoverySpotBalance({
//                     'userId': tradeData.userId,
//                     'currencyId': spotPairData.firstCurrencyId,
//                     'balance': parseFloat(tradeData.quantity),
//                     'type': "-"
//                 })

//                 let respData = {
//                     'type': 'secondCurrency',
//                     'result': {
//                         '_id': updateAsset._id,
//                         'spotwallet': updateAsset.spotwallet,
//                         'currencyId': updateAsset.currency,
//                     }
//                 }

//                 socketEmitOne('updateUserAsset', respData, tradeData.userId)

//             } else if (tradeData.buyorsell == 'sell') {

//                 let updateAsset = await Assets.findOneAndUpdate(
//                     {
//                         'userId': tradeData.userId,
//                         'currency': spotPairData.firstCurrencyId
//                     },
//                     {
//                         "$inc": {
//                             "spotwallet": parseFloat(tradeData.quantity)
//                         }
//                     },
//                     { "new": true }
//                 )

//                 await updateRecoverySpotBalance({
//                     'userId': tradeData.userId,
//                     'currencyId': spotPairData.secondCurrencyId,
//                     'balance': parseFloat(tradeData.price) * parseFloat(tradeData.quantity),
//                     'type': "-"
//                 })

//                 let respData = {
//                     'type': 'firstCurrency',
//                     'result': {
//                         '_id': updateAsset._id,
//                         'spotwallet': updateAsset.spotwallet,
//                         'currencyId': updateAsset.currency,
//                     }
//                 }

//                 socketEmitOne('updateUserAsset', respData, tradeData.userId)

//             }
//             // firstCurrency
//         }
//     } catch (err) {
//         console.log("Error on Update Balance")
//         return
//     }
// }

/**
 * User Asset Chart
 * METHOD : GET
 * URL : /api/getUserAsset/:currencyType
 * PARAMS: currencyType
 */
// export const getUserAsset = async (req, res) => {

//     try {
//         let cryptoData = await Assets.aggregate([
//             { "$match": { 'userId': ObjectId(req.user.id) } },
//             {
//                 "$lookup": {
//                     "from": 'currency',
//                     "localField": "currency",
//                     "foreignField": "_id",
//                     "as": "currencyInfo"
//                 }
//             },
//             { "$unwind": "$currencyInfo" },
//             {
//                 "$match": {
//                     "$or": [
//                         { "currencyInfo.type": "crypto" },
//                         { "currencyInfo.type": "token" }
//                     ]
//                 }
//             },
//             { "$limit": 5 },
//             {
//                 "$project": {
//                     "currencyName": "$currencyInfo.currencyName",
//                     "currencySymbol": "$currencyInfo.currencySymbol",
//                     'currencyimage': {
//                         "$cond": [
//                             { "$eq": ['$currencyimage', ''] },
//                             "",
//                             { "$concat": [config.IMAGE_URL, config.image.currencyUrlPath, "$currencyimage"] }
//                         ]
//                     },
//                     'y': "$spotwallet",
//                     'spotwallet': 1,
//                 }
//             }
//         ])

//         let fiatData = await Assets.aggregate([
//             { "$match": { 'userId': ObjectId(req.user.id) } },
//             {
//                 "$lookup": {
//                     "from": 'currency',
//                     "localField": "currency",
//                     "foreignField": "_id",
//                     "as": "currencyInfo"
//                 }
//             },
//             { "$unwind": "$currencyInfo" },
//             {
//                 "$match": {
//                     "currencyInfo.type": "fiat"
//                 }
//             },
//             { "$limit": 5 },
//             {
//                 "$project": {
//                     "currencyName": "$currencyInfo.currencyName",
//                     "currencySymbol": "$currencyInfo.currencySymbol",
//                     'currencyimage': {
//                         "$cond": [
//                             { "$eq": ['$currencyimage', ''] },
//                             "",
//                             { "$concat": [config.IMAGE_URL, config.image.currencyUrlPath, "$currencyimage"] }
//                         ]
//                     },
//                     'y': "$spotwallet",
//                     'spotwallet': 1,
//                 }
//             }
//         ])

//         let result = {
//             cryptoData,
//             fiatData
//         }

//         return res.status(200).json({ 'success': true, 'result': result })
//     } catch (err) {
//         return res.status(500).json({ 'success': false })
//     }
// }

export const updateNewCurrecny = async (req, res) => {
    try {
        let userData = await User.find({ _id: req.user.id });

        let currencyData = await Currency.find();

        if (currencyData && currencyData.length > 0) {
            for (let item of currencyData) {
                let assetfind = await Assets.find({
                    userId: req.user.id,
                    currencySymbol: item.currencySymbol,
                });

                if (isEmpty(assetfind)) {
                    if (item.type == "crypto") {
                        if (item.currencySymbol == "ETH") {
                            let ethResp = await ethGateway.createAddress();

                            // let ethResp = await coinpaymentGateway.createAddress({
                            //     'currencySymbol': item.currencySymbol,
                            //     'emailId': userData.email,
                            //     'ipnUrl': '/api/depositwebhook'
                            // })

                            let newAssets = new Assets({
                                userId: userData[0]._id,
                                currency: item._id,
                                currencySymbol: item.currencySymbol,
                                // 'currencyAddress':"",
                                // 'privateKey': "",
                                currencyAddress: ethResp.address,
                                privateKey: encryptString(ethResp.privateKey),
                            });
                            let resulttt = await newAssets.save();
                        } else {
                            // let btcResp = await btcGateway.createAddress()

                            let btcResp =
                                await coinpaymentGateway.createAddress({
                                    currencySymbol: item.currencySymbol,
                                    emailId: userData[0].email,
                                    ipnUrl: "/api/depositwebhook",
                                });

                            if (item.currencySymbol == "XRP") {
                                let newAssets = new Assets({
                                    userId: userData[0]._id,
                                    currency: item._id,
                                    currencySymbol: item.currencySymbol,
                                    currencyAddress: btcResp.address,
                                    privateKey: btcResp.privateKey,
                                    alt_tag: btcResp.alt_tag,
                                });
                                let resulttt = await newAssets.save();
                            } else {
                                let newAssets = new Assets({
                                    userId: userData[0]._id,
                                    currency: item._id,
                                    currencySymbol: item.currencySymbol,
                                    currencyAddress: btcResp.address,
                                    privateKey: "",
                                });
                                let resulttt = await newAssets.save();
                            }


                        }
                    } else if (item.type == "token") {
                        /**
                         * ERC Token
                         */
                        if (item.gateWay == "ERC") {
                            if (item.currencySymbol == "USDT") {
                                let ethResp = await ethGateway.createAddress();
                                // let ethResp = await coinpaymentGateway.createAddress({
                                //     'currencySymbol': "USDT.ERC20",
                                //     'emailId': userData.email,
                                //     'ipnUrl': '/api/depositwebhook'
                                // })
                                let newAssets = new Assets({
                                    userId: userData[0]._id,
                                    currency: item._id,
                                    currencySymbol: item.currencySymbol,
                                    currencyAddress: ethResp.address,
                                    privateKey: encryptString(
                                        ethResp.privateKey
                                    ),
                                });
                                let resulttt = await newAssets.save();
                            } else {
                                // console.log("***********&&&&*********",item.currencySymbol)

                                let ethResp = await ethGateway.createAddress();
                                // console.log("12312312312312312312",ethResp)

                                let newAssets = new Assets({
                                    userId: userData[0]._id,
                                    currency: item._id,
                                    currencySymbol: item.currencySymbol,
                                    currencyAddress: ethResp.address,
                                    privateKey: encryptString(
                                        ethResp.privateKey
                                    ),
                                });
                                let resulttt = await newAssets.save();
                                // let id = new ObjectId();
                                // userAssetDoc.push({
                                //     "_id": id,
                                //     "userId": userData._id,
                                //     "currency": item._id,
                                //     "currencySymbol": item.currencySymbol,
                                //     'currencyAddress': id,
                                //     'privateKey': '',
                                // })
                            }
                            // token
                        } else if (item.gateWay == "CoinPayment") {
                            let btcResp =
                                await coinpaymentGateway.createAddress({
                                    currencySymbol: item.currencySymbol,
                                    emailId: userData[0].email,
                                    ipnUrl: "/api/depositwebhook",
                                });

                            if (item.currencySymbol == "XRP") {
                                let newAssets = new Assets({
                                    userId: userData[0]._id,
                                    currency: item._id,
                                    currencySymbol: item.currencySymbol,
                                    currencyAddress: btcResp.address,
                                    privateKey: btcResp.privateKey,
                                    alt_tag: btcResp.alt_tag,
                                });
                                let resulttt = await newAssets.save();
                            } else {
                                let newAssets = new Assets({
                                    userId: userData[0]._id,
                                    currency: item._id,
                                    currencySymbol: item.currencySymbol,
                                    currencyAddress: btcResp.address,
                                    privateKey: "",
                                });
                                let resulttt = await newAssets.save();
                            }
                        }
                    } else if (item.type == "fiat") {
                        let id = new ObjectId();
                        let newAssets = new Assets({
                            _id: id,
                            userId: userData[0]._id,
                            currency: item._id,
                            currencySymbol: item.currencySymbol,
                            currencyAddress: id,
                            privateKey: "",
                        });
                        let resulttt = await newAssets.save();
                    } else {
                        let id = new ObjectId();
                        let newAssets = new Assets({
                            _id: id,
                            userId: userData[0]._id,
                            currency: item._id,
                            currencySymbol: item.currencySymbol,
                            currencyAddress: id,
                            privateKey: "",
                        });
                        let resulttt = await newAssets.save();
                    }
                }
            }
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.log("aaaaaaaaaaaaaaaaaaaaaaaaaa", err);
        return res
            .status(500)
            .json({ status: false, message: "Error occured" });
    }
};



/**
 * Reject Coin Withdraw
 * URL: /adminapi/coinWithdraw/reject
 * METHOD : POST
 */
export const getWalletAddress = async (req, res) => {
    console.log("inside getWalletAddress....////////////")
    try {
        let currencyETH = await Currency.find({
            $or: [
                { type: "crypto", currencySymbol: "BNB" },
                { type: "token", gateWay: "BEB" },
            ],
        }).lean()
        let contractList = {}, address = [], adminAddress = config.coinGateway.bnb.address
        let adminPrivateKey = config.coinGateway.bnb.privateKey, i = 0, depositAddress = [];
        if (currencyETH?.length > 0) {
            for (const currency of currencyETH) {
                let walletETH = await Assets.find({ currency: currency._id, currencyAddress: { $ne: "" } }).distinct("currencyAddress")

                if (walletETH) address = address.concat(walletETH)
                if ((currency?.contractAddress) && (currency.type == "token")) contractList[currency.contractAddress.toLowerCase()] = currency.currencySymbol
            }
        }

        address.forEach(element => {
            depositAddress.push(element.toLowerCase());
        });
        console.log("returning................//////////////",{
            depositAddress,
            contractList,
            adminAddress,
            adminPrivateKey
        } )
        let result = {
            depositAddress,
            contractList,
            adminAddress,
            adminPrivateKey
        }
        return res.status(200).json({ success: true, message: "ETH Address", result });
    } catch (err) {
        console.log("coinWithdrawReject", err);
        return res.status(500).json({ success: false, message: "Error on server" });
    }
};

//   getWalletAddress()