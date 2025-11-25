// const Validator = require("validator");
const isEmpty = require("../lib/isEmpty1");
// const isEmpty = value =>
//     value === undefined ||
//     value === null ||
//     (typeof value === 'object' && Object.keys(value).length === 0) ||
//     (typeof value === 'string' && value.trim().length === 0);


module.exports = function validateLaunchpadInput(data,file,type) {
    // console.log("data!!!!!!!",data)
    let errors = {};
    // data.tokenName         = !isEmpty(data.tokenName) ? data.tokenName : "";
    // data.symbol            = !isEmpty(data.symbol) ? data.symbol : "";
    // data.availableCurrency = !isEmpty(data.availableCurrency) ? data.availableCurrency : "";   
    // data.price             = !isEmpty(data.price) ? data.price : "";   
    // data.minAmt            = !isEmpty(data.minAmt) ? data.minAmt : "";   
    // data.discount          = !isEmpty(data.discount) ? data.discount : "";   
    // data.availableSale     = !isEmpty(data.availableSale) ? data.availableSale : "";   
    // data.maxSupply         = !isEmpty(data.maxSupply) ? data.maxSupply : "";   
    // data.industry          = !isEmpty(data.industry) ? data.industry : "";   
    // data.website           = !isEmpty(data.website) ? data.website : "";   
    // data.content           = !isEmpty(data.content) ? data.content : "";   
    // data.image             = !isEmpty(data.image) ? data.image : "";   
    // data.startDate         = !isEmpty(data.startDate) ? data.startDate : "";   
    // data.endDate           = !isEmpty(data.endDate) ? data.endDate : "";   
    
    let allowedExtension = ['jpeg', 'jpg', 'png'];
    let allowedFileExtension = ['pdf', 'odt', 'doc'];

    if (isEmpty(data.tokenName)) {
        errors.tokenName = "Token Name field is required";
    }

    // if (isEmpty(data.tokenType)) {
    //     errors.tokenType = "Token Type field is required";
    // }

    if (isEmpty(data.symbol)) {
        errors.symbol = "Token Symbol field is required";
    }
    
    if (isEmpty(data.availableCurrency)) {
        errors.availableCurrency = "Available Currency field is required";
    }

    if (isEmpty(data.price)) {
        errors.price = "Token Launch Price field is required";
    }
    if (isEmpty(data.minAmt)) {
        errors.minAmt = "Minimum Purchase Amount field is required";
    }
    if (isEmpty(data.discount) || data.discount=="null") {
        errors.discount = "Discount field is required";
    }
    if (isEmpty(data.availableSale)) {
        errors.availableSale = "Token Available to Sale field is required";
    }
    if (isEmpty(data.maxSupply)) {
        errors.maxSupply = "Token Max Supply";
    }
    if (isEmpty(data.industry)) {
        errors.industry = "Industry field is required";
    }
    if (isEmpty(data.website)) {
        errors.website = "Website field is required";
    }
    if (isEmpty(data.content)) {
        errors.content = "Content field is required";
    }
    if (isEmpty(data.startDate) || data.startDate=="null") {
        errors.startDate = "Start Date field is required";
    }
    if (isEmpty(data.endDate) || data.endDate=="null") {
        errors.endDate = "End Date field is required";
    }

    if(type=="add"){
        if (isEmpty(file.image && file.image[0])) {
            errors.image = "Image field is required";
        }else{
         let type = file.image[0].mimetype.split('/')[1]
         if(!allowedExtension.includes(type)){
            errors.image = "Please Choose with the known image types jpg, jpeg or png.";
         }
        }

        if (isEmpty(file.whitePaper && file.whitePaper[0])) {
            errors.whitePaper = "White Paper field is required";
        }else{
         let type = file.whitePaper[0].mimetype.split('/')[1]
         if(!allowedFileExtension.includes(type)){
            errors.whitePaper = "Please Choose with the known image types pdf,odt,doc.";
         }
        }
    }

    if(type=="edit"){
      if (!isEmpty(file) && !isEmpty(file.image) && !isEmpty(file.image[0])) {  
         let type = file.image[0].mimetype.split('/')[1]
         if(!allowedExtension.includes(type)){
            errors.image = "Please Choose with the known image types jpg, jpeg or png.";
         }
       }
      
      if (!isEmpty(file) && !isEmpty(file.whitePaper) && !isEmpty(file.whitePaper[0])) { 
         let type = file.whitePaper[0].mimetype.split('/')[1]
         if(!allowedFileExtension.includes(type)){
            errors.whitePaper = "Please Choose with the known image types pdf,odt,doc.";
         }
      }  
    }
    //   if (Validator.isEmpty(data.file1)) {
    //     errors.file1 = "Token Icon field is required";
    // }

    return {
        errors,
        isValid: isEmpty(errors)
    };
};




