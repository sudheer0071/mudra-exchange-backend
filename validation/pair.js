const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validateUpdatepairInput(data) {
    let errors = {};
    data.maxquantity = !isEmpty(data.maxquantity) ? data.maxquantity : "";
    data.minquantity = !isEmpty(data.minquantity) ? data.minquantity : "";
    data.second_currency = !isEmpty(data.second_currency) ? data.second_currency : "";
    data.first_currency = !isEmpty(data.first_currency) ? data.first_currency : "";
    data.maker_rebate = !isEmpty(data.maker_rebate) ? data.maker_rebate : "";
    data.taker_fees = !isEmpty(data.taker_fees) ? data.taker_fees : "";
    data.mark_price = !isEmpty(data.mark_price) ? data.mark_price : "";

   

    if (Validator.isEmpty(data.maxquantity)) {
        errors.maxquantity = "Max quantity field is required";
    }

    if (Validator.isEmpty(data.minquantity)) {
        errors.minquantity = "Min quantity field is required";
    }
    

    if (Validator.isEmpty(data.second_currency)) {
        errors.second_currency = "Second currency field is required";
    }

    if (Validator.isEmpty(data.first_currency)) {
        errors.first_currency = "First currency field is required";
    }
   
     if (Validator.isEmpty(data.maker_rebate)) {
        errors.maker_rebate = "Maker Rebate field is required";
    }
     if (Validator.isEmpty(data.taker_fees)) {
        errors.taker_fees = "Taker fees field is required";
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};




