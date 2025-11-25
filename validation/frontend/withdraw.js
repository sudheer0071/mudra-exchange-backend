const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateWithdrawInput(data) {
    let errors = {};
     data.receiveraddress = !isEmpty(data.receiveraddress) ? data.receiveraddress : "";
     data.transferamount = !isEmpty(data.transferamount) ? data.transferamount : "";
     data.recaptcha = !isEmpty(data.recaptcha) ? data.recaptcha : "";

      if (Validator.isEmpty(data.receiveraddress) || data.receiveraddress == "false") {
        errors.receiveraddress = "Receiver's Address required";
      }
      if (Validator.isEmpty(data.transferamount) || data.transferamount == "false") {
        errors.transferamount = "Transferamount is required";
      }
      if (Validator.isEmpty(data.finalamount) || data.finalamount == "false") {
        errors.finalamount = "Finalamount is required";
      }
  return {
        errors,
        isValid: isEmpty(errors)
    };
};
