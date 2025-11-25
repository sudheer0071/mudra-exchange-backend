const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validatemobLoginInput(data) {
    let errors = {};
    data.phone = !isEmpty(data.phone) ? data.phone : "";
    data.mobpassword = !isEmpty(data.mobpassword) ? data.mobpassword : "";
    if (Validator.isEmpty(data.phone)) {
        errors.phone = "Mobile Number is required";
    } 
    if (Validator.isEmpty(data.mobpassword)) {
        errors.mobpassword = "Password field is required";
    }

     data.mobrecaptcha = !isEmpty(data.mobrecaptcha) ? data.mobrecaptcha : "";
     if (Validator.isEmpty(data.mobrecaptcha)) {
    errors.mobrecaptcha = "Recaptcha is required";
    }
    
    return {
        errors,
        isValid: isEmpty(errors)
    };
};