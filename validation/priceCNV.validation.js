// import package
import mongoose from 'mongoose';

// import lib
import isEmpty from '../lib/isEmpty';

export const priceCNVUpdateValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.priceCNVId)) {
        errors.priceCNVId = "priceCNVId field is required";
    } else if (!mongoose.Types.ObjectId.isValid(reqBody.priceCNVId)) {
        errors.priceCNVId = "Invalid priceCNVId";
    }

    if (isEmpty(reqBody.convertPrice)) {
        errors.convertPrice = "Convert price field is required";
    } else if (isNaN(reqBody.convertPrice)) {
        errors.convertPrice = "Only allow numerice";
    } else if (reqBody.convertPrice <= 0) {
        errors.convertPrice = "Convert price must be greater than 0";
    }



    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}
