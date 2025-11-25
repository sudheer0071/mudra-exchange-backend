// import package
import mongoose from 'mongoose';

// import lib
import isEmpty from '../lib/isEmpty';
import WAValidator from 'wallet-address-validator';

/** 
 * User Withdraw
 * URL: /api/withdraw
 * METHOD : POST
 * BODY: currencyId, amount, bankId, twoFACode
*/
export const fiatWithdrawValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body;
    if (isEmpty(reqBody.currencyId)) {
        errors.currencyId = "REQUIRED";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.currencyId)) {
        errors.currencyId = "Invalid currency id";
    }

    if (isEmpty(reqBody.bankId)) {
        errors.bankId = "REQUIRED";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.bankId)) {
        errors.bankId = "INVALID_BANK_ACCOUNT";
    }

    if (isEmpty(reqBody.amount)) {
        errors.amount = "REQUIRED";
    } else if (isNaN(reqBody.amount)) {
        errors.amount = "ALLOW_NUMERIC";
    }

    if (isEmpty(reqBody.twoFACode)) {
        errors.twoFACode = "REQUIRED";
    } else if (isNaN(reqBody.twoFACode) || reqBody.twoFACode.length > 6) {
        errors.twoFACode = "INVALID_CODE";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}

/** 
 * Coin Withdraw
 * URL: /api/coinWithdraw
 * METHOD : POST
 * BODY: currencyId, amount, receiverAddress, twoFACode
*/
export const coinWithdrawValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body;
    console.log(reqBody,'ererreerererrrer')
    if (isEmpty(reqBody.currencyId)) {
        errors.currencyId = "REQUIRED";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.currencyId)) {
        errors.currencyId = "Invalid currency id";
    }

    if (isEmpty(reqBody.receiverAddress)) {
        errors.receiverAddress = "REQUIRED";
    }
    let currencyData ;
    if(reqBody.currency=="MUDRA"){
        currencyData ="Eth"
    }else{
        currencyData =reqBody.currency
    }
    // var valid = WAValidator.validate(reqBody.receiverAddress, currencyData);
    // if(!valid)
    //     errors.receiverAddress = 'Address INVALID';

    if (isEmpty(reqBody.amount)) {
        errors.amount = "REQUIRED";
    } else if (isNaN(reqBody.amount)) {
        errors.amount = "ALLOW_NUMERIC";
    }

    if (isEmpty(reqBody.twoFACode)) {
        errors.twoFACode = "REQUIRED";
    } else if (isNaN(reqBody.twoFACode) || reqBody.twoFACode.length > 6) {
        errors.twoFACode = "INVALID_CODE";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}

/** 
 * User Withdraw
 * URL: /api/fiatWithdraw
 * METHOD : PATCH
 * BODY: token
*/
export const tokenValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.token)) {
        errors.token = "REQUIRED";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "message": errors.token })
    }

    return next();
}

/** 
 * Sent Deposit Request To Admin
 * URL: /api/fiatDeposit
 * METHOD : POST
 * BODY : userAssetId, amount, image
*/
export const depositReqtValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.userAssetId)) {
        errors.userAssetId = "User Asset field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.userAssetId)) {
        errors.userAssetId = "Invalid userAssetId";
    }

    if (isEmpty(reqBody.amount)) {
        errors.amount = "amount field is required";
    } else if (isNaN(reqBody.amount)) {
        errors.amount = "amount field is required";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }
    return next();
}

/** 
 * Admin Approved Fiat Deposit Request
 * URL: /adminapi/fiatDeposit/approve
 * METHOD : POST
 * BODY : transactionId, amount
*/
export const fiatDepositApproveValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.transactionId)) {
        errors.transactionId = "User Asset field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.transactionId)) {
        errors.transactionId = "Invalid transactionId";
    }

    if (isEmpty(reqBody.amount)) {
        errors.amount = "amount field is required";
    } else if (isNaN(reqBody.amount)) {
        errors.amount = "amount field is required";
    }else if (reqBody.amount<=0) {
        errors.amount = "Allow Positive numeric";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }
    return next();
}
export const fiatDepositRejectValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.transactionId)) {
        errors.transactionId = "User Asset field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.transactionId)) {
        errors.transactionId = "Invalid transactionId";
    }

    // if (isEmpty(reqBody.amount)) {
    //     errors.amount = "amount field is required";
    // } else if (isNaN(reqBody.amount)) {
    //     errors.amount = "amount field is required";
    // }
    if (isEmpty(reqBody.message)) {
        errors.message = "Reason field is required";
    } 

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }
    return next();
}

/** 
 * Wallet Transfer
 * URL: /api/walletTransfer
 * METHOD : POST
 * BODY : fromType, toType, userAssetId, amount
*/
export const walletTransferValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.userAssetId)) {
        errors.userAssetId = "REQUIRED";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.userAssetId)) {
        errors.userAssetId = "REQUIRED";
    }

    if (isEmpty(reqBody.toType)) {
        errors.toType = "REQUIRED"
    } else if (!['spot', 'derivative', 'p2p'].includes(reqBody.toType)) {
        errors.toType = "INVALID_WALLET_TYPE"
    } else if (reqBody.fromType == reqBody.toType) {
        errors.toType = "WALLET_MIS_MATCH"
    }

    if (isEmpty(reqBody.amount)) {
        errors.amount = "Amount field is required";
    } else if (isNaN(reqBody.amount)) {
        errors.amount = "Amount field is required";
    }else if (reqBody.amount<=0) {
        errors.amount = "Amount must be greater than zero";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }
    return next();
}