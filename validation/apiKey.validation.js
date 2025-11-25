// import package
import mongoose from 'mongoose';
import isIp from 'is-ip'

// import lib
import isEmpty, { isBoolean } from '../lib/isEmpty';
import { cnvtBoolean } from '../lib/stringCase'

/** 
 * Create API Management
 * URL : /api/key/manage
 * METHOD : POST
 * BODY : name, ipRestriction, ipList, password
*/
export const newKeyVaild = (req, res, next) => {
    let errors = {}, reqBody = req.body;
    reqBody.ipRestriction = isBoolean(reqBody.ipRestriction) ? cnvtBoolean(reqBody.ipRestriction) : ''

    if (!isBoolean(reqBody.ipRestriction)) {
        errors.ipRestriction = "REQUIRED";
    }

    if (reqBody.ipRestriction == true) {
        if (isEmpty(reqBody.ipList)) {
            errors.ipList = "ipList field is required";
        } else if (reqBody.ipList.split(',') > 4) {
            errors.ipList = "Max limit 4";
        } else {
            for (let ipAdd of reqBody.ipList.split(',')) {
                if (!isIp.v4(ipAdd)) {
                    errors.ipList = 'Invaild ip address'
                    break;
                }
            }
        }
    }

    if (isEmpty(reqBody.password)) {
        errors.password = "REQUIRED";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}