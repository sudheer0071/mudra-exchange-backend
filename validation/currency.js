const Validator = require("validator");
const isEmpty = require("is-empty");
//module.exports = function validateAddCurrencyInput(data) {
    export const addCurencyValidate = (req, res, next) =>{
    //let errors = {};
     data.currencyName = !isEmpty(data.currencyName) ? data.currencyName : "";
     data.currencySymbol = !isEmpty(data.currencySymbol) ? data.currencySymbol : "";
     data.currencyType =!isEmpty(data.currencyType)?data.currencyType:"";
     data.contractaddress =!isEmpty(data.contractaddress)?data.contractaddress:"";
     data.minabi =!isEmpty(data.minabi)?data.minabi:"";
    if (Validator.isEmpty(data.currencyName)) {
        errors.currencyName = "Currency Name field is required";
    }
    if (Validator.isEmpty(data.currencySymbol)) {
        errors.currencySymbol = "Currency Symbol field is required";
    }
    if(Validator.isEmpty(data.currencyType)){
        errors.currencyType = "Select the Currency Type";
    }
    if(data.currencyType=="Token"){
        if(Validator.isEmpty(data.contractaddress)){
            errors.contractaddress = "Enter the Contract Address";
        }  
        if(Validator.isEmpty(data.minabi)){
            errors.minabi = "Enter the Min ABI";
        }  
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
