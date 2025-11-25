// import package
import fs from "fs";

// import helpers
import isEmpty from "../lib/isEmpty";
import { removeKycReqFile } from "../lib/removeFile";

/**
 * Update Id Proof
 * URL: /api/kyc/idproof
 * METHOD : PUT
 * BODY : type,proofNumber, frontImage, backImage, selfiImage
 */
export const idProofValidate = (req, res, next) => {
  let errors = {},
    reqBody = req.body,
    reqFile = req.files;

  console.log(reqBody, "reqBodyreqBody");
  console.log(reqFile, "reqFilereqFile");

  if (isEmpty(reqBody.type)) {
    errors.type = "REQUIRED";
  }

  if (isEmpty(reqBody.proofNumber)) {
    errors.proofNumber = "REQUIRED";
  }

  if (isEmpty(reqFile.frontImage)) {
    errors.frontImage = "REQUIRED";
  }

  if (!isEmpty(reqBody.type) && reqBody.type != "passport") {
    if (isEmpty(reqFile.backImage)) {
      errors.backImage = "REQUIRED";
    }
  }

  if (isEmpty(reqFile.selfiImage)) {
    errors.selfiImage = "REQUIRED";
  }

  if (!isEmpty(errors)) {
    removeKycReqFile(reqFile, "id");
    return res.status(400).json({ errors: errors });
  }
  return next();
};

/**
 * Update Address Proof
 * URL: /api/kyc/addressproof
 * METHOD : PUT
 * BODY : type, frontImage
 */
export const addressProofValidate = (req, res, next) => {
  let errors = {},
    reqBody = req.body,
    reqFile = req.files;

  if (isEmpty(reqBody.type)) {
    errors.type = "REQUIRED";
  }

  if (isEmpty(reqFile.frontImage)) {
    errors.frontImage = "REQUIRED";
  }

  if (!isEmpty(errors)) {
    removeKycReqFile(reqFile, "id");
    return res.status(400).json({ errors: errors });
  }
  return next();
};

/**
 * Reject User Kyc Doc's
 * URL: /api/kyc/addressproof
 * METHOD : PUT
 * BODY : userId, formType(idProof,addressProof), reason
 */
export const rejectKycValidate = (req, res, next) => {
  let errors = {},
    reqBody = req.body,
    reqFile = req.files;

  if (isEmpty(reqBody.reason)) {
    errors.reason = "REQUIRED";
  }

  if (!isEmpty(errors)) {
    return res.status(400).json({ errors: errors });
  }
  return next();
};
