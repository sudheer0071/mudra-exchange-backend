const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateResetInput(data,type) {
    let errors = {};
  
   data.resetpassword = !isEmpty(data.resetpassword) ? data.resetpassword : "";
   data.otpcode = !isEmpty(data.otpcode) ? data.otpcode : "";
   data.password2 = !isEmpty(data.password2) ? data.password2 : "";
    

   if(type == 'register'){
      if (Validator.isEmpty(data.email)) {
          errors.email = "Email field is required";
      } else if (!Validator.isEmail(data.email)) {
          errors.email = "Email is invalid";
      }
      if (Validator.isEmpty(data.accept) || data.accept == "false") {
        errors.accept = "Accept field is required";
      }
    }

    if (Validator.isEmpty(data.resetpassword)) {
        errors.resetpassword = "Password field is required";
    }
    // if (!Validator.isLength(data.resetpassword, { min: 8, max: 30 })) {
    //     errors.resetpassword = "Password must be at least 8 characters";
    // }

    if (data.resetpassword.search(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/) < 0) {
       errors.resetpassword = "Your password must contain digit,captial and special character.";
   }
     
    if (Validator.isEmpty(data.otpcode)) {
        errors.otpcode = "OTP field is required";
    }

    if (Validator.isEmpty(data.password2)) {
        errors.password2 = "Confirm password field is required";
    }
    if (!Validator.equals(data.resetpassword, data.password2)) {
        errors.password2 = "Passwords must match";
    }
     
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
