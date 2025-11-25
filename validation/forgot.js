const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateForgotInput(data) {
    let errors = {};
    if(typeof data.email != 'undefined')
    {
        data.email = !isEmpty(data.email) ? data.email : "";
        if (Validator.isEmpty(data.email)) {
            errors.email = "Email field is required";
        } else if (!Validator.isEmail(data.email)) {
            errors.email = "Email is invalid";
        }
    }
    if(typeof data.phone != 'undefined')
    {
        data.phone = !isEmpty(data.phone) ? data.phone : "";
        if (Validator.isEmpty(data.phone)) {
            errors.phone = "Mobile Number is required";
        } 
    }
    if(typeof data.recaptcha != 'undefined')
    {
        data.recaptcha = !isEmpty(data.recaptcha) ? data.recaptcha : "";
        if (Validator.isEmpty(data.recaptcha)) {
            errors.recaptcha = "Recaptcha is required";
        } 
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
