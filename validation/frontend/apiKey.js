const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateUpdateUserInput(data,type) {
    let errors = {};
    if(type == 'profile'){
      data.userid = !isEmpty(data.userid) ? data.userid : "";
      data.name = !isEmpty(data.name) ? data.name : "";
      if (Validator.isEmpty(data.userid)) {
        errors.userid = "User ID field is required";
      }
      if (Validator.isEmpty(data.name)) {
        errors.name = "User Name field is required";
      }
    }

    if(type == "currency"){
      data.currency = !isEmpty(data.currency) ? data.currency : "";
     if (Validator.isEmpty(data.currency)) {
      errors.currency = "Please choose any one currency";
     }
    }

    if(type == "password"){
      data.oldpassword = !isEmpty(data.oldpassword) ? data.oldpassword : "";
      data.password = !isEmpty(data.password) ? data.password : "";
      data.password2 = !isEmpty(data.password2) ? data.password2 : "";

      if (Validator.isEmpty(data.oldpassword)) {
          errors.oldpassword = "Old Password field is required";
      }
      if (Validator.isEmpty(data.password)) {
          errors.password = "Password field is required";
      }
      if (Validator.isEmpty(data.password2)) {
          errors.password2 = "Confirm password field is required";
      }
      if (!Validator.isLength(data.password, { min: 8, max: 30 })) {
          errors.password = "Password must be at least 8 characters";
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
