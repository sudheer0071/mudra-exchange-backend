const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateCmsInput(data) {
    let errors = {};
    data.question = !isEmpty(data.question) ? data.question : "";
    data.answer = !isEmpty(data.answer) ? data.answer : "";
    if (Validator.isEmpty(data.question)) {
        errors.question = "Question field is required";
    }
    if (Validator.isEmpty(data.answer)) {
        errors.answer = "Answer field is required";
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
