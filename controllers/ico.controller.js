import mongoose from "mongoose";
import Assets from "../models/Assets";
import { User } from "../models";
import { createPassBook } from "./passbook.controller";

/**
 * Get User Assets Details
 * URL: /api/getAssetsDetails
 * METHOD : GET
 */
export const getAssetForICO = async (req, res) => {
    try {
        let user = await User.findOne({ "email": req.body.email })

        let asset = await Assets.find({ "userId": user._id })
        return res.status(200).json({ success: true, asset: asset });
    } catch (err) {
        console.log("errsdsds", err);
        return res.status(500).json({ success: false });
    }
};

/**
 * Get buy token from ico
 * URL: /api/getAssetsDetails
 * METHOD : GET
 */
export const buyFromMudraWallet = async (req, res) => {
    try {
        let reqBody = req.body
        let user = await User.findOne({ "email": reqBody.email })

        let asset = await Assets.findOne({ "userId": user._id, "currencySymbol": reqBody.curreny })

        if (asset) {
            let amout = parseFloat(reqBody.amount)
            if (asset.spotwallet >= amout) {
                let buyProcess = await Assets.findOneAndUpdate({ "userId": user._id, "currencySymbol": reqBody.curreny },
                    {
                        $inc: {
                            spotwallet: -amout
                        }
                    }
                )
                let afterBalance = parseFloat(asset.spotwallet) - amout
                //New passbook
                let passbookData = {};
                passbookData.userId = user._id;
                passbookData.coin = reqBody.curreny;
                passbookData.currencyId = asset.currency;
                passbookData.tableId = asset._id;
                passbookData.beforeBalance = asset.spotwallet;
                passbookData.afterBalance = afterBalance;
                passbookData.amount = amout;
                passbookData.type = "ico_token_buy";
                passbookData.category = "debit";
                createPassBook(passbookData);
                return res.status(200).json({ success: true, message: 'updated', address: asset.currencyAddress });

            } else {
                return res.status(200).json({ success: false, message: 'Insufficient Balance' });
            }

        } else {
            return res.status(200).json({ success: false, message: 'Asset not found' });
        }

    } catch (err) {
        console.log("errsdsds", err);
        return res.status(500).json({ success: false });
    }
};