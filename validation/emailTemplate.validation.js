// import package
import mongoose from 'mongoose';

// import helpers
import isEmpty from '../lib/isEmpty';


/** 
 * Add Email Template
 * URL: /adminapi/emailTemplate
 * METHOD : POST
 * BODY : identifier, subject, content, langCode, status
*/
export const addTemplateValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body;
   
    if (isEmpty(reqBody.identifier)) {
        errors.identifier = "Identifier field is required";
    }

    if (isEmpty(reqBody.subject)) {
        errors.subject = "Subject field is required";
    }

    if (isEmpty(reqBody.content)) {
        errors.content = "content field is required";
    }

    if (isEmpty(reqBody.langCode)) {
        errors.langCode = "langCode field is required";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}

/** 
 * Update Email Template
 * URL: /adminapi/emailTemplate
 * METHOD : PUT
 * BODY : id, identifier, subject, content, langCode, status
*/
export const editTemplateValidate = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.id)) {
        errors.id = "Language Id field is required";
    } else if (!(mongoose.Types.ObjectId.isValid(reqBody.id))) {
        errors.id = "ID is invalid";
    }

    if (isEmpty(reqBody.identifier)) {
        errors.identifier = "Identifier field is required";
    }

    if (isEmpty(reqBody.subject)) {
        errors.subject = "Subject field is required";
    }

    if (isEmpty(reqBody.content)) {
        errors.content = "content field is required";
    }

    if (isEmpty(reqBody.langCode)) {
        errors.langCode = "langCode field is required";
    }

    if (isEmpty(reqBody.status)) {
        errors.status = "Status field is required";
    } else if (!['active','deactive'.includes(reqBody.status)]) {
        errors.status = "Status type is invalid";
    }
 
    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}