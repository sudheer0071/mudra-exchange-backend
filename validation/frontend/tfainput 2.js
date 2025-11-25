const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validatetfaInput(data,type) {
    let errors = {};
  
   data.secretcode = !isEmpty(data.secretcode) ? data.secretcode : "";
   data.onecode = !isEmpty(data.onecode) ? data.onecode : "";
   data.loginpassword = !isEmpty(data.loginpassword) ? data.loginpassword : "";

    if (Validator.isEmpty(data.loginpassword)) {
        errors.loginpassword = "Login Password field is required";
    }

    // if (data.loginpassword.search(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/) < 0) {
    //    errors.loginpassword = "Your password must contain digit,captial and special character.";
    // }

    if (Validator.isEmpty(data.onecode)) {
        errors.onecode = "Code field is required";
    }

    if (Validator.isEmpty(data.secretcode)) {
        errors.secretcode = "Confirm password field is required";
    }
     
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
