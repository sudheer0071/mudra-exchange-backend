// import package
import mongoose from 'mongoose';

// import helpers
import isEmpty from '../lib/isEmpty';


/**
 * Admin Login
 * URL : /admin/login
 * METHOD: POST
 * BODY : email, password
*/
export const loginValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body;
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (isEmpty(reqBody.email)) {
        errors.email = "Email field is required";
    } else if (!(emailRegex.test(reqBody.email))) {
        errors.email = "Email is invalid";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}



export const faqValidation = (req, res, next) => {
    let errors = {}, reqBody = req.body;



        if(reqBody.question == ""){
             errors.question = "Please Enter Question";
        }
        if(reqBody.categoryId == ""){
            errors.categoryId = "Please select category";
       }
        if(reqBody.answer == ""){
             errors.answer = "Please Enter Answer";
        }
         if (!isEmpty(errors)) {
            return res.status(400).json({ "errors": errors })
        }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}

/**
 * Email Verification
 * METHOD : POST
 * URL : /api/confirm-mail 
 * BODY : userId
*/
export const confirmMailValidation = (req, res, next) => {
    let
        errors = {},
        reqBody = req.body;

    if (isEmpty(reqBody.userId)) {
        errors.userId = "UserId field is required";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}

/**
 * Forgot Password
 * URL : /adminapi/forgotPassword
 * METHOD: POST
 * BODY : email
*/
export const forgotPwdValidation = (req, res, next) => {
  let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let errors = {};
  let { email } = req.body;

  if (isEmpty(email)) errors.email = "Email field is required";
  else if (!emailRegex.test(email)) errors.email = "Email is invalid";

  if (!isEmpty(errors)) return res.status(400).json({ errors: errors });

  return next();
};

/**
 * Reset Password
 * METHOD : PUT
 * URL : /api/resetPassword
 * BODY : password, confirmPassword, oldPassword
*/
export const resetPasswordValidation = (req, res, next) => {
    let errors = {},
        reqBody = req.body,
        passwordRegex =
            /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*\W)(?=.*\S).{6,18}/g;

    if (isEmpty(reqBody.password)) {
        errors.password = "Password field is required";
    } else if (!passwordRegex.test(reqBody.password)) {
        errors.password =
            "Password should contain atleast one uppercase, atleast one lowercase, atleast one number, atleast one special character and minimum 6 and maximum 18 without space";
    }

    if (isEmpty(reqBody.confirmPassword)) {
        errors.confirmPassword = "Confirm password field is required";
    } else if (
        !isEmpty(reqBody.password) &&
        !isEmpty(reqBody.confirmPassword) &&
        reqBody.password != reqBody.confirmPassword
    ) {
        errors.confirmPassword = "Passwords must match";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ errors: errors });
    }

    return next();
};

/**
 * Reset Password Without Login
 * METHOD : POST
 * URL : /api/resetPassword
 * BODY : password, confirmPassword, authToken
*/
export const resetPwdValidation = (req, res, next) => {
    let
        errors = {},
        reqBody = req.body,
        passwordRegex = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*\W)(?=.*\S).{6,18}/g;


    if (isEmpty(reqBody.authToken)) {
        errors.authToken = "authToken field is required";
    }

    if (isEmpty(reqBody.password)) {
        errors.password = "Password field is required";
    } else if (!(passwordRegex.test(reqBody.password))) {
        errors.password = "Password should contain atleast one uppercase, atleast one lowercase, atleast one number, atleast one special character and minimum 6 and maximum 18 without space";
    }

    if (isEmpty(reqBody.confirmPassword)) {
        errors.confirmPassword = "Confirm password field is required";
    } else if (!isEmpty(reqBody.password) && !isEmpty(reqBody.confirmPassword) && reqBody.password != reqBody.confirmPassword) {
        errors.confirmPassword = "Passwords must match";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();

}


/** 
 * Update User Details
 * URL: /adminapi/updateUser
 * METHOD : PUT
 * BODY : email, phoneNo, phoneCode, userId
*/
export const updateUserValidation = (req, res, next) => {
    let
        errors = {},
        reqBody = req.body;

    let mobileRegex = /^\d+$/;
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (isEmpty(reqBody.email)) {
        errors.email = "Email field is required";
    } else if (!(emailRegex.test(reqBody.email))) {
        errors.email = "Email is invalid";
    }

    if (isEmpty(reqBody.phoneCode)) {
        errors.phoneCode = "Phone code field is required";
    }

    if (isEmpty(reqBody.phoneNo)) {
        errors.phoneNo = "Phone number field is required";
    } else if (!(mobileRegex.test(reqBody.phoneNo))) {
        errors.phoneNo = "Phone number is invalid";
    }


    if (isEmpty(reqBody.userId)) {
        errors.userId = "userId field is required";
    } else if (!(mongoose.Types.ObjectId.isValid(reqBody.bankId))) {
        errors.phoneNo = "userId is invalid";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}

export const updateUserValidationant = (req, res, next) => {
    let
        errors = {},
        reqBody = req.body;

    let mobileRegex = /^\d+$/;
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    // if (isEmpty(reqBody.email)) {
    //     errors.email = "Email field is required";
    // } else if (!(emailRegex.test(reqBody.email))) {
    //     errors.email = "Email is invalid";
    // }

    // if (isEmpty(reqBody.phonenumber)) {
    //     errors.phonenumber = "Phone code field is required";
    // }

    // if (isEmpty(reqBody.phonenumber)) {
    //     errors.phonenumber = "Phone number field is required";
    // } else if (!(mobileRegex.test(reqBody.phonenumber))) {
    //     errors.phonenumber = "Phone number is invalid";
    // }


    if (isEmpty(reqBody.name)) {
        errors.name = "userId field is required";
    } 

    if (!isEmpty(errors)) {
        res.status(400).json({
            success: false,
          
            "errors": errors
          })
        return res.status(400).json({ "errors": errors })
    }

    return next();
}
export const validateemail = (req, res, next) => {
    let
        errors = {},
        reqBody = req.body;

    let mobileRegex = /^\d+$/;
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (isEmpty(reqBody.newemail)) {
        errors.newemail = "Email field is required";
    } else if (!(emailRegex.test(reqBody.email))) {
        errors.newemail = "Email is invalid";
    }
    if(!isEmpty(errors)){
        res.status(400).json({
            success: false,
          
            "errors": errors
          })
    }
    

    return next();
}
/**
 * Reset Password Without Login
 * METHOD : POST
 * URL : /api/resetPassword
 * BODY : password, confirmPassword, authToken
 */
export const resetPwdValidate = (req, res, next) => {
    let errors = {};
    let reqBody = req.body;
    let passwordRegex = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*\W).{6,18}/g;
    console.log("reqqqqqqqqqqq", req.body);
  
    if (isEmpty(reqBody.oldPassword)) {
      errors.oldPassword = "Current password field is required";
    }
  
    if (isEmpty(reqBody.password)) {
      errors.password = "Password field is required";
    } else if (!passwordRegex.test(reqBody.password)) {
      errors.password = "Password should contain at least one uppercase, at least one lowercase, at least one number, at least one special character and minimum 6 character and maximum 18 character";
    }
  
    if (isEmpty(reqBody.confirmPassword)) {
      errors.confirmPassword = "Confirm password field is required";
    } else if (
      !isEmpty(reqBody.password) &&
      !isEmpty(reqBody.confirmPassword) &&
      reqBody.password != reqBody.confirmPassword
    ) {
      errors.confirmPassword = "CONFIRM_PASSWORD_MISMATCH";
    }
  
    if (!isEmpty(errors)) {
      return res.status(400).json({ errors: errors });
    }
  
    return next();
  };
  