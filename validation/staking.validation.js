// import package
import mongoose from 'mongoose';

// import lib
import isEmpty from '../lib/isEmpty';

/** 
 * Add Staking
 * URL : /adminapi/staking
 * METHOD : POST
 * BODY : currencyId, minimumAmount, maximumAmount, redemptionPeriod, type(fixed,flexible), flexibleAPY, flexibleAPY, periodList(days,APY)
*/
export const addStakeValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.currencyId)) {
        errors.currencyId = "Currency id field is required";
    } else if (!(mongoose.Types.ObjectId.isValid(reqBody.currencyId))) {
        errors.currencyId = "Currency id is invalid";
    }

    if (isEmpty(reqBody.minimumAmount)) {
        errors.minimumAmount = "Minimum amount field is required";
    } else if (isNaN(reqBody.minimumAmount)) {
        errors.minimumAmount = "Only allow numeric";
    }
    if (reqBody.minimumAmount <= 0) {
        errors.minimumAmount = "Please enter amount greater than zero";
    }

    if (isEmpty(reqBody.maximumAmount)) {
        errors.maximumAmount = "Maximum amount field is required";
    } else if (isNaN(reqBody.maximumAmount)) {
        errors.maximumAmount = "Only allow numeric";
    }
    if (reqBody.maximumAmount <= 0) {
        errors.maximumAmount = "Please enter amount greater than zero";
    } else if (parseFloat(reqBody.maximumAmount) <= parseFloat(reqBody.minimumAmount)) {
        errors.maximumAmount = "Maximum amount must be greater than minimum amount";
    }

    if (isEmpty(reqBody.redemptionPeriod)) {
        errors.redemptionPeriod = "Redemption period field is required";
    } else if (isNaN(reqBody.redemptionPeriod)) {
        errors.redemptionPeriod = "Only allow numeric";
    }
    if (reqBody.redemptionPeriod <= 0) {
        errors.redemptionPeriod = "Please enter amount greater than zero";
    }

    if (isEmpty(reqBody.type)) {
        errors.type = "Type field is required";
    } else if (!Array.isArray(reqBody.type)) {
        errors.type = "Type field is required";
    } else if (!(reqBody.type.some(r => ['fixed', 'flexible'].includes(r)))) {
        errors.type = "Type is invalid";
    }

    if (!isEmpty(reqBody.type) && reqBody.type.some(r => ['fixed'].includes(r))) {
        console.log("aaaaaaaaaa",reqBody.periodList);
        if (isEmpty(reqBody.periodList)) {
            errors.periodList = "PeriodList field is required";
        } else if (!Array.isArray(reqBody.periodList)) {
            errors.periodList = "PeriodList field only allow array";
        } else if (reqBody.periodList.length == 0) {
            errors.periodList = "PeriodList array is empty";
        } else if (isEmpty(reqBody.periodList[0].days)) {
            errors.periodList = "PeriodList days field is required";
        } else if (isNaN(reqBody.periodList[0].days)) {
            errors.periodList = "PeriodList days only allow numeric";
        } else if (parseFloat(reqBody.periodList[0].days) <= 0) {
            errors.periodList = "Must be greater than zero";
        } else if (isEmpty(reqBody.periodList[0].APY)) {
            errors.periodList = "PeriodList APY field is required";
        } else if (isNaN(reqBody.periodList[0].APY)) {
            errors.periodList = "PeriodList APY only allow numeric";
        } else if (parseFloat(reqBody.periodList[0].APY) <= 0) {
            errors.periodList = "Must be greater than zero";
        }
        const periodListAPIisNaN = reqBody.periodList.some((num) => isNaN(num.APY));
        if(periodListAPIisNaN)
        errors.periodList = "PeriodList APY only allow numeric";
        const periodListDaysisNaN = reqBody.periodList.some((num) => isNaN(num.days));
        if(periodListDaysisNaN)
        errors.periodList = "PeriodList days only allow numeric";
        
        const periodListAPI = reqBody.periodList.some((num) => num.APY <= 0);
        if(periodListAPI)
        errors.periodList = "Must be greater than zero";
        const periodListDays = reqBody.periodList.some((num) => num.days <= 0);
        if(periodListDays)
        errors.periodList = "Must be greater than zero";
    }

    if (!isEmpty(reqBody.type) && reqBody.type.some(r => ['flexible'].includes(r))) {
        if (isEmpty(reqBody.flexibleAPY)) {
            errors.flexibleAPY = "FlexibleAPY field is required";
        } else if (isNaN(reqBody.flexibleAPY)) {
            errors.flexibleAPY = "Only numbers allowed";
        } else if (reqBody.flexibleAPY <= 0) {
            errors.flexibleAPY = "Must be greater than zero";
        }
        if (isEmpty(reqBody.totalDateForFlexibleEnd)) {
            errors.totalDateForFlexibleEnd = "Total stacking days field is required";
        } else if (isNaN(reqBody.totalDateForFlexibleEnd)) {
            errors.totalDateForFlexibleEnd = "Only numbers allowed";
        } else if (reqBody.totalDateForFlexibleEnd <= 0) {
            errors.totalDateForFlexibleEnd = "Must be greater than zero";
        }
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}

/** 
 * Edit Staking
 * URL : /adminapi/staking
 * METHOD : PUT
 * BODY : stakingId, currencyId, minimumAmount, maximumAmount, redemptionPeriod, type(fixed,flexible), flexibleAPY, flexibleAPY, periodList(days,APY), status
*/
export const editStakeValid = (req, res, next) => {
    let errors = {}, reqBody = req.body;

    if (isEmpty(reqBody.stakingId)) {
        errors.stakingId = "Staking id field is required";
    } else if (!(mongoose.Types.ObjectId.isValid(reqBody.stakingId))) {
        errors.stakingId = "Staking id is invalid";
    }

    if (isEmpty(reqBody.currencyId)) {
        errors.currencyId = "Currency id field is required";
    } else if (!(mongoose.Types.ObjectId.isValid(reqBody.currencyId))) {
        errors.currencyId = "Currency id is invalid";
    }

    if (isEmpty(reqBody.minimumAmount)) {
        errors.minimumAmount = "Minimum amount field is required";
    } else if (isNaN(reqBody.minimumAmount)) {
        errors.minimumAmount = "Only allow numeric";
    }
    if (reqBody.minimumAmount <= 0) {
        errors.minimumAmount = "Please enter amount greater than zero";
    }

    if (isEmpty(reqBody.maximumAmount)) {
        errors.maximumAmount = "Maximum amount field is required";
    } else if (isNaN(reqBody.maximumAmount)) {
        errors.maximumAmount = "Only allow numeric";
    }
    if (reqBody.maximumAmount <= 0) {
        errors.maximumAmount = "Please enter amount greater than zero";
    } else if (parseFloat(reqBody.maximumAmount) <= parseFloat(reqBody.minimumAmount)) {
        errors.maximumAmount = "Maximum amount must be greater than minimum amount";
    }

    if (isEmpty(reqBody.redemptionPeriod)) {
        errors.redemptionPeriod = "Redemption period field is required";
    } else if (isNaN(reqBody.redemptionPeriod)) {
        errors.redemptionPeriod = "Only allow numeric";
    }
    if (reqBody.redemptionPeriod <= 0) {
        errors.redemptionPeriod = "Please enter amount greater than zero";
    }

    if (isEmpty(reqBody.type)) {
        errors.type = "Type field is required";
    } else if (!Array.isArray(reqBody.type)) {
        errors.type = "Type field is required";
    } else if (!(reqBody.type.some(r => ['fixed', 'flexible'].includes(r)))) {
        errors.type = "Type is invalid";
    }

    if (!isEmpty(reqBody.type) && reqBody.type.some(r => ['fixed'].includes(r))) {
        if (isEmpty(reqBody.periodList)) {
            errors.periodList = "PeriodList field is required";
        } else if (!Array.isArray(reqBody.periodList)) {
            errors.periodList = "PeriodList field only allow array";
        } else if (reqBody.periodList.length == 0) {
            errors.periodList = "PeriodList array is empty";
        } else if (isEmpty(reqBody.periodList[0].days)) {
            errors.periodList = "PeriodList days field is required";
        } else if (isNaN(reqBody.periodList[0].days)) {
            errors.periodList = "PeriodList days only allow numeric";
        } else if (parseFloat(reqBody.periodList[0].days) <= 0) {
            errors.periodList = "Must be greater than zero";
        } else if (isEmpty(reqBody.periodList[0].APY)) {
            errors.periodList = "PeriodList APY field is required";
        } else if (isNaN(reqBody.periodList[0].APY)) {
            errors.periodList = "PeriodList APY only allow numeric";
        } else if (parseFloat(reqBody.periodList[0].APY) <= 0) {
            errors.periodList = "Must be greater than zero";
        }
        const periodListAPIisNaN = reqBody.periodList.some((num) => isNaN(num.APY));
        if(periodListAPIisNaN)
        errors.periodList = "PeriodList APY only allow numeric";
        const periodListDaysisNaN = reqBody.periodList.some((num) => isNaN(num.days));
        if(periodListDaysisNaN)
        errors.periodList = "PeriodList days only allow numeric";

        const periodListAPI = reqBody.periodList.some((num) => num.APY <= 0);
        if(periodListAPI)
        errors.periodList = "Must be greater than zero";
        const periodListDays = reqBody.periodList.some((num) => num.days <= 0);
        if(periodListDays)
        errors.periodList = "Must be greater than zero";
    }

    if (!isEmpty(reqBody.type) && reqBody.type.some(r => ['flexible'].includes(r))) {
        if (isEmpty(reqBody.flexibleAPY)) {
            errors.flexibleAPY = "FlexibleAPY field is required";
        } else if (isNaN(reqBody.flexibleAPY)) {
            errors.flexibleAPY = "Only numbers allowed";
        } else if (reqBody.flexibleAPY <= 0) {
            errors.flexibleAPY = "Must be greater than zero";
        }
        if (isEmpty(reqBody.totalDateForFlexibleEnd)) {
            errors.totalDateForFlexibleEnd = "Total stacking days field is required";
        } else if (isNaN(reqBody.totalDateForFlexibleEnd)) {
            errors.totalDateForFlexibleEnd = "Only numbers allowed";
        } else if (reqBody.totalDateForFlexibleEnd <= 0) {
            errors.totalDateForFlexibleEnd = "Must be greater than zero";
        }
    }

    if (isEmpty(reqBody.status)) {
        errors.status = "status field is required";
    } else if (!(['active', 'deactive'].includes(reqBody.status))) {
        errors.status = "Invalid status";
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}
