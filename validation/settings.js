const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateUpdateSettingsInput(data) {
    let errors = {};
    data.email = !isEmpty(data.email) ? data.email : "";
    if (Validator.isEmpty(data.email)) {
        errors.email = "Email field is required";
    } else if (!Validator.isEmail(data.email)) {
        errors.email = "Email is invalid";
    }
    if (Validator.isEmpty(data.contact_person)) {
        errors.contact_person = "Contact Person field is required";
    }
    if (Validator.isEmpty(data.sitename)) {
        errors.sitename = "Sitename field is required";
    }
    if (Validator.isEmpty(data.site_description)) {
        errors.site_description = "Site Description field is required";
    }
    if (Validator.isEmpty(data.address)) {
        errors.address = "Address field is required";
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };
};
