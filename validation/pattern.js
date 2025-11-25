const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validatePatternInput(data,type) {
    let errors = {};

    data.pattern = !isEmpty(data.pattern) ? data.pattern : "";
    data.pattern2 = !isEmpty(data.pattern2) ? data.pattern2 : "";
    if(type!='reset')
    {
      if (data.oldpattern.length==0) {
        errors.oldpattern = "Old Pattern field is required";
      }
    }

    if (data.pattern.length==0) {
        errors.pattern = "Pattern field is required";
    }
    if (data.pattern2.length==0) {
        errors.pattern2 = "Confirm pattern field is required";
    }
    if (!Validator.equals(data.pattern, data.pattern2)) {
        errors.pattern2 = "Patterns must match";
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
