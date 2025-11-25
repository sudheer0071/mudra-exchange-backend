const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateSupportReplyInput(data) {
    let errors = {};
     data.message_query = !isEmpty(data.message_query) ? data.message_query : "";
    if (Validator.isEmpty(data.message_query)) {
        errors.message_query = "Message field is required";
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
