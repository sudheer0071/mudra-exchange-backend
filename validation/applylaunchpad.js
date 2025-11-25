const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validateApplyLaunchpadInput(data) {
    console.log("data!!!!!!!",data)
    let errors = {};
    data.tokenname         = !isEmpty(data.tokenname) ? data.tokenname : "";
    data.symbol            = !isEmpty(data.symbol) ? data.symbol : "";
    data.availablecurrency = !isEmpty(data.availablecurrency) ? data.availablecurrency : "";   
    data.price             = !isEmpty(data.price) ? data.price : "";   
    data.minAmt            = !isEmpty(data.minAmt) ? data.minAmt : "";   
    data.discount          = !isEmpty(data.discount) ? data.discount : "";   
    data.availablesale     = !isEmpty(data.availablesale) ? data.availablesale : "";   
    data.maxsupply         = !isEmpty(data.maxsupply) ? data.maxsupply : "";   
    data.industry          = !isEmpty(data.industry) ? data.industry : "";   
    data.website           = !isEmpty(data.website) ? data.website : "";   
    data.content           = !isEmpty(data.content) ? data.content : "";   
    //data.file1           = !isEmpty(data.file1) ? data.file1 : "";   

    if (Validator.isEmpty(data.tokenname)) {
        errors.tokenname = "Token Name field is required";
    }

    if (Validator.isEmpty(data.symbol)) {
        errors.symbol = "Token Symbol field is required";
    }
    
    if (Validator.isEmpty(data.availablecurrency)) {
        errors.availablecurrency = "Available Currency field is required";
    }

    if (Validator.isEmpty(data.price)) {
        errors.price = "Token Launch Price field is required";
    }
    if (Validator.isEmpty(data.minAmt)) {
        errors.minAmt = "Minimum Purchase Amount field is required";
    }
    if (Validator.isEmpty(data.discount)) {
        errors.discount = "Discount field is required";
    }
    if (Validator.isEmpty(data.availablesale)) {
        errors.availablesale = "Token Available to Sale field is required";
    }
    if (Validator.isEmpty(data.maxsupply)) {
        errors.maxsupply = "Token Max Supply";
    }
    if (Validator.isEmpty(data.industry)) {
        errors.industry = "Industry field is required";
    }
    if (Validator.isEmpty(data.website)) {
        errors.website = "Website field is required";
    }
    if (Validator.isEmpty(data.content)) {
        errors.content = "Content field is required";
    }
    //   if (Validator.isEmpty(data.file1)) {
    //     errors.file1 = "Token Icon field is required";
    // }

    return {
        errors,
        isValid: isEmpty(errors)
    };
};




