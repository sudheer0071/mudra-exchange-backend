const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateTradeInput(data,type) {
  let errors = {};

  data.price = !isEmpty(data.price) ? data.price.toString() : "";
  data.quantity = !isEmpty(data.quantity) ? data.quantity.toString() : "";
  data.pair = !isEmpty(data.pair) ? data.pair : "";
  data.firstcurrency = !isEmpty(data.firstcurrency) ? data.firstcurrency : "";
  data.secondcurrency = !isEmpty(data.secondcurrency) ? data.secondcurrency : "";
  data.buyorsell = !isEmpty(data.buyorsell) ? data.buyorsell : "";
  data.ordertype = !isEmpty(data.ordertype) ? data.ordertype : "";

  if (Validator.isEmpty(data.buyorsell)) {
    errors.buyorsell = "Buy or Sell field is required";
  } else if(data.buyorsell!='buy' && data.buyorsell!='sell'){
    errors.buyorsell = "Buy or Sell field is wrong";
  }
  if (Validator.isEmpty(data.ordertype)) {
    errors.ordertype = "Order type field is required";
  }
  if (Validator.isEmpty(data.price) && data.ordertype!='Market') {
    errors.price = "Price field is required";
  }
  if (Validator.isEmpty(data.quantity) && data.ordertype!='Market') {
    errors.quantity = "Quantity field is required";;
  }
  if (Validator.isEmpty(data.pair) ) {
    errors.pair = "Pair is required";
  }
  if (Validator.isEmpty(data.firstcurrency) ) {
    errors.firstcurrency = "Firstcurrency is required";
  }
  if (Validator.isEmpty(data.secondcurrency) ) {
    errors.secondcurrency = "secondcurrency is required";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
