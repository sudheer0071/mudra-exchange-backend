const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateContactInput(data) {
    let errors = {};

   

    
    data.name = !isEmpty(data.name) ? data.name : "";
    data.email = !isEmpty(data.email) ? data.email : "";
    data.message = !isEmpty(data.message) ? data.message : "";
    if (Validator.isEmpty(data.name)) {
        errors.name = "Name field is required";
    }
    if (Validator.isEmpty(data.email)) {
        errors.email = "Email field is required";
    }
    if (Validator.isEmpty(data.message)) {
        errors.message = "Message field is required";
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
