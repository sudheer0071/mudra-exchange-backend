// import package
import mongoose from 'mongoose';

// import lib
import isEmpty from '../lib/isEmpty';

// /**
//  * Order Place
//  * URL : /api/spotOrder
//  * METHOD : POST
//  * BODY :  token
// */
// export const decryptValidate = (req, res, next) => {
//     let errors = {}, reqBody = req.body;

//     if (isEmpty(reqBody.token)) {
//         errors.token = "REQUIRED";
//     }

//     if (!isEmpty(errors)) {
//         return res.status(400).json({ "errors": errors })
//     }

//     return next();
// }

/**
 * Order Place
 * URL : /api/postTrade
 * METHOD : POST
 * BODY :  orderType(limit,market,stopLimit,oco)
*/
export const p2pOrderPlaceValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    // if (isEmpty(reqBody.orderType)) {
    //     errors.orderType = "REQUIRED";
    // } else if (!['limit', 'market', 'stop_limit'].includes(reqBody.orderType)) {
    //     errors.orderType = "INVALID_ORDER_TYPE";
    // }


    // if (reqBody.userId=="") {
    //     errors.userId = "REQUIRED"
    // }

    if (reqBody.currencyselected == "") {
        errors.currencyselected = "Please Select a Cyprocurreny would like to trade";
    }
    if (reqBody.posttocurrency == "") {
        errors.posttocurrency = "Please Select a local currency";
    } 
    if (reqBody.minlimit == "") {
        errors.postminlimit = "Please Enter the Min Limit";
    } else if (isNaN(reqBody.minlimit) == true) {
        errors.postminlimit = "Please Enter the Min Limit number only";
    }  
    if (reqBody.maxlimit == "") {
        errors.postmaxlimit = "Please Enter the Max Limit";
    }else if (isNaN(reqBody.maxlimit) == true) {
        errors.postmaxlimit = "Please Enter the Max Limit number only";
    }
    if (reqBody.quantity == "") {
        errors.quantity = "Please Enter the Quantity ";
    } else if (isNaN(reqBody.quantity) == true) {
        errors.quantity = "Please Enter the Quantity as number only";
    } 
    if (reqBody.minlimit != "" && reqBody.maxlimit != "") {
        if (
        parseFloat(reqBody.minlimit) >
        parseFloat(reqBody.maxlimit)
        ) {
            errors.postminlimit = "Please Enter the correct Minimum Value";
        }
    }
    if (reqBody.postprefcurrency=="") {
        errors.postprefcurrency = "Please Select Preferred Payments";
    }
    if (reqBody.postcheckboxaccept!= true){
        errors.postcheckboxaccept = "Please accept the terms and policy";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    // if (reqBody.orderType == 'limit') {
    //     limitOrderValidate(req, res, next)
    // } else if (reqBody.orderType == 'market') {
    //     marketOrderValidate(req, res, next)
    // }
    return next();

}

/**
 * Limit order update
 * URL : /api/spotOrder
 * METHOD : POST
 * BODY : spotPairId, price, quantity, buyorsell
*/
export const p2pOrderUpdateValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (reqBody.price == "") {
        errors.postprice = "Please Enter the price";
    } else if (isNaN(reqBody.price) == true) {
        errors.postprice = "Please Enter the price number only";
    }  else if (parseFloat(reqBody.price) <=0) {
        errors.postprice = "Price must be greater than 0";
    }   
    if (reqBody.quantity == "") {
        errors.quantity = "Please Enter the Min Limit";
    } else if (parseFloat(reqBody.quantity) <=0) {
        errors.quantity = "Quantity must be greater than 0";
    }  
    if (reqBody.minlimit == "") {
        errors.postminlimit = "Please Enter the Min Limit";
    } else if (isNaN(reqBody.minlimit) == true) {
        errors.postminlimit = "Please Enter the Min Limit number only";
    }
    if (reqBody.maxlimit == "") {
        errors.postmaxlimit = "Please Enter the Max Limit";
    }else if (isNaN(reqBody.maxlimit) == true) {
        errors.postmaxlimit = "Please Enter the Max Limit number only";
    }
    if (reqBody.minlimit != "" && reqBody.maxlimit != "") {
        if (
        parseFloat(reqBody.minlimit) >
        parseFloat(reqBody.maxlimit)
        ) {
            errors.postminlimit = "Please Enter the correct Minimum Value";
        }
    }
    if (reqBody.postprefcurrency=="") {
        errors.postprefcurrency = "Please Select Preferred Payments";
    }
    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    // if (reqBody.orderType == 'limit') {
    //     limitOrderValidate(req, res, next)
    // } else if (reqBody.orderType == 'market') {
    //     marketOrderValidate(req, res, next)
    // }
    return next();

}


/**
 * Limit order search
 * URL : /api/search ad
 * METHOD : POST
 * BODY : spotPairId, price, quantity, buyorsell
*/
export const p2pSearchValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body;
    // console.log("reqBody--------------------",reqBody);
     if (reqBody.sc_amount == "") {
        errors.secondamount = "Please Enter the amount";
    } 
    // if (reqBody.price == "") {
    //     errors.postprice = "Please Enter the price";
    // } else if (isNaN(reqBody.price) == true) {
    //     errors.postprice = "Please Enter the price number only";
    // }  
    // if (reqBody.minlimit == "") {
    //     errors.postminlimit = "Please Enter the Min Limit";
    // } else if (isNaN(reqBody.minlimit) == true) {
    //     errors.postminlimit = "Please Enter the Min Limit number only";
    // }  
    // if (reqBody.maxlimit == "") {
    //     errors.postmaxlimit = "Please Enter the Max Limit";
    // }else if (isNaN(reqBody.maxlimit) == true) {
    //     errors.postmaxlimit = "Please Enter the Max Limit number only";
    // }
    // if (reqBody.minlimit != "" && reqBody.maxlimit != "") {
    //     if (
    //     parseFloat(reqBody.minlimit) >
    //     parseFloat(reqBody.maxlimit)
    //     ) {
    //         errors.postminlimit = "Please Enter the correct Minimum Value";
    //     }
    // }
    // if (reqBody.postprefcurrency=="") {
    //     errors.postprefcurrency = "Please Select Preferred Payments";
    // }
    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    // // if (reqBody.orderType == 'limit') {
    // //     limitOrderValidate(req, res, next)
    // // } else if (reqBody.orderType == 'market') {
    // //     marketOrderValidate(req, res, next)
    // // }
    return next();

}