const Validator = require("validator");
const isEmpty = require("is-empty");


module.exports = function validateUpdateAssetInput(data) {
    let errors = {};
    data.first_currency = !isEmpty(data.first_currency) ? data.first_currency : "";
    data.second_currency = !isEmpty(data.second_currency) ? data.second_currency : "";
    data.single_min_limit = !isEmpty(data.single_min_limit) ? data.single_min_limit : "";
    data.Single_max_limit = !isEmpty(data.Single_max_limit) ? data.Single_max_limit : "";
    data.full_min_limit = !isEmpty(data.full_min_limit) ? data.full_min_limit : "";
    data.full_max_limit = !isEmpty(data.full_max_limit) ? data.full_max_limit : "";
    data.trade_fee = !isEmpty(data.trade_fee) ? data.trade_fee : "";


    if (Validator.isEmpty(data.first_currency)) {
        errors.first_currency = "First currency field is required";
    }

    if (Validator.isEmpty(data.second_currency)) {
        errors.second_currency = "Second currency field is required";
    }

    if (Validator.isEmpty(data.single_min_limit)) {
        errors.single_min_limit = "single_min_limit field is required";
    }

    if (Validator.isEmpty(data.single_max_limit)) {
        errors.single_max_limit = "Single_max_limitfield is required";
    }

    if (Validator.isEmpty(data.full_min_limit)) {
        errors.full_min_limit = "full_min_limit field is required";
    }
    if (Validator.isEmpty(data.full_max_limit)) {
        errors.full_max_limit = "full_max_limit field is required";
    }

    if (Validator.isEmpty(data.trade_fee)) {
        errors.trade_fee = "trade_fee field is required";
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};