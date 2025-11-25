const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validateAddLaunchcontactInput(data) {
    let errors = {};
    data.name = !isEmpty(data.name) ? data.name : "";
    data.project = !isEmpty(data.project) ? data.project : "";
    data.email = !isEmpty(data.email) ? data.email : "";   

    if (Validator.isEmpty(data.name)) {
        errors.name = "Your Telegram Name field is required";
    }

    if (Validator.isEmpty(data.project)) {
        errors.project = "Your Project Name field is required";
    }
    

    if (Validator.isEmpty(data.email)) {
        errors.email = "Your Email Address field is required";
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };
};




