// import package
import CryptoJS from 'crypto-js';

// import lib
import config from '../config';

const crypto = require('crypto')

var secretkey = config.zaaksecretkey;


export const getChecksumString = function(data) {
  var checksumstring = "";
  var checksumsequence = ["amount","bankid","buyerAddress",
        "buyerCity","buyerCountry","buyerEmail","buyerFirstName","buyerLastName","buyerPhoneNumber","buyerPincode",
        "buyerState","currency","debitorcredit","merchantIdentifier","merchantIpAddress","mode","orderId",
        "product1Description","product2Description","product3Description","product4Description",
        "productDescription","productInfo","purpose","returnUrl","shipToAddress","shipToCity","shipToCountry",
        "shipToFirstname","shipToLastname","shipToPhoneNumber","shipToPincode","shipToState","showMobile","txnDate",
        "txnType","zpPayOption"];
  for (var seq in checksumsequence) {
    for (var key in data) {
      if((key.toString()) === checksumsequence[seq]) {
        if(data[key].toString() !== "") {
          checksumstring += key+"="+data[key].toString()+"&";
        }
      }
    }
  }
  return checksumstring;
}

export const getResponseChecksumString = function(data) {
  var checksumstring = "";
  var checksumsequence = ["amount","bank","bankid","cardId",
        "cardScheme","cardToken","cardhashid","doRedirect","orderId",
        "paymentMethod","paymentMode","responseCode","responseDescription",
        "productDescription","product1Description","product2Description",
        "product3Description","product4Description","pgTransId","pgTransTime"];

  for (var seq in checksumsequence) {
    for (var key in data) {
      if((key.toString()) === checksumsequence[seq]) {
        checksumstring += key+"="+data[key].toString()+"&";
      }
    }
  }
  return checksumstring;
}

// export const  calculateChecksum = function(checksumstring) {


//   return CryptoJS.HmacSHA256(checksumstring,secretkey);
// }


export const calculateChecksum =function (checksumstring){


    let sign = crypto.createHmac('sha256', config.zaaksecretkey)
    sign.update(checksumstring)
    return sign = sign.digest('hex')
}