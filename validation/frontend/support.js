const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateSupportInput(data) {
    let errors = {};
    data.email_add = !isEmpty(data.email_add) ? data.email_add : "";
    data.subject = !isEmpty(data.subject) ? data.subject : "";
    data.description = !isEmpty(data.description) ? data.description : "";
    if (Validator.isEmpty(data.email_add)) {
        errors.email_add = "Email field is required";
    }
    if (Validator.isEmpty(data.subject)) {
        errors.subject = "Subject field is required";
    }
    if (Validator.isEmpty(data.description)) {
        errors.description = "Description field is required";
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
