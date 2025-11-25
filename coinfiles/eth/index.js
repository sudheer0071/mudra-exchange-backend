import Web3 from "web3";
import { Common, Chain } from "@ethereumjs/common";
import { Transaction } from "@ethereumjs/tx";
import bigNumber from "bignumber.js";

// import config
import config from "../../config";

// import lib
import { decryptString } from "../../lib/cryptoJS";

if (config.coinGateway.eth.mode == "live") {
  var web3 = new Web3("https://mainnet.infura.io/v3/919cf7b11415432a8f4bfaff9c88a56d");
  var chain = Chain.Mainnet;
} else {
  
  // testnet
  var web3 = new Web3("https://sepolia.infura.io/v3/02928112faeb432c98b198fe8edaef50");
  var chain = Chain.Sepolia;
}

export const getLatestBlock = async () => {
  try {
    return await web3.eth.getBlockNumber();
  } catch(e) {
    console.log("getLatestBlock",e);
    return 0;
  }
};

export const getNewAddress = async () => {
  try {
    let account = await web3.eth.accounts.create();
    return { status: true, data: account }
  } catch(e) {
    console.log("getNewAddress",e);
    return { status: false }
  }
};

/**
 * ETH DEPOSIT
 * METHOD: POST
 * BODY : privateKey, address
 */
export const amountMoveToAdmin = async (privateKey, address) => {
  try {

    let fromAddress = address;
    let toAddress = config.coinGateway.eth.address;

    if (privateKey.substring(0, 2) == "0x") {
      privateKey = privateKey.substring(2);
    } else {
      privateKey = privateKey;
    }

    let getBalance = await web3.eth.getBalance(fromAddress);
    let balance = web3.utils.fromWei(getBalance, "ether");
    let getGasPrice = await web3.eth.getGasPrice();
    getGasPrice = parseInt(parseInt(getGasPrice) + (getGasPrice * (10/100))).toString();
    let txCount = await web3.eth.getTransactionCount(fromAddress);

    let gasLimit = await web3.eth.estimateGas({ from: fromAddress, nonce: txCount, to: toAddress });
    gasLimit = web3.utils.toHex(gasLimit);

    let fee = web3.utils.toHex(getGasPrice) * gasLimit;
    fee = web3.utils.fromWei(fee.toString(), "ether");

    let amount = (balance - fee - 0.00000000000000001).toFixed(18);

    if (balance >= amount) {
      let updateVal = {};

      let toEther = web3.utils.toWei(amount.toString(), "ether");
      amount = web3.utils.toHex(toEther);

      let txObject = {
        nonce: web3.utils.toHex(txCount),
        gasLimit: gasLimit,
        gasPrice: web3.utils.toHex(getGasPrice),
        to: toAddress.toString(),
        from: fromAddress.toString(),
        value: amount
      };

      let common = new Common({ chain });

      let tx = new Transaction(txObject, { common });
      let bufferPrivateKey = Buffer.from(privateKey, "hex");
      let serializedTx = tx.sign(bufferPrivateKey).serialize().toString('hex');
      let raw1 = "0x" + serializedTx;
      let transactionData = await web3.eth.sendSignedTransaction(raw1);

      return { status: true, txHash: transactionData };
    } else {
      console.log("no balance");
      return { status: false, message: "no balance" };
    }
  } catch (err) {
    console.log(err, "ETH DEPOSIT ERROR");
    return { status: false, message: "Error On Server" };
  }
};

/**
 * ERC_20 DEPOSIT
 * METHOD: POST
 * BODY : userPrivateKey, fromAddress, contractAddress, minAbi, decimals
 */
export const tokenMoveToAdmin = async (userPrivateKey, fromAddress, contractAddress, minAbi, decimals) => {
  try {

    let toAddress = config.coinGateway.eth.address;
    let adminPrivateKey = decryptString(config.coinGateway.eth.privateKey);

    if (userPrivateKey.substring(0, 2) == "0x")
      userPrivateKey = userPrivateKey.substring(2);

    if (adminPrivateKey.substring(0, 2) == "0x")
      adminPrivateKey = adminPrivateKey.substring(2);

    let muldecimal = 10 ** parseFloat(decimals);

    let contract = new web3.eth.Contract(JSON.parse(minAbi), contractAddress);
    let tokenBalance = await contract.methods.balanceOf(fromAddress).call();

    console.log("tokenBalance",tokenBalance);

    if (parseFloat(tokenBalance) > 0) {

      let getBalance = await web3.eth.getBalance(fromAddress);
      let balance = await web3.utils.fromWei(getBalance, "ether");
      let txCount = await web3.eth.getTransactionCount(fromAddress);

      let getGasPrice = await web3.eth.getGasPrice();
      getGasPrice = parseInt(parseInt(getGasPrice) + (getGasPrice * (10/100))).toString();
      let transferData = await contract.methods.transfer(toAddress, tokenBalance.toString()).encodeABI();
      let gasLimit = await web3.eth.estimateGas({ from: fromAddress, nonce: txCount, to: contractAddress, data: transferData });
      gasLimit = web3.utils.toHex(gasLimit);

      let fee = web3.utils.toHex(getGasPrice) * gasLimit;
      fee = web3.utils.fromWei(fee.toString(), "ether");

      console.log("fee",fee);
      console.log("balance",balance);

      if (parseFloat(fee) > parseFloat(balance)) {

        let { status, message, data } = await sendEth(toAddress,fromAddress,adminPrivateKey,fee);

        if (status) {
          let sentTokenData = await sendToken(toAddress,fromAddress,contractAddress,userPrivateKey,txCount,gasLimit,getGasPrice,tokenBalance,contract);

          if (sentTokenData && sentTokenData.status)
            return { status: true, data: sentTokenData.data };
          else
            return { status: false, message: sentTokenData.message };
        }
      } else {
        let sentTokenData = await sendToken(toAddress,fromAddress,contractAddress,userPrivateKey,txCount,gasLimit,getGasPrice,tokenBalance,contract);

        if (sentTokenData && sentTokenData.status)
          return { status: true, txHash: sentTokenData.data };
        else
          return { status: false, message: sentTokenData.message };
      }
    } else {
      return { status: false, message: "Insufficient Token Balance" };
    }
  } catch (err) {
    console.log(err);
    return { status: false, message: "Error On Server" };
  }
};

/**
 * ONLY SEND ETH
 * */
const sendEth = async (fromAddress, toAddress, privateKey, amount) => {
  try {
    let getBalance = await web3.eth.getBalance(fromAddress);
    let balance = web3.utils.fromWei(getBalance, "ether");
    let getGasPrice = await web3.eth.getGasPrice();
    getGasPrice = parseInt(parseInt(getGasPrice) + (getGasPrice * (10/100))).toString();
    let txCount = await web3.eth.getTransactionCount(fromAddress);

    let gaslimit = await web3.utils.toHex(21000);
    if (parseFloat(balance) > parseFloat(amount)) {

      amount = web3.utils.toHex(web3.utils.toWei(parseFloat(amount).toFixed(18).toString(), "ether"));

      let txObject = {
        nonce: web3.utils.toHex(txCount),
        gasLimit: web3.utils.toHex(gaslimit),
        gasPrice: web3.utils.toHex(getGasPrice),
        to: toAddress.toString(),
        from: fromAddress.toString(),
        value: amount,
      };

      let common = new Common({ chain });

      let tx = new Transaction(txObject, { common });
      let bufferPrivateKey = Buffer.from(privateKey, "hex");
      let serializedTx = tx.sign(bufferPrivateKey).serialize().toString('hex');
      let raw1 = "0x" + serializedTx;
      let transactionData = await web3.eth.sendSignedTransaction(raw1);

      return { status: true, data: transactionData, message: "Withdraw successfully" };
    } else {
      console.log("no balance");
      return { status: false, message: "Insufficient ETH balance" };
    }
  } catch (err) {
    console.log("----ERC_20 SEND ETH ERROR :", err);
  }
};

/**
 * ONLY SEND ERC 20
 * */

const sendToken = async (toAddress, fromAddress, contractAddress, privateKey, txCount, gaslimit, getGasPrice, amount, contract) => {
  try {

    let data = contract.methods.transfer(toAddress,amount).encodeABI();
    let transactionObject = {
      gasLimit: gaslimit,
      gasPrice: web3.utils.toHex(getGasPrice),
      data: data,
      nonce: txCount,
      from: fromAddress,
      to: contractAddress,
    };
    
    let common = new Common({ chain });

    let tx = new Transaction(transactionObject, { common });
    let bufferPrivateKey = Buffer.from(privateKey, "hex");
    let serializedTx = tx.sign(bufferPrivateKey).serialize().toString('hex');
    let raw1 = "0x" + serializedTx;
    let transactionData = await web3.eth.sendSignedTransaction(raw1);

    return { status: true, data: transactionData };
  } catch (err) {
    console.log("SEND ERC 20 Token:", err);
    return { status: false, message: "Error On Occured" };
  }
};

/**
 * ETH WITHDRAW
 * METHOD: POST
 * BODY : privateKey, fromAddress, toAddress, amount
 */

export const ethMoveToUser = async (privateKey, fromAddress, toAddress, amount) => {
  try {

    if (privateKey.substring(0, 2) == "0x") {
      privateKey = privateKey.substring(2);
    } else {
      privateKey = privateKey;
    }

    let getBalance = await web3.eth.getBalance(fromAddress);
    let balance = web3.utils.fromWei(getBalance, "ether");
    let getGasPrice = await web3.eth.getGasPrice();
    getGasPrice = parseInt(parseInt(getGasPrice) + (getGasPrice * (10/100))).toString();
    let txCount = await web3.eth.getTransactionCount(fromAddress);

    let gasLimit = await web3.eth.estimateGas({ from: fromAddress, nonce: txCount, to: toAddress });
    gasLimit = web3.utils.toHex(gasLimit);

    if (parseFloat(balance) > parseFloat(amount)) {
      amount = web3.utils.toHex(web3.utils.toWei(amount.toFixed(18).toString(), "ether"));

      let txObject = {
        nonce: web3.utils.toHex(txCount),
        gasLimit: gasLimit,
        gasPrice: web3.utils.toHex(getGasPrice),
        to: toAddress.toString(),
        from: fromAddress.toString(),
        value: amount,
      };

      let common = new Common({ chain });

      let tx = new Transaction(txObject, { common });
      let bufferPrivateKey = Buffer.from(privateKey, "hex");
      let serializedTx = tx.sign(bufferPrivateKey).serialize().toString('hex');
      let raw1 = "0x" + serializedTx;
      let transactionData = await web3.eth.sendSignedTransaction(raw1);

      return {
        status: true,
        data: transactionData,
        message: "Withdraw successfully",
      };
    } else {
      console.log("no balance");
      return { status: false, message: "Insufficient ETH balance" };
    }
  } catch (err) {
    console.log(err, "ETH WITHDRAW ERROR");
    return { status: false, message: "Error On Server" };
  }
};



/**
 * ERC_20 WITHDRAW
 * METHOD: POST
 * BODY : privateKey, fromAddress, toAddress, contractAddress, minAbi, decimals, amount
 */
export const tokenWithdraw = async (privateKey, fromAddress, toAddress, contractAddress, minAbi, decimals, amount) => {

  try {

    if (privateKey.substring(0, 2) == "0x") {
      privateKey = privateKey.substring(2);
    } else {
      privateKey = privateKey;
    }

    let muldecimal = 10 ** parseFloat(decimals);

    let contract = new web3.eth.Contract(JSON.parse(minAbi), contractAddress);
    let tokenBalance = await contract.methods.balanceOf(fromAddress).call();
    tokenBalance = tokenBalance / muldecimal;

    if (parseFloat(tokenBalance) >= parseFloat(amount)) {

      let getBalance = await web3.eth.getBalance(fromAddress);
      let balance = await web3.utils.fromWei(getBalance, "ether");
      let getGasPrice = await web3.eth.getGasPrice();
      getGasPrice = parseInt(parseInt(getGasPrice) + (getGasPrice * (10/100))).toString();
      let txCount = await web3.eth.getTransactionCount(fromAddress);

      let transferAmount = await amountToBN(amount,decimals);
      let transferData = await contract.methods.transfer(toAddress, transferAmount.toString()).encodeABI();
      let gasLimit = await web3.eth.estimateGas({ from: fromAddress, nonce: txCount, to: contractAddress, data: transferData });
      gasLimit = web3.utils.toHex(gasLimit);

      let fee = web3.utils.toHex(getGasPrice) * gasLimit;
      fee = web3.utils.fromWei(fee.toString(), "ether");

      if (parseFloat(balance) > parseFloat(fee)) {
        let sentTokenData = await sendToken(toAddress,fromAddress,contractAddress,privateKey,txCount,gasLimit,getGasPrice,transferAmount,contract);
        if (sentTokenData && sentTokenData.status) {
          return { status: true, data: sentTokenData.data };
        } else {
          return { status: false, message: sentTokenData.message };
        }
      } else {
        return { status: false, message: "Insufficient gas fee" };
      }
    } else {
      return { status: false, message: "Insufficient Token Balance" };
    }
  } catch (err) {
    console.log("tokenWithdrawtokenWithdraw",err);
    return { status: false, message: "Error On Server" };
  }

};

const amountToBN = async (amount, decimal) => {
  return await bigNumber(amount).times(bigNumber(10).pow(decimal)).toString();
}
