import isEmpty from '../lib/isEmpty';

/** 
 * Add Launchpad
 * URL : /adminapi/add-launchpad
 * METHOD : POST
 * BODY : tokenName, symbol, availableCurrency, price, minAmt, discount, availableSale, maxSupply, industry, website, content, startDate, endDate
 * FILE : image, whitePaper
*/

function convertLocalToUTC(localDate) {
    var localOffset = localDate.getTimezoneOffset() * 60000; // Offset in milliseconds
    var utcTime = localDate.getTime() + localOffset;
    var utcDate = new Date(utcTime);
    return utcDate;
}
export const createLaunchpadValid = (req, res, next) => {

    let errors = {}, reqBody = req.body, file = req.files;

    let allowedExtension = ['jpeg', 'jpg', 'png'];
    let allowedFileExtension = ['pdf', 'odt', 'doc'];
    let nameRegex = /^[a-zA-Z ]+$/;
    let checkSymbole = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

    if (isEmpty(reqBody.tokenName))
        errors.tokenName = "Token Name field is required";
    else if (!nameRegex.test(reqBody.tokenName) || checkSymbole.test(reqBody.tokenName))
        errors.tokenName = "Only Alphabets Allowed";

    if (isEmpty(reqBody.symbol)) {
        errors.symbol = "Token Symbol field is required";
    } else if (!nameRegex.test(reqBody.symbol) || checkSymbole.test(reqBody.symbol))
        errors.symbol = "Only Alphabets Allowed";

    if (isEmpty(reqBody.availableCurrency)) {
        errors.availableCurrency = "Available Currency field is required";
    }

    if (isEmpty(reqBody.price)) {
        errors.price = "Token Launch Price field is required";
    } else if (reqBody.price <= 0) {
        errors.price = "Price must be greater than 0";
    }
    if (isEmpty(reqBody.contractAddress)) {
        errors.contractAddress = "Token contract address field is required";
    }
    if (isEmpty(reqBody.minAmt)) {
        errors.minAmt = "Minimum Purchase Amount field is required";
    }
    if (isEmpty(reqBody.discount) || reqBody.discount == "null") {
        errors.discount = "Discount field is required";
    } else if (isNaN(reqBody.discount) == true) {
        errors.discount = "Please Enter the discount as number only";
    } else if (reqBody.discount < 0) {
        errors.discount = "Please Enter the valid Max Supply";
    }
    // if (isEmpty(reqBody.availableSale)) {
    //     errors.availableSale = "Token Available to Sale field is required";
    // }
    if (reqBody.startDate == "") {
        errors.startDate = "Please Select date";
    } else {
        var date = new Date(reqBody.startDate);
        if (date < new Date())
            errors.startDate = "Please Select date Greater than Current date";
    }

    if (reqBody.endDate == "") {
        errors.endDate = "Please Select date";
    } else {
        var date = new Date(reqBody.endDate);
        if (date < new Date()){
            errors.endDate = "Please Select date Greater than Current date";
        } else {
         var starDate = new Date(reqBody.startDate);
            var endDate = new Date(reqBody.endDate);

            if (endDate <= starDate)
                errors.startDate = "End date must be greater than Start date";
        }
    }

    if (isEmpty(reqBody.maxSupply)) {
        errors.maxSupply = "Token Max Supply";
    }
    if (isEmpty(reqBody.industry)) {
        errors.industry = "Industry field is required";
    }
    if (isEmpty(reqBody.website)) {
        errors.website = "Website field is required";
    }
    if (isEmpty(reqBody.content)) {
        errors.content = "Content field is required";
    }
    if (isEmpty(reqBody.startDate) || reqBody.startDate == "null") {
        errors.startDate = "Start Date field is required";
    }
    if (isEmpty(reqBody.endDate) || reqBody.endDate == "null") {
        errors.endDate = "End Date field is required";
    }
    if (reqBody.price == "" || reqBody.price == 0 || reqBody.price < 0) {
        errors.price = "Please Enter the valid Price ";
    } else if (isNaN(reqBody.price) == true) {
        errors.price = "Please Enter the Price as number only";
    }
    if (reqBody.maxSupply == "" || reqBody.maxSupply == 0 || reqBody.maxSupply < 0) {
        errors.maxSupply = "Please Enter the valid Max Supply";
    } else if (isNaN(reqBody.maxSupply) == true) {
        errors.maxSupply = "Please Enter the Max Supply as number only";
    }
    if (reqBody.decimals == "" || reqBody.decimals == 0 || reqBody.decimals < 0) {
        errors.decimals = "Please Enter the valid decimals ";
    } else if (isNaN(reqBody.decimals) == true) {
        errors.decimals = "Please Enter the decimals as number only";
    }
    if (reqBody.minAmt == "" || reqBody.minAmt == 0 || reqBody.minAmt < 0) {
        errors.minAmt = "Please Enter the valid decimals ";
    } else if (isNaN(reqBody.minAmt) == true) {
        errors.minAmt = "Please Enter the min purchase as number only";
    }
    if (reqBody.type == "add") {
        if (isEmpty(file.image && file.image[0])) {
            errors.image = "Image field is required";
        } else {
            let type = file.image[0].mimetype.split('/')[1]
            if (!allowedExtension.includes(type)) {
                errors.image = "Please Choose with the known image types jpg, jpeg or png.";
            }
        }

        if (isEmpty(file.whitePaper && file.whitePaper[0])) {
            errors.whitePaper = "White Paper field is required";
        } else {
            let type = file.whitePaper[0].mimetype.split('/')[1]
            if (!allowedFileExtension.includes(type)) {
                errors.whitePaper = "Please Choose with the known image types pdf,odt,doc.";
            }
        }
    }

    if (reqBody.type == "edit") {
        if (!isEmpty(file) && !isEmpty(file.image) && !isEmpty(file.image[0])) {
            let type = file.image[0].mimetype.split('/')[1]
            if (!allowedExtension.includes(type)) {
                errors.image = "Please Choose with the known image types jpg, jpeg or png.";
            }
        }

        if (!isEmpty(file) && !isEmpty(file.whitePaper) && !isEmpty(file.whitePaper[0])) {
            let type = file.whitePaper[0].mimetype.split('/')[1]
            if (!allowedFileExtension.includes(type)) {
                errors.whitePaper = "Please Choose with the known image types pdf,odt,doc.";
            }
        }
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ 'status': false, 'errors': errors });
    }

    return next();
}

/** 
 * Add Launchpad
 * URL : /adminapi/add-launchpad
 * METHOD : POST
 * BODY : tokenName, symbol, availableCurrency, price, minAmt, discount, availableSale, maxSupply, industry, website, content, startDate, endDate
 * FILE : image, whitePaper
*/

export const newTOEKNREQUESTvalidation = (req, res, next) => {

    let errors = {}, reqBody = req.body, file = req.files;

    let allowedExtension = ['jpeg', 'jpg', 'png'];
    let allowedFileExtension = ['pdf', 'odt', 'doc'];

    if (isEmpty(reqBody.tokenName)) {
        errors.tokenName = "Token Name field is required";
    }

    // if (isEmpty(reqBody.tokenType)) {
    //     errors.tokenType = "Token Type field is required";
    // }

    if (isEmpty(reqBody.symbol)) {
        errors.symbol = "Token Symbol field is required";
    }

    // if (isEmpty(reqBody.availableCurrency)) {
    //     errors.availableCurrency = "Available Currency field is required";
    // }

    if (isEmpty(reqBody.price)) {
        errors.price = "Token Launch Price field is required";
    }

    // if (isEmpty(reqBody.availableSale)) {
    //     errors.availableSale = "Token Available to Sale field is required";
    // }

    if (reqBody.startDate == "") {
        errors.startDate = "Please Select date";
    } else {
        var date = new Date(reqBody.startDate);
        if (date < new Date())
            errors.startDate = "Please Select date Greater than Current date";
    }

    if (reqBody.endDate == "") {
        errors.endDate = "Please Select date";
    } else {
        var date = new Date(reqBody.endDate);
        if (date < new Date())
            errors.endDate = "Please Select date Greater than Current date";
        else {
            var starDate = new Date(reqBody.startDate);
            var endDate = new Date(reqBody.endDate);

            if (endDate <= starDate)
                errors.startDate = "Please Select proper date";
        }
    }


    if (isEmpty(reqBody.maxSupply)) {
        errors.maxSupply = "Token Max Supply";
    }
    if (isEmpty(reqBody.industry)) {
        errors.industry = "Industry field is required";
    }
    if (isEmpty(reqBody.website)) {
        errors.website = "Website field is required";
    }
    if (isEmpty(reqBody.content)) {
        errors.content = "Content field is required";
    }
    if (isEmpty(reqBody.country)) {
        errors.country = "REQUIRED"
    }
    if (isEmpty(reqBody.state)) {
        errors.state = "REQUIRED"
    }
    if (isEmpty(reqBody.city)) {
        errors.city = "REQUIRED"
    }
    if (isEmpty(reqBody.postalCode)) {
        errors.postalCode = "REQUIRED"
    }


    if (isEmpty(reqBody.email)) {
        errors.email = "REQUIRED"
    }
    if (isEmpty(reqBody.industry)) {
        errors.industry = "REQUIRED"
    }
    if (isEmpty(reqBody.website)) {
        errors.website = "REQUIRED"
    }
    if (isEmpty(reqBody.instagramLink)) {
        errors.instagramLink = "REQUIRED"
    }
    if (isEmpty(reqBody.linkedinLink)) {
        errors.linkedinLink = "REQUIRED"
    } if (isEmpty(reqBody.redditLink)) {
        errors.redditLink = "REQUIRED"
    } if (isEmpty(reqBody.telegramLink)) {
        errors.telegramLink = "REQUIRED"
    } if (isEmpty(reqBody.twitterLink)) {
        errors.twitterLink = "REQUIRED"
    } if (isEmpty(reqBody.youtubeLink)) {
        errors.youtubeLink = "REQUIRED"
    } if (isEmpty(reqBody.facebookLink)) {
        errors.facebookLink = "REQUIRED"
    } if (isEmpty(reqBody.tokenName)) {
        errors.tokenName = "REQUIRED"
    } if (isEmpty(reqBody.symbol)) {
        errors.symbol = "REQUIRED"
    } if (isEmpty(reqBody.price)) {
        errors.price = "REQUIRED"
    } if (isEmpty(reqBody.maxSupply)) {
        errors.maxSupply = "REQUIRED"
    } if (isEmpty(reqBody.contractAddress)) {
        errors.contractAddress = "REQUIRED"
    }
    if (isEmpty(reqBody.content)) {
        errors.content = "REQUIRED"
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ 'status': false, 'errors': errors });
    }

    return next();
}

/** 
 * users create-launchpad-order 
 * URL : /api/create-launchpad-order
 * METHOD : POST
 * BODY : price, amount, totalAmount, currencySymbol, launchpadId
*/

export const createLaunchpadOrderValid = (req, res, next) => {

    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.price)) {
        errors.price = 'Price field is required'
    } else if (reqBody.price <= 0) {
        errors.price = 'Price must be greater than zero'
    }

    if (isEmpty(reqBody.amount)) {
        errors.amount = 'Amount field is required'
    } else if (reqBody.amount <= 0) {
        errors.amount = 'Amount must be greater than zero'
    }

    if (isEmpty(reqBody.totalAmount)) {
        errors.total = 'Total field is required'
    } else if (reqBody.totalAmount <= 0) {
        errors.total = 'Total must be greater than zero'
    }

    if (isEmpty(reqBody.currencySymbol)) {
        errors.currencySymbol = 'Currency field is required'
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ 'status': false, 'errors': errors });
    }

    return next();
}