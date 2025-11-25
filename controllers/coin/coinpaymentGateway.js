// import package
import coinpayments from "coinpayments";

//client data
// Key Name: Unnamed API Key
// Public Key: 
// Private Key: 

// import lib
import config from "../../config";

var coinPayment = new coinpayments({
  key: config.coinpaymentGateway.PUBLIC_KEY,
  secret: config.coinpaymentGateway.PRIVATE_KEY,
});

export const createAddress = async ({ currencySymbol, emailId, ipnUrl }) => {
  try {
    emailId = "GM-" + emailId;
    ipnUrl = config.SERVER_URL + ipnUrl;
    let respData = await coinPayment.getCallbackAddress({
      currency: currencySymbol,
      label: emailId,
      ipn_url: ipnUrl,
    });
    return {
      address: respData.address,
      privateKey: "",
      alt_tag: respData.dest_tag ? respData.dest_tag : "",
    };
  } catch (err) {
    return {
      address: "",
      privateKey: "",
    };
  }
};

export const XRPcreateAddress = async ({ currencySymbol, emailId, ipnUrl }) => {
  try {
    emailId = "GM-" + emailId;
    ipnUrl = config.SERVER_URL + ipnUrl;
    let respData = await coinPayment.getCallbackAddress({
      currency: currencySymbol,
      label: emailId,
      ipn_url: ipnUrl,
    });

    return {
      address: respData.alt_address,
      privateKey: respData.dest_tag,
      alt_tag: respData.alt_address,
    };
  } catch (err) {
    return {
      address: "",
      privateKey: "",
    };
  }
};

export const createWithdrawal = async ({ currencySymbol, amount, address, dest_tag }) => {
  try {
    let respData = await coinPayment.createWithdrawal({
      amount: parseFloat(amount),
      address,
      currency: currencySymbol,
      dest_tag: dest_tag
    });
    return {
      status: true,
      data: respData,
    };
  } catch (err) {
    console.log("createWithdrawalcreateWithdrawal",err);
    return {
      status: false,
      message: err.toString(),
    };
  }
};
