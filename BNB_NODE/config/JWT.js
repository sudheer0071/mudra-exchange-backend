// import package
import jwt from "jsonwebtoken";
import fs from "fs";

// import lib
import config from ".";

// import lib
import isEmpty from "../lib/isEmpty";

let BNBPrivate = fs.readFileSync(__dirname + "/bnb_private_key.pem");
let BNBPublic = fs.readFileSync(__dirname + "/bnb_public_key.pem");

export const walletServiceJWT = (req, res, next) => {
  try {
    let token = req.headers["authorization"];
    if (isEmpty(token)) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    token = token.replace("Bearer ", "");
    let decoded = jwt.verify(token, BNBPublic);
    if (decoded.id == config.SERVICE.WALLET.ID) {
      return next();
    }
    return res.status(401).json({ status: false, message: "Unauthorized" });
  } catch (err) {
    console.log("-----err", err);
    return res.status(403).json({ status: false, message: "Forbidden Error" });
  }
};

export const walletServSign = (payload) => {
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
