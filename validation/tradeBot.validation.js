// import package
import mongoose from 'mongoose';

// import lib
import isEmpty from '../lib/isEmpty';

/** 
 * Add Trade Bot For Open Order
 * URL : /adminapi/orderBot/open
 * METHOD : POST
 * BODY : pairId, side, startPrice, endPrice, startQuantity, endQuantity, count
*/
export const newBot = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.pairId)) {
        errors.pairId = "REQUIRED";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.pairId)) {
        errors.pairId = "Invalid pair";
    }

    if (isEmpty(reqBody.side)) {
        errors.side = "REQUIRED"
    } else if (!Array.isArray(reqBody.side)) {
        errors.side = "Type field is required";
    } else if (!(reqBody.side.some(r => ['buy', 'sell'].includes(r)))) {
        errors.side = "invalid side"
    }

    if (reqBody.side && reqBody.side.includes('buy')) {
        if (isEmpty(reqBody.buyStartPrice)) {
            errors.buyStartPrice = "Start Price field is Required"
        } else if (isNaN(reqBody.buyStartPrice)) {
            errors.buyStartPrice = "Start Price only numeric value"
        } else if (parseFloat(reqBody.buyStartPrice) <= 0) {
            errors.buyStartPrice = "Start Price only positive numeric value"
        }

        if (isEmpty(reqBody.buyEndPrice)) {
            errors.buyEndPrice = "End Price field is Required"
        } else if (isNaN(reqBody.buyEndPrice)) {
            errors.buyEndPrice = "End Price only numeric value"
        } else if (parseFloat(reqBody.buyEndPrice) <= 0) {
            errors.buyEndPrice = "End Price only positive numeric value"
        } else if (!(isEmpty(reqBody.buyEndPrice)) && parseFloat(reqBody.buyEndPrice) >= parseFloat(reqBody.buyStartPrice)) {
            errors.buyEndPrice = "End price should be lesser than start price"
        }
    }

    if (reqBody.side && reqBody.side.includes('sell')) {
        if (isEmpty(reqBody.sellStartPrice)) {
            errors.sellStartPrice = "Start Price field is Required"
        } else if (isNaN(reqBody.sellStartPrice)) {
            errors.sellStartPrice = "Start Price only numeric value"
        } else if (parseFloat(reqBody.sellStartPrice) <= 0) {
            errors.sellStartPrice = "Start Price only positive numeric value"
        }

        if (isEmpty(reqBody.sellEndPrice)) {
            errors.sellEndPrice = "End Price field is Required"
        } else if (isNaN(reqBody.sellEndPrice)) {
            errors.sellEndPrice = "End Price only numeric value"
        } else if (parseFloat(reqBody.sellEndPrice) <= 0) {
            errors.sellEndPrice = "End Price only positive numeric value"
        } else if (!(isEmpty(reqBody.sellEndPrice)) && parseFloat(reqBody.sellEndPrice) <= parseFloat(reqBody.sellStartPrice)) {
            errors.sellEndPrice = "End price should be higher than start price"
        }
    }

    if (isEmpty(reqBody.startQuantity)) {
        errors.startQuantity = "REQUIRED";
    } else if (isNaN(reqBody.startQuantity)) {
        errors.startQuantity = "ALLOW_NUMERIC";
    } else if (parseFloat(reqBody.startQuantity) <= 0) {
        errors.startQuantity = "ALLOW_POSITIVE_NUMERIC";
    }
    if (isEmpty(reqBody.endQuantity)) {
        errors.endQuantity = "REQUIRED";
    } else if (isNaN(reqBody.endQuantity)) {
        errors.endQuantity = "ALLOW_NUMERIC";
    } else if (parseFloat(reqBody.endQuantity) <= 0) {
        errors.endQuantity = "ALLOW_POSITIVE_NUMERIC";
    } else if (parseFloat(reqBody.endQuantity) < parseFloat(reqBody.startQuantity)) {
        errors.endQuantity = "End quantity should be higher than start quantity";
    }

    if (isEmpty(reqBody.count)) {
        errors.count = "REQUIRED";
    } else if (isNaN(reqBody.count)) {
        errors.count = "ALLOW_NUMERIC";
    } else if (parseFloat(reqBody.count) <= 0) {
        errors.count = "ALLOW_POSITIVE_NUMERIC";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}