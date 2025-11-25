const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateRegisterInput(data,type) {
  console.log(data);
    let errors = {};
  if(type == 'register'){
     data.phone = !isEmpty(data.phone) ? data.phone : "";
     data.mobileaccept = !isEmpty(data.mobileaccept) ? data.mobileaccept : "";
     data.mobrecaptcha = !isEmpty(data.mobrecaptcha) ? data.mobrecaptcha : "";
   }
   data.mobilepassword = !isEmpty(data.mobilepassword) ? data.mobilepassword : "";
   if(type == 'password'){
     data.password2 = !isEmpty(data.password2) ? data.password2 : "";
   }
   if(type == 'register'){
      if (Validator.isEmpty(data.phone)) {
          errors.phone = "Phone number field is required";
        }
      // } else if (!Validator.isEmail(data.email)) {
      //     errors.email = "Email is invalid";
      // }
      if (Validator.isEmpty(data.mobileaccept) || data.mobileaccept == "false") {
        errors.mobileaccept = "Accept terms and conditions";
      }
       if (Validator.isEmpty(data.mobrecaptcha) || data.mobrecaptcha == "false") {
        errors.mobrecaptcha = "Recaptcha is required";
      }
    }

    if (Validator.isEmpty(data.mobilepassword)) {
        errors.mobilepassword = "Password field is required";
    }
    // if (!Validator.isLength(data.password, { min: 8, max: 30 })) {
    //     errors.password = "Password must be at least 8 characters";
    // }
    if (data.mobilepassword.search(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/) < 0) {
       errors.mobilepassword = "Your password must contain small and caps letters, special character and number.";
   }
     if(type == 'password'){
        if (Validator.isEmpty(data.password2)) {
            errors.password2 = "Confirm password field is required";
        }
        if (!Validator.equals(data.password, data.password2)) {
            errors.password2 = "Passwords must match";
        }
     }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
