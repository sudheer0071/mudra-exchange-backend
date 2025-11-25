// import package
import jwt from "jsonwebtoken";
import fs from "fs";

// let ETHPrivate = fs.readFileSync(__dirname + "/eth_private_key.pem");
let BNBPrivate = fs.readFileSync(__dirname + "/bnb_private_key.pem");
// let TRXPrivate = fs.readFileSync(__dirname + "/trx_private_key.pem");

export const walletServSign = (payload) => {
  try {
    let token = jwt.sign(payload, ETHPrivate, {
      algorithm: "RS256",
      noTimestamp: true,
      expiresIn: "3m",
    });
    return {
      status: true,
      token: `Bearer ${token}`,
    };
  } catch (err) {
    return {
      status: false,
    };
  }
};

export const bnbServSign = (payload) => {
  try {
    let token = jwt.sign(payload, BNBPrivate, {
      algorithm: "RS256",
      noTimestamp: true,
      expiresIn: "3m",
    });
    return {
      status: true,
      token: `Bearer ${token}`,
    };
  } catch (err) {
    return {
      status: false,
    };
  }
};

export const trxServSign = (payload) => {
  try {
    let token = jwt.sign(payload, TRXPrivate, {
      algorithm: "RS256",
      noTimestamp: true,
      expiresIn: "3m",
    });
    return {
      status: true,
      token: `Bearer ${token}`,
    };
  } catch (err) {
    return {
      status: false,
    };
  }
};
