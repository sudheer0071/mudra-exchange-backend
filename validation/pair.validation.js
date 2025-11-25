// import package
import mongoose from 'mongoose';

// import lib
import isEmpty from '../lib/isEmpty';

/** 
 * Add Spot Trade Pair
 * METHOD : POST
 * URL : /adminapi/spotPair
 * BODY : firstCurrencyId, firstFloatDigit, secondCurrencyId, secondFloatDigit, minPricePercentage, maxPricePercentage, maxQuantity, minQuantity, maker_rebate, taker_fees, markupPercentage, botstatus
*/
export const addSpotPairValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.firstCurrencyId)) {
        errors.firstCurrencyId = "Base Currency field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.firstCurrencyId)) {
        errors.firstCurrencyId = "Invalid basecurrency";
    }

    if (isEmpty(reqBody.firstFloatDigit)) {
        errors.firstFloatDigit = "Base Currency floatDigit field is required";
    } else if (isNaN(reqBody.firstFloatDigit)) {
        errors.firstFloatDigit = "Only allow numerice";
    }

    if (isEmpty(reqBody.secondCurrencyId)) {
        errors.secondCurrencyId = "Quote Currency field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.secondCurrencyId)) {
        errors.secondCurrencyId = "Invalid quoteCurrency";
    } else if (reqBody.firstCurrencyId == reqBody.secondCurrencyId) {
        errors.secondCurrencyId = "Currency pair not be same";
    }

    if (isEmpty(reqBody.secondFloatDigit)) {
        errors.secondFloatDigit = "Quote Currency floatDigit field is required";
    } else if (isNaN(reqBody.secondFloatDigit)) {
        errors.secondFloatDigit = "Only allow numerice";
    }
    if (isEmpty(reqBody.markPrice)) {
        errors.markPrice = "Market Price field is required";
    } else if (isNaN(reqBody.taker_fees)) {
        errors.markPrice = "Only allow numerice";
    }

    if (isEmpty(reqBody.minPricePercentage)) {
        errors.minPricePercentage = "MinPricePercentage field is required";
    } else if (isNaN(reqBody.minPricePercentage)) {
        errors.minPricePercentage = "Only allow numerice";
    }
    else if (parseFloat(reqBody.maxPricePercentage) < parseFloat(reqBody.minPricePercentage)) {
        errors.maxPricePercentage = "Max Price should be higher than min price";
    }
    if (isEmpty(reqBody.maxPricePercentage)) {
        errors.maxPricePercentage = "MaxPricePercentage field is required";
    } else if (isNaN(reqBody.maxPricePercentage)) {
        errors.maxPricePercentage = "Only allow numerice";
    }

    if (isEmpty(reqBody.maxQuantity)) {
        errors.maxQuantity = "MaxQuantity field is required";
    } else if (isNaN(reqBody.maxQuantity)) {
        errors.maxQuantity = "Only allow numerice";
    }
    else if (parseFloat(reqBody.maxQuantity) <= 0) {
        errors.maxQuantity = "Allow Positive numeric";
    }
    if (isEmpty(reqBody.minQuantity)) {
        errors.minQuantity = "MinQuantity field is required";
    } else if (isNaN(reqBody.minQuantity)) {
        errors.minQuantity = "Only allow numerice";
    }
    else if (parseFloat(reqBody.minQuantity) <= 0) {
        errors.minQuantity = "Allow Positive numeric";
    }
    else if (parseFloat(reqBody.maxQuantity) < parseFloat(reqBody.minQuantity)) {
        errors.maxQuantity = "Max quantity should be higher than min quantity";
    }

    if (isEmpty(reqBody.maker_rebate)) {
        errors.maker_rebate = "Maker rebate field is required";
    } else if (isNaN(reqBody.maker_rebate)) {
        errors.maker_rebate = "Only allow numerice";
    }


    if (isEmpty(reqBody.taker_fees)) {
        errors.taker_fees = "Taker fees field is required";
    } else if (isNaN(reqBody.taker_fees)) {
        errors.taker_fees = "Only allow numerice";
    }


    if (isEmpty(reqBody.botstatus)) {
        errors.botstatus = "Botstatus field is required";
    } else if (!['off', 'binance'.includes(reqBody.botstatus)]) {
        errors.botstatus = "Invalid bot status";
    }

    if (reqBody.botstatus == 'binance') {
        if (isEmpty(reqBody.markupPercentage)) {
            errors.markupPercentage = "MarkupPercentage field is required";
        } else if (isNaN(reqBody.markupPercentage)) {
            errors.markupPercentage = "Only allow numerice";
        }
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}

/** 
 * Edit Spot Trade Pair
 * METHOD : POST
 * URL : /adminapi/spotPair
 * BODY : pairId, firstCurrencyId, firstFloatDigit, secondCurrencyId, secondFloatDigit, minPricePercentage, maxPricePercentage, maxQuantity, minQuantity, maker_rebate, taker_fees, markupPercentage, botstatus
*/
export const editSpotPairValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.pairId)) {
        errors.pairId = "PairId field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.pairId)) {
        errors.pairId = "Invalid pairId";
    }

    if (isEmpty(reqBody.firstCurrencyId)) {
        errors.firstCurrencyId = "Base Currency field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.firstCurrencyId)) {
        errors.firstCurrencyId = "Invalid basecurrency";
    }

    if (isEmpty(reqBody.firstFloatDigit)) {
        errors.firstFloatDigit = "Base Currency floatDigit field is required";
    } else if (isNaN(reqBody.firstFloatDigit)) {
        errors.firstFloatDigit = "Only allow numerice";
    }

    if (isEmpty(reqBody.secondCurrencyId)) {
        errors.secondCurrencyId = "Quote Currency field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.secondCurrencyId)) {
        errors.secondCurrencyId = "Invalid quoteCurrency";
    } else if (reqBody.firstCurrencyId == reqBody.secondCurrencyId) {
        errors.secondCurrencyId = "Currency pair not be same";
    }

    if (isEmpty(reqBody.secondFloatDigit)) {
        errors.secondFloatDigit = "quoteCurrency floatDigit field is required";
    } else if (isNaN(reqBody.secondFloatDigit)) {
        errors.secondFloatDigit = "Only allow numerice";
    }
    
    if (isEmpty(reqBody.minPricePercentage)) {
        errors.minPricePercentage = "minPricePercentage field is required";
    } else if (isNaN(reqBody.minPricePercentage)) {
        errors.minPricePercentage = "Only allow numerice";
    }
    else if (parseFloat(reqBody.minPricePercentage) <= 0) {
        errors.minPricePercentage = "Allow Positive numeric";
    }
    else if (parseFloat(reqBody.maxPricePercentage) < parseFloat(reqBody.minPricePercentage)) {
        errors.maxPricePercentage = "Max Price should be higher than min price";
    }
    else if (parseFloat(reqBody.maxPricePercentage) <= 0) {
        errors.maxPricePercentage = "Allow Positive numeric";
    }
    if (isEmpty(reqBody.maxPricePercentage)) {
        errors.maxPricePercentage = "maxPricePercentage field is required";
    } else if (isNaN(reqBody.maxPricePercentage)) {
        errors.maxPricePercentage = "Only allow numerice";
    }
    if (isEmpty(reqBody.markPrice)) {
        errors.markPrice = "markPrice field is required";
    } else if (isNaN(reqBody.taker_fees)) {
        errors.markPrice = "Only allow numerice";
    }
    if (isEmpty(reqBody.maxQuantity)) {
        errors.maxQuantity = "maxQuantity field is required";
    } else if (isNaN(reqBody.maxQuantity)) {
        errors.maxQuantity = "Only allow numerice";
    }
    else if (parseFloat(reqBody.maxQuantity) < parseFloat(reqBody.minQuantity)) {
        errors.maxQuantity = "Max quantity should be higher than min quantity";
    }
    if (isEmpty(reqBody.minQuantity)) {
        errors.minQuantity = "minQuantity field is required";
    } else if (isNaN(reqBody.minQuantity)) {
        errors.minQuantity = "Only allow numerice";
    }

    if (isEmpty(reqBody.maker_rebate)) {
        errors.maker_rebate = "maker_rebate field is required";
    } else if (isNaN(reqBody.maker_rebate)) {
        errors.maker_rebate = "Only allow numerice";
    }


    if (isEmpty(reqBody.taker_fees)) {
        errors.taker_fees = "taker_fees field is required";
    } else if (isNaN(reqBody.taker_fees)) {
        errors.taker_fees = "Only allow numerice";
    }


    if (isEmpty(reqBody.botstatus)) {
        errors.botstatus = "botstatus field is required";
    } else if (!['off', 'binance'.includes(reqBody.botstatus)]) {
        errors.botstatus = "Invalid bot status";
    }

    if (reqBody.botstatus == 'binance') {
        if (isEmpty(reqBody.markupPercentage)) {
            errors.markupPercentage = "markupPercentage field is required";
        } else if (isNaN(reqBody.markupPercentage)) {
            errors.markupPercentage = "Only allow numerice";
        }
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}



export const addP2PPairValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.firstCurrency)) {
        errors.firstCurrency = "Base Currency field is required";
    } 

    if (isEmpty(reqBody.secondCurrency)) {
        errors.secondCurrency = "Quote Currency field is required";
    } 

   
    if (isEmpty(reqBody.markPrice)) {
        errors.markPrice = "Market price field is required";
    } else if (isNaN(reqBody.markPrice)) {
        errors.markPrice = "Only allow numerice";
    } else if (parseFloat(reqBody.markPrice)<=0) {
        errors.markPrice = "Must be greater than zero";
    }
   

    if (isEmpty(reqBody.transactionfee)) {
        errors.transactionfee = "Fee field is required";
    } else if (isNaN(reqBody.transactionfee)) {
        errors.transactionfee = "Only allow numerice";
    } else if (parseFloat(reqBody.transactionfee)<=0) {
        errors.transactionfee =  "Must be greater than zero";
    }

  

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}



export const editP2PPairValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.pairId)) {
        errors.pairId = "pairId field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.pairId)) {
        errors.pairId = "Invalid pairId";
    }

    if (isEmpty(reqBody.firstCurrency)) {
        errors.firstCurrency = "Base Currency field is required";
    } 
   

    if (isEmpty(reqBody.secondCurrency)) {
        errors.secondCurrency = "Quote Currency field is required";
    } 

 
    if (isEmpty(reqBody.markPrice)) {
        errors.markPrice = "Market price field is required";
    } else if (isNaN(reqBody.markPrice)) {
        errors.markPrice = "Only allow numerice";
    } else if (parseFloat(reqBody.markPrice)<=0) {
        errors.markPrice = "Must be greater than zero";
    }
   

    if (isEmpty(reqBody.transactionfee)) {
        errors.transactionfee = "Fee field is required";
    } else if (isNaN(reqBody.transactionfee)) {
        errors.transactionfee = "Only allow numerice";
    } else if (parseFloat(reqBody.transactionfee)<=0) {
        errors.transactionfee =  "Must be greater than zero";
    }

   if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}
