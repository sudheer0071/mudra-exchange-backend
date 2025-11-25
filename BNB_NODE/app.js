import express from "express";
import bodyParser from "body-parser";
import Web3 from "web3";
import cron from "node-cron";
import fs from "fs";
import axios from "axios";
import Common from "@ethereumjs/common";
import { Transaction } from "@ethereumjs/tx";
import fromExponential from "from-exponential";
import { bignumber, multiply } from 'mathjs'
// import config
import config from "./config";
import network from "./config/network.json";
import { walletServiceJWT, walletServSign } from "./config/JWT";
import bep20MinAbi from "./config/bep20MinAbi.json";

// import lib
import isEmpty from "./lib/isEmpty";
import { decryptString } from "./lib/cryptoJS";

import { hset, hgetall, hdel, redisConnection } from "./redis";

let provider = config.WEB3_PROVIDER
let web3 = new Web3(provider);

let depositAddress = [];
let contractAddress = {};
let adminAddress, adminPrivateKey;
let checkContract = false,
  checkUsrDeposit = false;
let runCron = true,
  failWebhookCron = true;

var app = express();
const router = express.Router();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/bnb", router);

let bnbKey = config.BNB.KEY

function convert(n) {
  try {
    var sign = +n < 0 ? "-" : "",
      toStr = n.toString();
    if (!/e/i.test(toStr)) {
      return n;
    }
    var [lead, decimal, pow] = n
      .toString()
      .replace(/^-/, "")
      .replace(/^([0-9]+)(e.*)/, "$1.$2")
      .split(/e|\./);
    return +pow < 0
      ? sign +
      "0." +
      "0".repeat(Math.max(Math.abs(pow) - 1 || 0, 0)) +
      lead +
      decimal
      : sign +
      lead +
      (+pow >= decimal.length
        ? decimal + "0".repeat(Math.max(+pow - decimal.length || 0, 0))
        : decimal.slice(0, +pow) + "." + decimal.slice(+pow));
  } catch (err) {
    return 0;
  }
}

/**
 * Generate new addresss
 * METHOD : POST
 * URL : /getnewaddress
 */
router.get("/getnewaddress", async function (req, res) {
  try {
    let account = await web3.eth.accounts.create();
    depositAddress.push(account.address.toLowerCase());
    return res.status(200).json({ status: true, data: account });
  } catch (err) {
    console.log("---getnewaddress----err ", err);
    return res.status(500).json({ status: false });
  }
});

/**
 * BNB move to Admin
 * METHOD : POST
 * URL : /bnb-move-admin
 * BODY : usrAddress, usrPrivateKey, amount
 */
router.post("/bnb-move-admin", walletServiceJWT, async function (req, res) {
  try {
    let reqBody = req.body;
    console.log("----reqBody---bnb-move-admin", reqBody);
    reqBody.amount = parseFloat(reqBody.amount);

    reqBody.usrPrivateKey = decryptString(reqBody.usrPrivateKey);
    if (reqBody.usrPrivateKey.substring(0, 2) == "0x") {
      reqBody.usrPrivateKey = reqBody.usrPrivateKey.substring(2);
    }

    let transferValue = parseInt(parseFloat(reqBody.amount) * 10 ** 18);

    let curBalWei = await web3.eth.getBalance(reqBody.usrAddress);
    let curBal = web3.utils.fromWei(curBalWei, 'ether');
    curBal = parseInt(parseFloat(curBal) * 10 ** 18);
    console.log('curBal: ', curBal);
    console.log("--transferValue", curBal, transferValue);
    if (parseInt(curBal) < transferValue) {
      transferValue = curBal;
    }

    let getGasPrice = await web3.eth.getGasPrice();
    let txCount = await web3.eth.getTransactionCount(reqBody.usrAddress);
    let gasLimit = await web3.eth.estimateGas({
      from: reqBody.usrAddress,
      nonce: txCount,
      to: adminAddress,
    });
    gasLimit = web3.utils.toHex(gasLimit);
    let fee = web3.utils.toHex(getGasPrice) * gasLimit;
    console.log("---fee", fee, transferValue);

    transferValue = transferValue - fee;

    console.log("--transferValue---2", transferValue);

    if (transferValue > 0 && curBal > transferValue) {
      let signedTx = await web3.eth.accounts.signTransaction(
        {
          from: reqBody.usrAddress,
          to: adminAddress,
          value: transferValue,
          gas: web3.utils.toHex(gasLimit),
          gasPrice: web3.utils.toHex(getGasPrice),
          chainId: config.WEB3_CHAIN_ID,
        },
        "0x" + reqBody.usrPrivateKey
      );
      let txHash = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );

      if (txHash.status) {
        return res.json({ txHash: txHash, status: true });
      }
      return res.json({ status: false });
    }
    return res.status(200).json({ status: false, message: "All ammount already transfered to admin" });
  } catch (err) {
    console.log("----err---bnb-move-admin ", err);
    return res.status(500).json({ status: false, message: "Error On Server" });
  }
});

/**
 * BEP20 Token move to Admin
 * METHOD : POST
 * URL : /bep20-token-move-admin
 * BODY : usrAddress, usrPrivateKey, amount, contractAddress
 */
router.post("/bep20-token-move-admin", walletServiceJWT, async (req, res) => {
  try {
    let reqBody = req.body;
    console.log("---reqBody bep20-token-move-admin", reqBody);

    reqBody.usrPrivateKey = decryptString(reqBody.usrPrivateKey);
    if (reqBody.usrPrivateKey.substring(0, 2) == "0x") {
      reqBody.usrPrivateKey = reqBody.usrPrivateKey.substring(2);
    }

    let transferValue = parseFloat(reqBody.amount);

    let contract = new web3.eth.Contract(bep20MinAbi, reqBody.contractAddress);
    let conDecimal = await contract.methods.decimals().call();
    let curBal = await contract.methods.balanceOf(reqBody.usrAddress).call();
    console.log("curBal: ", curBal);

    transferValue = parseInt(
      parseFloat(transferValue) * 10 ** parseInt(conDecimal)
    );

    console.log("---curBal bep20-token-move-admin", curBal, transferValue);
    let bal = curBal.toString();
    let trfBal = transferValue.toString();
    if (BigInt(bal) < BigInt(trfBal)) {
      transferValue = curBal;
    }

    if (transferValue > 0) {
      let bal = await web3.eth.getBalance(reqBody.usrAddress);
      console.log("bal: ", bal);
      let txCount = await web3.eth.getTransactionCount(reqBody.usrAddress);

      let getGasPrice = await web3.eth.getGasPrice();
      getGasPrice = parseInt(
        parseInt(getGasPrice) + getGasPrice * (20 / 100)
      ).toString();
      console.log("---------getGasPrice", getGasPrice);
      let transferData = contract.methods
        .transfer(adminAddress, transferValue.toString())
        .encodeABI();
      console.log(
        "---------getGasPrice-----------------",
        transferValue.toString()
      );
      let gasLimit = await web3.eth.estimateGas({
        from: reqBody.usrAddress,
        nonce: txCount,
        to: reqBody.contractAddress,
        data: transferData,
      });
      console.log("gasLimit------------------: ", gasLimit);
      gasLimit = web3.utils.toHex(gasLimit);
      console.log("gasLimit------------------2: ", gasLimit);

      let fee = web3.utils.toHex(getGasPrice) * gasLimit;
      console.log("fee: ", fee);

      if (parseInt(fee) > parseInt(bal)) {
        let { status } = await gasFeeSendToUsr({
          usrAddress: reqBody.usrAddress,
          fee: parseInt(parseInt(parseInt(fee) - parseInt(bal))),
        });
        if (status) {
          let sentTokenData = await sendTokenToAdmin({
            amount: transferValue,
            usrAddress: reqBody.usrAddress,
            usrPrivateKey: reqBody.usrPrivateKey,
            contractAddress: reqBody.contractAddress,
            txCount,
            gasLimit,
            getGasPrice,
            decimal: conDecimal,
            contract,
          });
          if (sentTokenData && sentTokenData.status) {
            return res
              .status(200)
              .json({ status: true, data: sentTokenData.data });
          } else {
            return res
              .status(400)
              .json({ status: false, message: sentTokenData.message });
          }
        }
      } else {
        let sentTokenData = await sendTokenToAdmin({
          amount: transferValue,
          usrAddress: reqBody.usrAddress,
          usrPrivateKey: reqBody.usrPrivateKey,
          contractAddress: reqBody.contractAddress,
          txCount,
          gasLimit,
          getGasPrice,
          decimal: conDecimal,
          contract,
        });
        if (sentTokenData && sentTokenData.status) {
          return res
            .status(200)
            .json({ status: true, data: sentTokenData.data });
        } else {
          return res
            .status(400)
            .json({ status: false, message: sentTokenData.message });
        }
      }
    } else {
      console.log("BNB tokenMovetoAdmin no balance");
      return res
        .status(400)
        .json({ status: false, message: "There is No Token Deposit" });
    }
  } catch (err) {
    console.log("BNB tokenMovetoAdmin", err);
    return res.status(500).json({ status: false, message: "Error On Server" });
  }
});

const gasFeeSendToUsr = async ({ usrAddress, fee }) => {
  try {
    let bal = await web3.eth.getBalance(adminAddress);
    if (bal < fee) {
      console.log("no balance");
      return { status: false, message: "Insuffient BNB balance" };
    }
    let getGasPrice = await web3.eth.getGasPrice();
    getGasPrice = parseInt(
      parseInt(getGasPrice) + getGasPrice * (10 / 100)
    ).toString();
    let gaslimit = web3.utils.toHex(21000);

    let signedTx = await web3.eth.accounts.signTransaction(
      {
        from: adminAddress.toString(),
        to: usrAddress.toString(),
        value: fee,
        gas: web3.utils.toHex(gaslimit),
        gasPrice: getGasPrice,
        chainId: config.WEB3_CHAIN_ID,
      },
      "0x" + adminPrivateKey
    );
    let txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return {
      status: true,
      data: txHash,
      message: "Withdraw successfully",
    };
  } catch (err) {
    console.log("bnbMoveToUser", err);
    return {
      status: false,
      message: err.toString(),
    };
  }
};

const sendTokenToAdmin = async ({
  amount,
  usrAddress,
  usrPrivateKey,
  contractAddress,
  gasLimit,
  getGasPrice,
  decimal,
  contract,
}) => {
  try {
    // console.log("---amount", amount);
    // amount = parseFloat(amount) * 10 ** decimal;
    // amount = convert(amount);
    // amount = parseInt(amount).toString();

    console.log("---amount----1", amount);
    console.log("---getGasPrice----1", getGasPrice);
    console.log("---gasLimit----1", gasLimit);
    // amount = web3.utils.toHex(amount);
    // console.log("---amount----1", amount);
    let data = contract.methods
      .transfer(adminAddress, amount.toString())
      .encodeABI();

    console.log("--data----", data);
    console.log("--usrPrivateKey----", usrPrivateKey);
    console.log(
      "--web3.utils.toWei('5', 'gwei'----",
      web3.utils.toWei("5", "gwei")
    );

    let signedTx = await web3.eth.accounts.signTransaction(
      {
        to: contractAddress.toString(),
        from: usrAddress.toString(),
        value: "0", // For token transfers, set the value to '0'
        // gasPrice: web3.utils.toHex(web3.utils.toWei('5', 'gwei')),
        gasPrice: getGasPrice,
        gas: gasLimit,
        // gas: 52281,
        data: data,
        // 52281
        // 21000
      },
      "0x" + usrPrivateKey
      // "0xYourPrivateKey" // Replace with the sender's private key
    );

    console.log("--signedTx", signedTx);

    let txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log("--txHash", txHash);
    return { status: true, data: txHash };
  } catch (err) {
    console.log("sendToken bep20 ", err);
    return { status: false, message: "Error On Occured" };
  }
};

/**
 * BNB move to user
 * METHOD : POST
 * URL : /bnb-move-user
 * BODY : usrAddress, amount
 */
router.post("/bnb-move-user", walletServiceJWT, async (req, res) => {
  try {
    let reqBody = req.body;
    console.log('reqBody:-----------bnb-move-user ', reqBody);
    let transferValue = parseFloat(reqBody.amount);

    let bal = await web3.eth.getBalance(adminAddress);
    console.log('adminAddress: ', adminAddress);
    let getGasPrice = await web3.eth.getGasPrice();
    let txCount = await web3.eth.getTransactionCount(adminAddress);
    let gaslimit = web3.utils.toHex(21000);
    getGasPrice = parseInt(
      parseInt(getGasPrice) + getGasPrice * (10 / 100)
    ).toString();
    // let fee = web3.utils.toHex(getGasPrice) * gaslimit;

    // transferValue = transferValue * 10 ** 18;
    // console.log('transferValue: ', transferValue);
    var decimal = bignumber(10 ** 18)
    var price = bignumber(reqBody.amount)
    transferValue = multiply(price, decimal)
    transferValue = transferValue.toString()
    console.log('bal---', bal, transferValue, bal > transferValue);
    console.log('bal---', typeof bal, typeof transferValue);
    if (Number(bal) > Number(transferValue)) {
      const txObject = {
        nonce: web3.utils.toHex(txCount),
        gasLimit: web3.utils.toHex(gaslimit),
        gasPrice: web3.utils.toHex(getGasPrice),
        to: reqBody.userAddress,
        value: web3.utils.toHex(transferValue),
      };
      const common = await Common.forCustomChain(
        "mainnet",
        {
          name: "bnb",
          networkId: config.WEB3_NETWORK_ID,
          chainId: config.WEB3_CHAIN_ID,
        },
        "petersburg"
      );

      const tx = Transaction.fromTxData(txObject, { common });
      const privateKey = Buffer.from(adminPrivateKey, "hex");
      const signedTx = tx.sign(privateKey);
      const serializedTx = signedTx.serialize();
      const raw1 = "0x" + serializedTx.toString("hex");
      let responseData = await web3.eth.sendSignedTransaction(raw1);

      if (responseData && responseData.status == true) {
        return res.json({
          status: true,
          data: responseData,
          message: "Withdraw successfully",
        });
      } else {
        return res
          .status(500)
          .json({ status: false, message: "Error On Server" });
      }
    } else {
      console.log("no balance");
      return res
        .status(500)
        .json({ status: false, message: "Insuffient ETH balance" });
    }
  } catch (err) {
    console.log(err, "errerrerrerrerrerrerr");
    return res.status(500).json({ status: false, message: "Error On Server" });
  }
});

/**
 * BNB move to user
 * METHOD : POST
 * URL : /bep20-token-move-user
 * BODY : usrAddress, amount, contractAddress
 */
router.post("/bep20-token-move-user", walletServiceJWT, async (req, res) => {
  try {
    let reqBody = req.body;
    console.log("----reqBody----bep20-token-move-user", reqBody);

    let transferValue = parseFloat(reqBody.amount);
    let contract = new web3.eth.Contract(bep20MinAbi, reqBody.contractAddress);
    let conDecimal = await contract.methods.decimals().call();
    let conBal = await contract.methods.balanceOf(adminAddress).call();

    transferValue = parseFloat(transferValue) * 10 ** parseFloat(conDecimal);

    console.log("----conBal----bep20-token-move-user", conBal);

    if (parseFloat(conBal) >= parseFloat(transferValue)) {
      let bal = await web3.eth.getBalance(adminAddress);
      console.log("bal: ", bal);
      let txCount = await web3.eth.getTransactionCount(adminAddress);
      let getGasPrice = await web3.eth.getGasPrice();
      let gaslimit = web3.utils.toHex(100000);
      let fee = web3.utils.toHex(getGasPrice) * gaslimit;
      console.log("fee: ", fee);

      if (bal > fee) {
        let data = contract.methods
          .transfer(
            reqBody.usrAddress,
            fromExponential(transferValue).toString()
          )
          .encodeABI();
        let transactionObject = {
          gasLimit: web3.utils.toHex(100000),
          gasPrice: web3.utils.toHex(getGasPrice),
          data: data,
          nonce: txCount,
          from: adminAddress,
          to: reqBody.contractAddress,
        };

        const common = await Common.forCustomChain(
          "mainnet",
          {
            name: "bnb",
            networkId: config.WEB3_NETWORK_ID,
            chainId: config.WEB3_CHAIN_ID,
          },
          "petersburg"
        );

        const tx = Transaction.fromTxData(transactionObject, {
          common,
        });
        const privateKey = Buffer.from(adminPrivateKey, "hex");
        const signedTx = tx.sign(privateKey);
        const serializedTx = signedTx.serialize();
        const raw1 = "0x" + serializedTx.toString("hex");
        let result = await web3.eth.sendSignedTransaction(raw1);
        console.log("result: ", result);

        return res.status(200).json({
          status: true,
          message: "Withdraw successfully",
          data: result,
        });
      } else {
        return res
          .status(400)
          .json({ status: false, message: "Insuffient Token Balance" });
      }
    } else {
      return res
        .status(500)
        .json({ status: false, message: "Insuffient balance" });
    }
  } catch (err) {
    console.log("\x1b[33m%s\x1b[0m", "Erron on Token Move to User", err);
    return res.status(500).json({ status: false, message: "Error On Server" });
  }
});

/**
 * BNB Deposit CRON
 */
// cron.schedule("*/2 * * * * *", async () => {
//   if (runCron) {
//     return;
//   }
//   runCron = true;
//   try {
//     let txHashs = await web3.eth.getBlock(network.block);
//     console.log("---network", network);
//     if (txHashs != null && !isEmpty(txHashs.hash)) {
//       if (txHashs.transactions != null && txHashs.transactions.length != 0) {
//         txHashList(txHashs.transactions, 0);
//       }
//       network["block"] = network["block"] + 1;
//       fs.writeFileSync("./config/network.json", JSON.stringify(network));
//     }
//   } catch (err) {
//     console.log("Block Error ", network.block, err);
//   }
//   runCron = false;
// });

let isProcessingBlock = false; // Add this at the top with other variables

cron.schedule("* * * * * *", async () => {
  if (isProcessingBlock) {
    return;
  }
  
  isProcessingBlock = true;
  try {
    console.time("test_timer");
    const resp = await axios.get(config.BNB.URL, {
      params: {
        module: "proxy",
        action: "eth_getBlockByNumber",
        tag: `0x${network.block.toString(16)}`,
        boolean: "true",
        apikey: bnbKey,
      },
    });
    console.timeEnd("test_timer");
    const txHashs = await resp.data.result;
    console.log("networknetwork",network,"txHashstxHashs",txHashs?.transactions?.length)
    console.log("---network", network);
    if (txHashs != null && !isEmpty(txHashs.hash)) {
      if (txHashs.transactions != null && txHashs.transactions.length != 0) {
        await txHashList(txHashs.transactions, 0); // Make this await
      }
      network["block"] = network["block"] + 1;
      await fs.promises.writeFile("./config/network.json", JSON.stringify(network));
    }
  } catch (err) {
    console.log("Block processing error:", err);
  } finally {
    isProcessingBlock = false;
  }
});

async function txHashList(txHashs, index) {
  if (isEmpty(txHashs[index])) return;
 await txDetail(txHashs[index]);
 await txHashList(txHashs, index + 1);
}

async function txDetail(txData) {
  try {
    // let txData = await web3.eth.getTransaction(txId);
    if (
      txData != null && 
      txData.to != null &&
      txData.from.toLowerCase() != adminAddress
    ) {
      let contractInfo = contractAddress[txData.to.toLowerCase()];
      if (checkContract == true && !isEmpty(contractInfo)) {
        let decodeData = decodeInputData(txData.input);
        if (
          decodeData.status == true &&
          depositAddress.includes(decodeData.address.toLowerCase())
        ) {
          webhookCall({
            address: decodeData.address,
            amount: decodeData.amount,
            coin: contractInfo,
            txId: txData.hash,
            from: txData.from,
          });
        }
      } else if (
        checkUsrDeposit == true &&
        depositAddress.includes(txData.to.toLowerCase())
      ) {
        webhookCall({
          address: txData.to,
          amount: parseInt(txData.value),
          coin: "BNB",
          txId: txData.hash,
          from: txData.from,
        });
      }
    }
    return true;
  } catch (err) {
    console.log("-----err txDetail --- ", txId, " ---- ", err);
    hset("bnbTrxDetailError", txId, err.toString());
    return false;
  }
}

function decodeInputData(input) {
  try {
    const functionSignature = "transfer(address,uint256)";
    const functionSelector = input.slice(0, 10);
    const parameters = input.slice(10);
    if (functionSelector === web3.utils.sha3(functionSignature).slice(0, 10)) {
      const addressParam = "0x" + parameters.slice(24, 64);
      const uint256Param = web3.utils
        .toBN("0x" + parameters.slice(64))
        .toString();

      return {
        status: true,
        address: addressParam,
        amount: uint256Param,
      };
    } else {
      return {
        status: false,
      };
    }
  } catch (error) {
    console.log("---decodeInputData----err ", err);
    return {
      status: false,
    };
  }
}

/**
 * address, amount
 */
async function webhookCall(reqBody) {
  try {
    let auth = walletServSign({
      id: config.SERVICE.WALLET.ID,
    });
    if (!auth.status) {
      return false;
    }
    console.log("----webhoolcall", reqBody);
    let respData = await axios({
      method: "post",
      headers: {
        Authorization: auth.token,
        "Accept-Encoding": "gzip,deflate,compress",
      },
      url: `${config.SERVICE.WALLET.URL}/api/wallet/bnb-deposit-webhook`,
      data: reqBody,
    });
    return true;
  } catch (err) {
    hset("bnbWebhookFailer", reqBody.txId, reqBody);
    console.log("---webhookCall----err ", err);
    return false;
  }
}

cron.schedule("* * * * *", async () => {
  console.log("----failer webhook cron");
  if (failWebhookCron) {
    return;
  }
  failWebhookCron = true;
  try {
    let records = await hgetall("bnbWebhookFailer");
    if (records != null) {
      for (const key in records) {
        let item = JSON.parse(records[key]);
        if (item) {
          let respStatus = await webhookCall(item);
          console.log("----failer webhook cron --respStatus", respStatus);

          if (respStatus) {
            await hdel("bnbWebhookFailer", key);
          }
        }
      }
    }
  } catch (err) { }

  try {
    let records = await hgetall("bnbTrxDetailError");
    if (records != null) {
      for (const txId in records) {
        // txId
        let txStatus = await txDetail(txId);
        if (txStatus) {
          await hdel("bnbTrxDetailError", txId);
        }
      }
    }
  } catch (err) { }

  failWebhookCron = false;
  console.log("---failWebhookCron----cron----err ", err);
});

/**
 * INFO
 * URL : /Info
 * METHOD : GET
 */
router.get("/Info", async (req, res) => {
  try {
    return res
      .status(200)
      .json({ status: true, depositAddress, contractAddress, adminAddress });
  } catch (err) {
    return res.status(500).json({ status: false });
  }
});

/**
 * INFO
 * URL : /manual-trx
 * METHOD : GET
 */
router.post("/manual-trx", async (req, res) => {
  try {
    let txData = await web3.eth.getTransaction(req.query.txid);
    if (txData) {
      txDetail(req.query.txid);
    }
    return res.status(200).json({ status: true, txData });
  } catch (err) {
    return res.status(500).json({ status: false });
  }
});
/**
 * Contract Detail update
 * URL : /new-contract-Info
 * METHOD : POST
 * BODY : contractAddress, coin
 */
router.post("/new-contract-Info", walletServiceJWT, async (req, res) => {
  try {
    let reqBody = req.body;
    if (isEmpty(reqBody.contractAddress)) {
      return res.status(400).json({ status: false, message: "ADDRESS_REQ" });
    }
    if (isEmpty(reqBody.coin)) {
      return res.status(400).json({ status: false, message: "COIN_REQ" });
    }
    let contract = new web3.eth.Contract(bep20MinAbi, reqBody.contractAddress);
    let decimal = await contract.methods.decimals().call();
    contractAddress[reqBody.contractAddress.toLowerCase()] = reqBody.coin;
    return res.status(200).json({
      status: true,
      message: "Success",
      result: {
        decimal,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: false });
  }
});

router.get("/get-coin-bal", walletServiceJWT, async (req, res) => {
  try {
    let curBal = await web3.eth.getBalance(adminAddress);
    curBal = parseInt(curBal, 10) / 10 ** 18;
    return res.status(200).json({
      status: true,
      message: "Success",
      result: {
        status: true,
        balance: curBal,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: false });
  }
});

router.post("/get-token-bal", walletServiceJWT, async (req, res) => {
  try {
    let reqBody = req.body
    let contract = new web3.eth.Contract(bep20MinAbi, reqBody.contractAddress);
    let conDecimal = await contract.methods.decimals().call();
    let curBal = await contract.methods.balanceOf(adminAddress).call();
    curBal = curBal / 10 ** parseInt(conDecimal);
    console.log('conBal: ', curBal);
    return res.status(200).json({
      status: true,
      message: "Success",
      result: {
        status: true,
        balance: curBal,
      },
    });
  } catch (err) {
    console.log('err:------ ', err);
    return res.status(500).json({ status: false });
  }
});

const initialCall = async () => {
  if (network && isEmpty(network.block)) {
    const latest = await web3.eth.getBlockNumber();
    network["block"] = latest - 2;
    fs.writeFileSync("./config/network.json", JSON.stringify(network));
  }
  try {
    let auth = walletServSign({
      id: config.SERVICE.WALLET.ID,
    });
    if (!auth.status) {
      return false;
    }
    let respData = await axios({
      method: "get",
      headers: {
        Authorization: auth.token,
        "Accept-Encoding": "gzip,deflate,compress",
      },
      url: `${config.SERVICE.WALLET.URL}/api/wallet/bnb-deposit-info`,
    });
    if (respData && respData.data && respData.data.success == true) {
      let respResult = respData.data.result;
      if (respResult) {
        if (respResult.contractList && !isEmpty(respResult.contractList)) {
          checkContract = true;
          contractAddress = respResult.contractList;
        }

        if (
          respResult.depositAddress &&
          Array.isArray(respResult.depositAddress) &&
          respResult.depositAddress.length > 0
        ) {
          checkUsrDeposit = true;
          depositAddress = respResult.depositAddress;
        }

        adminAddress = respResult.adminAddress;
        adminPrivateKey = decryptString(respResult.adminPrivateKey);
        if (adminPrivateKey.substring(0, 2) == "0x") {
          adminPrivateKey = adminPrivateKey.substring(2);
        }
      }
    }
  } catch (err) {
    console.log("errr", err);
    return false;
  }
  return true;
};

(async function () {
  let status = await initialCall();
  console.log("--status", status);
  console.log("----network", network);
  console.log("----depositAddress", depositAddress);
  console.log("----contractAddress", contractAddress);
  console.log("----adminAddress", adminAddress);
  let redisStatus = await redisConnection();
  console.log("----adminAddress", status , redisStatus , checkUsrDeposit , checkContract);
	
    runCron = false;
    failWebhookCron = false;
    app.listen(config.PORT, function () {
      console.log(`Example app listening on port ${config.PORT}!`);
    });
  })();
