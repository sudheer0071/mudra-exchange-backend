const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateRegisterInput(data,type) {
    let errors = {};
  if(type == 'register'){
     data.email = !isEmpty(data.email) ? data.email : "";
     data.accept = !isEmpty(data.accept) ? data.accept : "";
     data.recaptcha = !isEmpty(data.recaptcha) ? data.recaptcha : "";
   }
   data.password = !isEmpty(data.password) ? data.password : "";
  
     data.password2 = !isEmpty(data.password2) ? data.password2 : "";
   
   if(type == 'register'){
      if (Validator.isEmpty(data.email)) {
          errors.email = "Email field is required";
      } else if (!Validator.isEmail(data.email)) {
          errors.email = "Email is invalid";
      }
      if (Validator.isEmpty(data.accept) || data.accept == "false") {
        errors.accept = "Accept terms and conditions";
      }
      if (Validator.isEmpty(data.recaptcha) || data.recaptcha == "false") {
        errors.recaptcha = "Recaptcha is required";
      }
    }

    if (Validator.isEmpty(data.password)) {
        errors.password = "Password field is required";
    }
    // if (!Validator.isLength(data.password, { min: 8, max: 30 })) {
    //     errors.password = "Password must be at least 8 characters";
    // }
    if (data.password.search(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/) < 0) {
       errors.password = "Your password must contain small and caps letters, special character and number.";
   }
     
        if (Validator.isEmpty(data.password2)) {
            errors.password2 = "Confirm password field is required";
        }
        if (!Validator.equals(data.password, data.password2)) {
            errors.password2 = "Passwords must match";
        }
   
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
