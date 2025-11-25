// import package
import mongoose from 'mongoose';

// import lib
import isEmpty, { isBoolean } from '../lib/isEmpty';

/** 
* Add Currency
* URL : /adminapi/currency
* METHOD : POST
* BODY : type
*/
export const addCurrencyValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body, reqFile = req.files;

    if (isEmpty(reqBody.type)) {
        errors.type = "REQUIRED";
    } else if (!['crypto', 'token', 'fiat'].includes(reqBody.type)) {
        errors.type = "INVALID_TYPE";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    if (reqBody.withdrawFeeType == "percentage") {
        if (!isEmpty(reqBody.withdrawFee) && isNaN(reqBody.withdrawFee)) {
            errors.withdrawFee = "ALLOW_NUMERIC";
        } else if (reqBody.withdrawFee <= 0)
            errors.withdrawFee = "ALLOW_ONLY_MORE_THEN_ZERO";
    } else if (reqBody.withdrawFeeType == "flat") {
        if (!isEmpty(reqBody.withdrawFeeFlat) && isNaN(reqBody.withdrawFeeFlat)) {
            errors.withdrawFeeFlat = "ALLOW_NUMERIC";
        } if (reqBody.withdrawFeeFlat <= 0)
            errors.withdrawFeeFlat = "ALLOW_ONLY_MORE_THEN_ZERO";
    } else {
        errors.withdrawFeeType = "In valid withdraw fee type";
    }


    if (isEmpty(reqBody.gateWay) && isNaN(reqBody.gateWay)) {
        errors.gateWay = "Please_Select";

    }
    if (reqBody.gateWay == "CoinPayment") {
        if (isEmpty(reqBody.CoinpaymetNetWorkFee)) {
            errors.CoinpaymetNetWorkFee = "Coinpaymet NetWork Fee is required";
        } else if (isNaN(reqBody.CoinpaymetNetWorkFee)) {
            errors.CoinpaymetNetWorkFee = "ALLOW_NUMERIC";
        } else if (reqBody.CoinpaymetNetWorkFee < 0) {
            errors.CoinpaymetNetWorkFee = "ALLOW_ONLY_MORE_THEN_ZERO";
        }
    }


    if (reqBody.type == 'crypto') {

        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }

        if (isEmpty(reqFile.currencyImage)) {
            errors.currencyImage = "REQUIRED";
        }


        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }

        if (!isEmpty(reqBody.withdrawLimit) && isNaN(reqBody.withdrawLimit)) {
            errors.withdrawLimit = "ALLOW_NUMERIC";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();

    } else if (reqBody.type == 'token') {
        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }

        if (isEmpty(reqFile.currencyImage)) {
            errors.currencyImage = "REQUIRED";
        }

        if (isEmpty(reqBody.burnFee)) {
            errors.burnFee = "Burn Fee field is required";
        } else if (isNaN(reqBody.burnFee)) {
            errors.burnFee = "ALLOW_NUMERIC";
        } else if (reqBody.burnFee < 0) {
            errors.burnFee = "Must be greater than zero";
        }
        if (isEmpty(reqBody.contractAddress)) {
            errors.contractAddress = "REQUIRED";
        }

        if (isEmpty(reqBody.minABI)) {
            errors.minABI = "Min ABI field is required";
        }

        if (isEmpty(reqBody.decimals)) {
            errors.decimals = "Decimals field is required";
        } else if (isNaN(reqBody.decimals)) {
            errors.decimals = "ALLOW_NUMERIC";
        }


        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }

        if (!isEmpty(reqBody.withdrawLimit) && isNaN(reqBody.withdrawLimit)) {
            errors.withdrawLimit = "ALLOW_NUMERIC";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();

    } else if (reqBody.type == 'fiat') {
        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }

        if (isEmpty(reqFile.currencyImage)) {
            errors.currencyImage = "REQUIRED";
        }

        if (isEmpty(reqBody.bankName)) {
            errors.bankName = "Bank name field is required";
        }

        if (isEmpty(reqBody.accountNo)) {
            errors.accountNo = "Account number field is required";
        }

        if (isEmpty(reqBody.holderName)) {
            errors.holderName = "Holder name field is required";
        }

        if (isEmpty(reqBody.bankcode)) {
            errors.bankcode = "IBN code field is required";
        }

        if (isEmpty(reqBody.country)) {
            errors.country = "Country field is required";
        }


        if (!isEmpty(reqBody.withdrawLimit) && isNaN(reqBody.withdrawLimit)) {
            errors.withdrawLimit = "ALLOW_NUMERIC";
        }
        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }
        if (isEmpty(reqBody.depositFee)) {
            errors.depositFee = "Coinpaymet NetWork Fee is required";
        } else if (isNaN(reqBody.depositFee)) {
            errors.depositFee = "ALLOW_NUMERIC";
        } else if (reqBody.depositFee < 0) {
            errors.depositFee = "ALLOW_ONLY_MORE_THEN_ZERO";
        }
        if (isEmpty(reqBody.minimumdeposit)) {
            errors.minimumdeposit = "Coinpaymet NetWork Fee is required";
        } else if (isNaN(reqBody.minimumdeposit)) {
            errors.minimumdeposit = "ALLOW_NUMERIC";
        } else if (reqBody.minimumdeposit < 0) {
            errors.minimumdeposit = "ALLOW_ONLY_MORE_THEN_ZERO";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();
    }
}

/** 
* Update Currency
* URL : /adminapi/currency
* METHOD : PUT
* BODY : currencyId, currencyName, currencySymbol, currencyImage, contractAddress, minABI, decimals, bankName, accountNo, holderName, bankcode, country, withdrawFee, minimumWithdraw,
*/
export const editCurrencyValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body, reqFile = req.files;
    console.log("aaaaaaaaaaaaaaaaa", req.body)
    if (isEmpty(reqBody.currencyId)) {
        errors.currencyId = "CurrencyId field is required";
    } else if (!(mongoose.Types.ObjectId.isValid(reqBody.currencyId))) {
        errors.currencyId = "CurrencyId is invalid";
    }

    if (isEmpty(reqBody.type)) {
        errors.type = "REQUIRED";
    } else if (!['crypto', 'token', 'fiat'].includes(reqBody.type)) {
        errors.type = "INVALID_TYPE";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }


    if (isEmpty(reqBody.gateWay) && isNaN(reqBody.gateWay)) {
        errors.gateWay = "Please_Select";

    }
    if (reqBody.gateWay == "CoinPayment") {
        if (isEmpty(reqBody.CoinpaymetNetWorkFee)) {
            errors.CoinpaymetNetWorkFee = "Coinpaymet NetWork Fee is required";
        } else if (isNaN(reqBody.CoinpaymetNetWorkFee)) {
            errors.CoinpaymetNetWorkFee = "ALLOW_NUMERIC";
        } else if (reqBody.CoinpaymetNetWorkFee < 0) {
            errors.CoinpaymetNetWorkFee = "ALLOW_ONLY_MORE_THEN_ZERO";
        }
    }

    if (reqBody.withdrawFeeType == "percentage") {
        if (!isEmpty(reqBody.withdrawFee) && isNaN(reqBody.withdrawFee)) {
            errors.withdrawFee = "ALLOW_NUMERIC";
        } else if (reqBody.withdrawFee <= 0)
            errors.withdrawFee = "ALLOW_ONLY_MORE_THEN_ZERO";
    } else if (reqBody.withdrawFeeType == "flat") {
        if (!isEmpty(reqBody.withdrawFeeFlat) && isNaN(reqBody.withdrawFeeFlat)) {
            errors.withdrawFeeFlat = "ALLOW_NUMERIC";
        } if (reqBody.withdrawFeeFlat <= 0)
            errors.withdrawFeeFlat = "ALLOW_ONLY_MORE_THEN_ZERO";
    } else {
        errors.withdrawFeeType = "In valid withdraw fee type";
    }



    if (reqBody.type == 'crypto') {

        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }


        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }

        if (!isEmpty(reqBody.withdrawLimit) && isNaN(reqBody.withdrawLimit)) {
            errors.withdrawLimit = "ALLOW_NUMERIC";
        }

        if (isEmpty(reqBody.status)) {
            errors.status = "Invalid";
        } else if (!['active', 'deactive'].includes(reqBody.status)) {
            errors.status = "Invalid";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();

    } else if (reqBody.type == 'token') {
        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }

        if (isEmpty(reqBody.contractAddress)) {
            errors.contractAddress = "REQUIRED";
        }

        if (isEmpty(reqBody.minABI)) {
            errors.minABI = "Min ABI field is required";
        }

        if (isEmpty(reqBody.decimals)) {
            errors.decimals = "Decimals field is required";
        } else if (isNaN(reqBody.decimals)) {
            errors.decimals = "ALLOW_NUMERIC";
        }
        if (isEmpty(reqBody.burnFee)) {
            errors.burnFee = "Burn Fee field is required";
        } else if (isNaN(reqBody.burnFee)) {
            errors.burnFee = "ALLOW_NUMERIC";
        } else if (reqBody.burnFee < 0) {
            errors.burnFee = "Must be greater than zero";
        }

        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }
        if (!isEmpty(reqBody.withdrawLimit) && isNaN(reqBody.withdrawLimit)) {
            errors.withdrawLimit = "ALLOW_NUMERIC";
        }

        if (isEmpty(reqBody.status)) {
            errors.status = "Invalid";
        } else if (!['active', 'deactive'].includes(reqBody.status)) {
            errors.status = "Invalid";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();

    } else if (reqBody.type == 'fiat') {
        if (isEmpty(reqBody.currencyName)) {
            errors.currencyName = "Currency name field is required";
        }

        if (isEmpty(reqBody.currencySymbol)) {
            errors.currencySymbol = "Currency symbol field is required";
        }

        if (isEmpty(reqBody.bankName)) {
            errors.bankName = "Bank name field is required";
        }

        if (isEmpty(reqBody.accountNo)) {
            errors.accountNo = "Account number field is required";
        }

        if (isEmpty(reqBody.holderName)) {
            errors.holderName = "Holder name field is required";
        }
        if (!isEmpty(reqBody.withdrawLimit) && isNaN(reqBody.withdrawLimit)) {
            errors.withdrawLimit = "ALLOW_NUMERIC";
        }

        if (isEmpty(reqBody.bankcode)) {
            errors.bankcode = "IBN code field is required";
        }

        if (isEmpty(reqBody.country)) {
            errors.country = "Country field is required";
        }

        if (!isEmpty(reqBody.minimumWithdraw) && isNaN(reqBody.minimumWithdraw)) {
            errors.minimumWithdraw = "ALLOW_NUMERIC";
        }

        if (isEmpty(reqBody.status)) {
            errors.status = "Invalid";
        } else if (!['active', 'deactive'].includes(reqBody.status)) {
            errors.status = "Invalid";
        }

        if (isEmpty(reqBody.depositFee)) {
            errors.depositFee = "Coinpaymet NetWork Fee is required";
        } else if (isNaN(reqBody.depositFee)) {
            errors.depositFee = "ALLOW_NUMERIC";
        } else if (reqBody.depositFee < 0) {
            errors.depositFee = "ALLOW_ONLY_MORE_THEN_ZERO";
        }
        if (isEmpty(reqBody.minimumdeposit)) {
            errors.minimumdeposit = "Coinpaymet NetWork Fee is required";
        } else if (isNaN(reqBody.minimumdeposit)) {
            errors.minimumdeposit = "ALLOW_NUMERIC";
        } else if (reqBody.minimumdeposit < 0) {
            errors.minimumdeposit = "ALLOW_ONLY_MORE_THEN_ZERO";
        }

        if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

        return next();
    }
}

/** 
 * Crypto Currency
 * METHOD : POST
 * BODY : currencyName, currencySymbol, currencyImage, withdrawFee, minimumWithdraw, status
*/
export const cryptoValidate = (req, res, next) => {

}

/** 
 * Token Currency
 * METHOD : POST
 * BODY : currencyName, currencySymbol, currencyImage, contractAddress, minABI, decimals, withdrawFee, minimumWithdraw,
*/
export const tokenValidate = (req, res, next) => {

}

/** 
 * Fiat Currency
 * METHOD : POST
 * BODY : currencyName, currencySymbol, currencyImage, bankName, accountNo, holderName, bankcode, country, withdrawFee, minimumWithdraw,
*/
export const fiatValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body, reqFile = req.files;


}

