// import package
import { Transaction } from 'ethereumjs-tx'
import Web3 from 'web3'

// import lib
import { encryptString, decryptString } from '../../lib/cryptoJS'
import config from '../../lib/config';


const web3 = new Web3(config.coinGateway.eth.url);
const mode = config.coinGateway.eth.mode;

export const newAddress = (req, res) => {
    try {
        let account = web3.eth.accounts.create();
        account['privateKey'] = encryptString(account.privateKey)
        return res.status(200).json({ result: account })
    }
    catch (err) {
        return res.status(500).json({ 'error': err.toString() })
    }
}

export const getBalance = async (req, res) => {
    try {
        let reqBody = req.body;
        let balance = await web3.eth.getBalance(reqBody.address)
        let amount = await web3.utils.fromWei(balance, "ether");
        let result = {
            balance: amount
        }
        return res.status(200).json({ result })
    }
    catch (err) {
        return res.status(500).json({ 'error': err.toString() })
    }
}

export const fromWei = async (req, res) => {
    try {
        let reqBody = req.body;
        let balance = await web3.utils.fromWei(reqBody.balance, "ether");
        let result = {
            amount: balance
        }
        return res.status(200).json({ result })
    }
    catch (err) {
        return res.status(500).json({ 'error': err.toString() })
    }
}

/** 
 * Method: POST
 * URL
 * BODY: userAddress, userPrivateKey, adminAddress
*/
export const amountMoveToAdmin = async (req, res) => {
    try {
        let reqBody = req.body;
        let balance = await web3.eth.getBalance(reqBody.userAddress)
        let getGasPrice = await web3.eth.getGasPrice();
        let txCount = await web3.eth.getTransactionCount(reqBody.userAddress)
        // let gaslimit = await web3.utils.toHex(21000);
        let gaslimit = await web3.utils.toHex(1000000000000);
        let fee = await web3.utils.toHex(getGasPrice) * gaslimit;
        let amount = balance - fee;
        let userPrivateKey = decryptString(reqBody.userPrivateKey)

        if (amount > 0) {
            const txObject = {
                nonce: web3.utils.toHex(txCount),
                gasLimit: web3.utils.toHex(gaslimit),
                gasPrice: web3.utils.toHex(getGasPrice),
                to: reqBody.adminAddress,
                value: amount,
            };

            const tx = new Transaction(txObject, { chain: mode });
            let userprivatekey1 = Buffer.from(userPrivateKey.substring(2, 66), "hex");
            tx.sign(userprivatekey1);
            const serializedTx = tx.serialize();
            const raw1 = "0x" + serializedTx.toString("hex");
            let txHash = await web3.eth.sendSignedTransaction(raw1)
            let recamount = await web3.utils.fromWei(amount.toString(), "ether");

            let result = {
                txHash: txHash,
                recamount: recamount
            }
            return res.status(200).json({ result })
        } else {
            console.log("No Balance")
            return res.status(500).json({ 'error': "No Balance" })
        }
    }
    catch (err) {
        return res.status(500).json({ 'error': err.toString() })
    }
}

/** 
 * Method: POST
 * URL
 * BODY: userAddress, adminAddress, adminPrivateKey, amount
*/
export const amountMoveToUser = async (req, res) => {
    try {
        let reqBody = req.body;
        let adminPrivateKey = decryptString(reqBody.adminPrivateKey);
        let getBalance = await web3.eth.getBalance(reqBody.adminAddress)
        let balance = web3.utils.fromWei(getBalance, "ether");
        if (balance >= reqBody.amount) {
            let getGasPrice = await web3.eth.getGasPrice();
            let txCount = await web3.eth.getTransactionCount(reqBody.adminAddress);
            let gaslimit = web3.utils.toHex(500000);
            let fee = web3.utils.toHex(getGasPrice) * gaslimit;
            if (reqBody.amount > 0) {
                let amount = web3.utils.toHex(web3.utils.toWei(reqBody.amount.toString(), "ether"));

                const txObject = {
                    nonce: web3.utils.toHex(txCount),
                    gasLimit: web3.utils.toHex(gaslimit),
                    gasPrice: web3.utils.toHex(getGasPrice),
                    to: reqBody.userAddress.toString(),
                    from: reqBody.adminAddress,
                    value: amount
                };

                const tx = new Transaction(txObject, { chain: mode });
                let adminPrivateKey1 = Buffer.from(adminPrivateKey.substring(2, 66), "hex");
                tx.sign(adminPrivateKey1);
                const serializedTx = tx.serialize();
                const raw1 = "0x" + serializedTx.toString("hex");
                let txHash = await web3.eth.sendSignedTransaction(raw1)

                let result = {
                    txHash: txHash
                }
                return res.status(200).json({ result })
            } else {
                res.status(400).json({ 'status': false, 'message': "Invalid Amount" });
            }
        } else {
            res.status(400).json({ 'status': false, 'message': "Insuffient funds" });
        }
    }
    catch (err) {
        return res.status(500).json({ 'message': err.toString() })
    }
}

/** 
 * Method: POST
 * URL
 * BODY: minAbi, contractAddress, adminAddress, adminPrivateKey, amount, userAddress,
*/
export const tokenMoveToUser = async (req, res) => {
    try {
        let reqBody = req.body;
        let adminPrivateKey = decryptString(reqBody.adminPrivateKey);
        let contract = new web3.eth.Contract(reqBody.minAbi, reqBody.contractAddress);
        let tokenbalance = await contract.methods.balanceOf(reqBody.adminAddress).call();

        let muldecimal = 2;
        if (decimals == 1) {
            muldecimal = 10
        } else if (decimals == 2) {
            muldecimal = 100
        }
        else if (decimals == 4) {
            muldecimal = 10000
        }
        else if (decimals == 6) {
            muldecimal = 1000000
        }
        else if (decimals == 8) {
            muldecimal = 100000000
        }

        let amount = parseFloat(reqBody.amount) * parseFloat(muldecimal);

        if (tokenbalance > 0) {
            let getBalance = await web3.eth.getBalance(reqBody.adminAddress);
            let txCount = await web3.eth.getTransactionCount(reqBody.adminAddress);
            let getGasPrice = await web3.eth.getGasPrice()
            let gaslimit = web3.utils.toHex(500000);
            let fee = web3.utils.toHex(getGasPrice) * gaslimit;
            if (getBalance > fee) {
                let tokenAmount = web3.utils.toHex(web3.utils.toWei(amount.toString(), "ether"));
                let data = contract.methods.transfer(reqBody.userAddress, amount).encodeABI();
                let transactionObject = {
                    gasLimit: web3.utils.toHex(500000),
                    gasPrice: web3.utils.toHex(getGasPrice),
                    data: data,
                    nonce: txCount,
                    from: reqBody.adminAddress,
                    to: reqBody.contractAddress,
                };

                const tx = new Tx(transactionObject);
                let adminPrivateKey1 = Buffer.from(adminPrivateKey.substring(2), "hex");
                tx.sign(adminPrivateKey1);
                const serializedTx = tx.serialize();
                const raw1 = "0x" + serializedTx.toString("hex");
                let txHash = await web3.eth.sendSignedTransaction(raw1);
                let result = {
                    txHash: txHash
                }
                return res.status(200).json({ result })

            } else {
                res.status(400).json({ 'status': false, 'message': "No Balance" });
            }

        } else {
            res.status(400).json({ 'status': false, 'message': "There is no new deposit" });
        }
    }
    catch (err) {
        return res.status(500).json({ 'message': err.toString() })
    }
}

// app.post("/ethnode", function (req, res) {
//     var type = req.body.type;
//     if (type == "getnewaddress") {
//         var account = web3.eth.accounts.create();
//         res.json(account);
//     } else if (type == "getbalance") {
//         var ethaddress = req.body.ethaddress;
//         console.log(ethaddress, "ethaddress");
//         web3.eth.getBalance(ethaddress, (err, balance) => {
//             console.log(balance, "balance");
//             var balance = web3.utils.fromWei(balance, "ether");
//             res.json({ result: balance });
//         });
//     } else if (type == "listtransactions") {
//         var argmns = [];
//     } else if (type == "sendtoaddress") {
//         var account1 = req.body.account1;
//         var userprivatekey = req.body.privkey;
//         var cryptoPass = req.body.cryptoPass;
//         var useraddress = req.body.adminaddress;
//         var amount = req.body.amount;

//         web3.eth.getBalance(useraddress, (err, balance) => {
//             var balance = web3.utils.fromWei(balance, "ether");
//             var kjhkhkhkh = amount;
//             if (balance >= kjhkhkhkh) {
//                 web3.eth.getGasPrice(function (err, getGasPrice) {
//                     web3.eth.getTransactionCount(useraddress, (err, txCount) => {
//                         var gaslimit = web3.utils.toHex(500000);
//                         var fee = web3.utils.toHex(getGasPrice) * gaslimit;
//                         // var amount = balance - fee;

//                         if (kjhkhkhkh > 0) {
//                             var updateVal = {};
//                             // var amount = web3.utils.toWei(kjhkhkhkh.toString(),'hex');
//                             var amount = web3.utils.toHex(
//                                 web3.utils.toWei(kjhkhkhkh.toString(), "ether")
//                             );
//                             console.log(amount, "amountamount");
//                             const txObject = {
//                                 nonce: web3.utils.toHex(txCount),
//                                 gasLimit: web3.utils.toHex(gaslimit),
//                                 gasPrice: web3.utils.toHex(getGasPrice),
//                                 to: account1.toString(),
//                                 from: useraddress,
//                                 value: amount,
//                             };

//                             var userprivatekey1 = Buffer.from(userprivatekey, "hex");

//                             const tx = new Tx(txObject, { chain: "mainnet" });
//                             tx.sign(userprivatekey1);
//                             const serializedTx = tx.serialize();
//                             console.log(serializedTx);
//                             const raw1 = "0x" + serializedTx.toString("hex");
//                             console.log(raw1);
//                             web3.eth.sendSignedTransaction(raw1, (err, txHash) => {
//                                 console.log(txHash);
//                                 console.log(err);
//                                 res.json({ status: true, txHash: txHash });
//                             });
//                         } else {
//                             console.log("no balance");
//                         }
//                     });
//                 });
//             } else {
//                 res.json({ status: false, message: "Insuffient funds" });
//             }
//         });
//     } else if (type == "movetoadmin") {
//         var account1 = req.body.adminaddress;
//         var privkey = req.body.privkey;
//         var cryptoPass = req.body.cryptoPass;
//         var useraddress = req.body.useraddress;
//         console.log(useraddress, "useraddress");
//         var decrypted = CryptoJS.AES.decrypt(privkey.toString(), cryptoPass);
//         var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
//         var userprivatekey = decryptedData.substring(2);
//         web3.eth.getBalance(useraddress, (err, balance) => {
//             // console.log(balance,'fsdsdfds')
//             web3.eth.getGasPrice(function (err, getGasPrice) {
//                 web3.eth.getTransactionCount(useraddress, (err, txCount) => {
//                     console.log(getGasPrice, "getGasPrice");
//                     var gaslimit = web3.utils.toHex(21000);
//                     var fee = web3.utils.toHex(getGasPrice) * gaslimit;
//                     // console.log(fee,'fee')
//                     var amount = balance - fee;
//                     // console.log(amount,'amount')
//                     if (amount > 0) {
//                         var updateVal = {};
//                         const txObject = {
//                             nonce: web3.utils.toHex(txCount),
//                             gasLimit: web3.utils.toHex(gaslimit),
//                             gasPrice: web3.utils.toHex(getGasPrice),
//                             to: account1.toString(),

//                             value: amount,
//                         };

//                         // console.log(txObject);
//                         var userprivatekey1 = Buffer.from(userprivatekey, "hex");
//                         const tx = new Tx(txObject);
//                         tx.sign(userprivatekey1);
//                         const serializedTx = tx.serialize();
//                         // console.log(serializedTx);
//                         const raw1 = "0x" + serializedTx.toString("hex");
//                         // console.log(raw1);
//                         web3.eth.sendSignedTransaction(raw1, (err, txHash) => {
//                             console.log(err, "err");
//                             console.log(txHash, "txHash");
//                             var recamount = web3.utils.fromWei(amount.toString(), "ether");
//                             res.json({ txHash: txHash, recamount: recamount });
//                         });
//                     } else {
//                         console.log("no balance");
//                     }
//                 });
//             });
//         });
//     } else if (type == "usdtsendtoaddress") {
//         console.log(req.body, "req.body in sudt send");
//         var account1 = req.body.account1;
//         var privkey = req.body.privkey;
//         var cryptoPass = req.body.cryptoPass;
//         var useraddress = req.body.adminaddress;
//         var tokenamount = req.body.amount;

//         web3.eth.getBalance(useraddress, (err, balance) => {
//             console.log(balance, "fsdsdfds");
//             web3.eth.getGasPrice(function (err, getGasPrice) {
//                 web3.eth.getTransactionCount(useraddress, (err, txCount) => {
//                     console.log(getGasPrice, "getGasPrice");
//                     var gaslimit = web3.utils.toHex(21000);
//                     var fee = web3.utils.toHex(getGasPrice) * gaslimit;
//                     console.log(fee, "fee");
//                     var amount = balance - fee;
//                     console.log(amount, "amount");
//                     if (amount > 0) {
//                         console.log("in balance");
//                         // var tokenamount =  web3.utils.toHex(web3.utils.toWei(req.body.amount.toString(),'ether'));
//                         var tokenamount = parseFloat(req.body.amount) * 1000000;
//                         console.log(tokenamount, "token amount");
//                         var data = contract.methods
//                             .transfer(account1, tokenamount)
//                             .encodeABI();
//                         let transactionObject = {
//                             gasLimit: web3.utils.toHex(200000),
//                             gasPrice: web3.utils.toHex(getGasPrice),
//                             // gasPrice : web3.utils.toHex(web3.utils.toWei('5','gwei')),
//                             data: data,
//                             nonce: web3.utils.toHex(txCount),
//                             from: useraddress,
//                             to: contractAddr,
//                             value: "0x0",
//                             chainId: 1,
//                             // value:web3.utils.toHex(web3.utils.toWei(tokenamount,'ether'))
//                         };
//                         console.log(privkey, "privkeyprivkey");
//                         console.log(transactionObject, "transactionObject");

//                         var userprivatekey1 = Buffer.from(privkey, "hex");

//                         const tx = new Tx(transactionObject, { chain: "mainnet" });

//                         tx.sign(userprivatekey1);
//                         const serializedTx = tx.serialize();
//                         const raw1 = "0x" + serializedTx.toString("hex");

//                         web3.eth
//                             .sendSignedTransaction(raw1)
//                             .once("receipt", function (receipt) {
//                                 console.log(receipt);
//                             })
//                             .then(function (receipt) {
//                                 if (receipt) {
//                                     res.json({
//                                         status: true,
//                                         message: "Succefully transfer",
//                                         txHash: receipt.transactionHash,
//                                     });
//                                 } else {
//                                     console.log("Errorr in sending", err);
//                                 }
//                             });

//                         // web3.eth.accounts.signTransaction(transactionObject, privkey, function (error, signedTx) {
//                         // if (error) {
//                         // console.log(error);
//                         // // handle error
//                         // } else {

//                         // web3.eth.sendSignedTransaction(signedTx.rawTransaction)
//                         // .on('receipt', function (receipt) {
//                         // 	console.log(receipt,'receipt')
//                         // 	res.json({status:true,message:"Succefully transfer",txHash:receipt.blockHash})
//                         //     //do something
//                         // });

//                         // }
//                         // });
//                     } else {
//                         console.log("no balance");
//                     }
//                 });
//             });
//         });
//     } else if (type == "tokenupdation") {
//         var currencyAddress = req.body.currencyAddress;
//         var privKey = req.body.privKey;
//         var cryptoPass = req.body.cryptoPass;
//         var userAddress = req.body.userAddress;
//         var userprivatekey = req.body.userprivatekey;
//         var decimals = req.body.decimals;
//         console.log(req.body, "req.body in token updation");
//         contract.methods
//             .balanceOf(currencyAddress)
//             .call(function (err, tokenbalance) {
//                 console.log(err);
//                 var muldecimal;
//                 if (decimals == 1) {
//                     muldecimal = 10
//                 } else if (decimals == 2) {
//                     muldecimal = 100
//                 }
//                 else if (decimals == 4) {
//                     muldecimal = 10000
//                 }
//                 else if (decimals == 8) {
//                     muldecimal = 100000000
//                 }
//                 else if (decimals == 18) {
//                     muldecimal = 1000000000000000000
//                 }
//                 var realtokenbalance = tokenbalance;
//                 // var tokenbalnce = web3.utils.fromWei(tokenbalance, "ether");

//                 var tokenbalnce = parseFloat(tokenbalance) * muldecimal;

//                 console.log(tokenbalance, "tokenbalnce");
//                 if (tokenbalance > 0) {
//                     var account = currencyAddress;

//                     web3.eth.getBalance(account, (err, balance) => {
//                         console.log(balance, "jhhk");
//                         // return false;
//                         const accountNonce = (
//                             web3.eth.getTransactionCount(userAddress) + 1
//                         ).toString(16);
//                         console.log("in balance");
//                         web3.eth.getTransactionCount(account, (err, txCount) => {
//                             web3.eth.getGasPrice(function (err, getGasPrice) {
//                                 var gaslimit = web3.utils.toHex(500000);
//                                 var fee = web3.utils.toHex(getGasPrice) * gaslimit;
//                                 console.log(fee, "feeeeeee");
//                                 if (balance > fee) {
//                                     var tokenamount = web3.utils.toHex(
//                                         web3.utils.toWei(tokenbalnce.toString(), "ether")
//                                     );
//                                     console.log(tokenamount, "token amount");
//                                     var data = contract.methods
//                                         .transfer(userAddress, tokenamount)
//                                         .encodeABI();
//                                     let transactionObject = {
//                                         gasLimit: web3.utils.toHex(50000),
//                                         gasPrice: web3.utils.toHex(getGasPrice),
//                                         // gasPrice : web3.utils.toHex(web3.utils.toWei('5','gwei')),
//                                         data: data,
//                                         nonce: txCount,
//                                         from: account,
//                                         to: contractAddr,
//                                         // value:web3.utils.toHex(web3.utils.toWei(tokenamount,'ether'))
//                                     };
//                                     var decrypted = CryptoJS.AES.decrypt(
//                                         privKey.toString(),
//                                         cryptoPass
//                                     );
//                                     var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
//                                     var userprivatek = decryptedData.substring(2);
//                                     web3.eth.accounts.signTransaction(
//                                         transactionObject,
//                                         userprivatek,
//                                         function (error, signedTx) {
//                                             if (error) {
//                                                 console.log(error);
//                                                 // handle error
//                                             } else {
//                                                 web3.eth
//                                                     .sendSignedTransaction(signedTx.rawTransaction)
//                                                     .on("receipt", function (receipt) {
//                                                         console.log(receipt, "receipt");
//                                                         res.json({
//                                                             status: true,
//                                                             message: "Succefully transfer",
//                                                             tokenbalnce: realtokenbalance,
//                                                             txHash: receipt.blockHash,
//                                                         });
//                                                         //do something
//                                                     });
//                                             }
//                                         }
//                                     );
//                                 } else {
//                                     console.log("no balance");
//                                     web3.eth.getTransactionCount(userAddress, (err, txCount) => {
//                                         web3.eth.getGasPrice(function (err, getGasPrice) {
//                                             var gaslimit = web3.utils.toHex(50000);
//                                             var fee = web3.utils.toHex(getGasPrice) * gaslimit;

//                                             fee =
//                                                 parseFloat(fee - balance) +
//                                                 parseFloat(web3.utils.toWei("0.00001", "ether"));
//                                             let transactionObject = {
//                                                 gasLimit: web3.utils.toHex(500000),
//                                                 gasPrice: web3.utils.toHex(getGasPrice),
//                                                 nonce: txCount,
//                                                 to: account,
//                                                 value: fee,
//                                             };
//                                             var adminprivkey = req.body.userprivatekey;
//                                             console.log(adminprivkey, "userprivatekey55");
//                                             console.log(req.body.cryptoPass, "cryptoPass");

//                                             var decrypted = CryptoJS.AES.decrypt(
//                                                 adminprivkey.toString(),
//                                                 req.body.cryptoPass
//                                             );
//                                             var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
//                                             var adminprivkey = decryptedData.substring(2);
//                                             console.log(adminprivkey);
//                                             var userprivatekey1 = Buffer.from(adminprivkey, "hex");

//                                             const tx = new Tx(transactionObject, {
//                                                 chain: "mainnet",
//                                             });
//                                             tx.sign(userprivatekey1);
//                                             const serializedTx = tx.serialize();
//                                             console.log(serializedTx);
//                                             const raw1 = "0x" + serializedTx.toString("hex");
//                                             console.log(raw1);

//                                             web3.eth
//                                                 .sendSignedTransaction(raw1)
//                                                 .on("receipt", function (receipt) {
//                                                     console.log(receipt, "receipt");
//                                                 })
//                                                 .then(function (receipt) {
//                                                     console.log("in balance");
//                                                     web3.eth.getTransactionCount(
//                                                         account,
//                                                         (err, txCount) => {
//                                                             web3.eth.getGasPrice(function (err, getGasPrice) {
//                                                                 var tokenamount = web3.utils.toHex(
//                                                                     web3.utils.toWei(
//                                                                         tokenbalnce.toString(),
//                                                                         "ether"
//                                                                     )
//                                                                 );
//                                                                 console.log(tokenamount, "token amount");
//                                                                 var data = contract.methods
//                                                                     .transfer(userAddress, tokenamount)
//                                                                     .encodeABI();
//                                                                 let transactionObject = {
//                                                                     gasLimit: web3.utils.toHex(500000),
//                                                                     gasPrice: web3.utils.toHex(getGasPrice),
//                                                                     // gasPrice : web3.utils.toHex(web3.utils.toWei('5','gwei')),
//                                                                     data: data,
//                                                                     nonce: txCount,
//                                                                     from: account,
//                                                                     to: contractAddr,
//                                                                     // value:web3.utils.toHex(web3.utils.toWei(tokenamount,'ether'))
//                                                                 };
//                                                                 var decrypted = CryptoJS.AES.decrypt(
//                                                                     privKey.toString(),
//                                                                     req.body.cryptoPass
//                                                                 );
//                                                                 var decryptedData = decrypted.toString(
//                                                                     CryptoJS.enc.Utf8
//                                                                 );
//                                                                 var userprivatekey = decryptedData.substring(2);
//                                                                 web3.eth.accounts.signTransaction(
//                                                                     transactionObject,
//                                                                     userprivatekey,
//                                                                     function (error, signedTx) {
//                                                                         if (error) {
//                                                                             console.log(error);
//                                                                             // handle error
//                                                                         } else {
//                                                                             web3.eth
//                                                                                 .sendSignedTransaction(
//                                                                                     signedTx.rawTransaction
//                                                                                 )
//                                                                                 .on("receipt", function (receipt) {
//                                                                                     console.log(receipt, "receipt");
//                                                                                     res.json({
//                                                                                         status: true,
//                                                                                         message: "Succefully transfer",
//                                                                                         tokenbalnce: realtokenbalance,
//                                                                                         txHash: receipt.blockHash,
//                                                                                     });

//                                                                                     //do something
//                                                                                 });
//                                                                         }
//                                                                     }
//                                                                 );
//                                                             });
//                                                         }
//                                                     );
//                                                 });
//                                         });
//                                     });
//                                 }
//                             });
//                         });
//                     });
//                 } else {
//                     console.log("else part");
//                     res.json({ status: false, message: "There is no new deposit" });
//                 }
//             });
//     } else if (type == "tokentoadmin") {
//         // console.log(req.body, "req.body in move token");
//         var curminabi = JSON.parse(req.body.curminabi)
//         var currencyAddress = req.body.currencyAddress;
//         var privKey = req.body.privKey;
//         var cryptoPass = req.body.cryptoPass;
//         var userAddress = req.body.userAddress;
//         var userprivatekey = req.body.userprivatekey;
//         var curcontractaddress = req.body.curcontractaddress;
//         var decimals = req.body.decimals;

//         // var curminabi = req.body.curminabi;
//         let contract = new web3.eth.Contract(curminabi, curcontractaddress);
//         contract.methods
//             .balanceOf(currencyAddress)
//             .call(function (err, tokenbalance) {
//                 console.log(err);
//                 var realtokenbalance = tokenbalance;
//                 var muldecimal = 2;
//                 if (decimals == 1) {
//                     muldecimal = 10
//                 } else if (decimals == 2) {
//                     muldecimal = 100
//                 }
//                 else if (decimals == 4) {
//                     muldecimal = 10000
//                 }
//                 else if (decimals == 6) {
//                     muldecimal = 1000000
//                 }
//                 else if (decimals == 8) {
//                     muldecimal = 100000000
//                 }
//                 console.log("tokenbalance", tokenbalance);
//                 // var tokenbalnce = web3.utils.fromWei(tokenbalance, "ether");

//                 var tokenbalnce = parseFloat(tokenbalance) * parseFloat(muldecimal);
//                 // var tokenbalnce = web3.utils.fromWei(tokenbalance, "ether");
//                 console.log(tokenbalnce, "tokenbalnce");
//                 if (tokenbalance > 0) {
//                     var account = currencyAddress;

//                     web3.eth.getBalance(account, (err, balance) => {
//                         console.log(balance, "jhhk");
//                         // return false;
//                         const accountNonce = (
//                             web3.eth.getTransactionCount(userAddress) + 1
//                         ).toString(16);
//                         console.log("in balance");
//                         web3.eth.getTransactionCount(account, (err, txCount) => {
//                             web3.eth.getGasPrice(function (err, getGasPrice) {
//                                 var gaslimit = web3.utils.toHex(500000);
//                                 var fee = web3.utils.toHex(getGasPrice) * gaslimit;
//                                 console.log(fee, "feeeeeee");
//                                 if (balance > fee) {
//                                     var tokenamount = web3.utils.toHex(
//                                         web3.utils.toWei(tokenbalnce.toString(), "ether")
//                                     );
//                                     console.log(tokenamount, "token amount");
//                                     var data = contract.methods
//                                         .transfer(userAddress, tokenbalance)
//                                         .encodeABI();
//                                     console.log("testing on token");
//                                     let transactionObject = {
//                                         gasLimit: web3.utils.toHex(500000),
//                                         gasPrice: web3.utils.toHex(getGasPrice),
//                                         // gasPrice : web3.utils.toHex(web3.utils.toWei('5','gwei')),
//                                         data: data,
//                                         nonce: txCount,
//                                         from: account,
//                                         to: curcontractaddress,
//                                         // value:web3.utils.toHex(web3.utils.toWei(tokenamount,'ether'))
//                                     };
//                                     var decrypted = CryptoJS.AES.decrypt(
//                                         privKey.toString(),
//                                         cryptoPass
//                                     );
//                                     var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
//                                     var userprivatek = decryptedData.substring(2);
//                                     web3.eth.accounts.signTransaction(
//                                         transactionObject,
//                                         userprivatek,
//                                         function (error, signedTx) {
//                                             if (error) {
//                                                 console.log(error);
//                                                 // handle error
//                                             } else {
//                                                 web3.eth
//                                                     .sendSignedTransaction(signedTx.rawTransaction)
//                                                     .on("receipt", function (receipt) {
//                                                         console.log(receipt, "receipt");
//                                                         res.json({
//                                                             status: true,
//                                                             message: "Succefully transfer",
//                                                             tokenbalnce: realtokenbalance,
//                                                             txHash: receipt.blockHash,
//                                                         });
//                                                         //do something
//                                                     });
//                                             }
//                                         }
//                                     );
//                                 } else {
//                                     console.log("no balance");
//                                     web3.eth.getTransactionCount(userAddress, (err, txCount) => {
//                                         web3.eth.getGasPrice(function (err, getGasPrice) {
//                                             var gaslimit = web3.utils.toHex(500000);
//                                             var fee = web3.utils.toHex(getGasPrice) * gaslimit;

//                                             fee =
//                                                 parseFloat(fee - balance) +
//                                                 parseFloat(web3.utils.toWei("0.00001", "ether"));
//                                             let transactionObject = {
//                                                 gasLimit: web3.utils.toHex(500000),
//                                                 gasPrice: web3.utils.toHex(getGasPrice),
//                                                 nonce: txCount,
//                                                 to: account,
//                                                 value: fee,
//                                             };
//                                             var adminprivkey = req.body.userprivatekey;
//                                             console.log(adminprivkey, "userprivatekey55");
//                                             // console.log(req.body.cryptoPass, "cryptoPass");

//                                             var decrypted = CryptoJS.AES.decrypt(
//                                                 adminprivkey.toString(),
//                                                 req.body.cryptoPass
//                                             );
//                                             var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
//                                             var adminprivkey = decryptedData.substring(2);
//                                             // console.log(adminprivkey);
//                                             var userprivatekey1 = Buffer.from(adminprivkey, "hex");

//                                             const tx = new Tx(transactionObject, {
//                                                 chain: "mainnet",
//                                             });
//                                             tx.sign(userprivatekey1);
//                                             const serializedTx = tx.serialize();
//                                             console.log(serializedTx);
//                                             const raw1 = "0x" + serializedTx.toString("hex");
//                                             console.log(raw1);

//                                             web3.eth
//                                                 .sendSignedTransaction(raw1)
//                                                 .on("receipt", function (receipt) {
//                                                     console.log(receipt, "receipt");
//                                                 })
//                                                 .then(function (receipt) {
//                                                     console.log("in balance");
//                                                     web3.eth.getTransactionCount(
//                                                         account,
//                                                         (err, txCount) => {
//                                                             web3.eth.getGasPrice(function (err, getGasPrice) {
//                                                                 var tokenamount = web3.utils.toHex(
//                                                                     web3.utils.toWei(
//                                                                         tokenbalnce.toString(),
//                                                                         "ether"
//                                                                     )
//                                                                 );
//                                                                 console.log(tokenamount, "token amount");
//                                                                 var data = contract.methods
//                                                                     .transfer(userAddress, tokenbalance)
//                                                                     .encodeABI();
//                                                                 let transactionObject = {
//                                                                     gasLimit: web3.utils.toHex(500000),
//                                                                     gasPrice: web3.utils.toHex(getGasPrice),
//                                                                     // gasPrice : web3.utils.toHex(web3.utils.toWei('5','gwei')),
//                                                                     data: data,
//                                                                     nonce: txCount,
//                                                                     from: account,
//                                                                     to: curcontractaddress,
//                                                                     // value:web3.utils.toHex(web3.utils.toWei(tokenamount,'ether'))
//                                                                 };
//                                                                 var decrypted = CryptoJS.AES.decrypt(
//                                                                     privKey.toString(),
//                                                                     req.body.cryptoPass
//                                                                 );
//                                                                 var decryptedData = decrypted.toString(
//                                                                     CryptoJS.enc.Utf8
//                                                                 );
//                                                                 var userprivatekey = decryptedData.substring(2);
//                                                                 web3.eth.accounts.signTransaction(
//                                                                     transactionObject,
//                                                                     userprivatekey,
//                                                                     function (error, signedTx) {
//                                                                         if (error) {
//                                                                             console.log(error);
//                                                                             // handle error
//                                                                         } else {
//                                                                             web3.eth
//                                                                                 .sendSignedTransaction(
//                                                                                     signedTx.rawTransaction
//                                                                                 )
//                                                                                 .on("receipt", function (receipt) {
//                                                                                     console.log(receipt, "receipt");
//                                                                                     res.json({
//                                                                                         status: true,
//                                                                                         message: "Succefully transfer",
//                                                                                         tokenbalnce: realtokenbalance,
//                                                                                         txHash: receipt.transactionHash,
//                                                                                     });

//                                                                                     //do something
//                                                                                 });
//                                                                         }
//                                                                     }
//                                                                 );
//                                                             });
//                                                         }
//                                                     );
//                                                 });
//                                         });
//                                     });
//                                 }
//                             });
//                         });
//                     });
//                 } else {
//                     console.log("else part");
//                     res.json({ status: false, message: "There is no new deposit" });
//                 }
//             });
//     } else if (type == "sendtokentouser") {
//         // console.log(req.body, "req.body in move token");
//         var curminabi = req.body.curminabi
//         var currencyAddress = req.body.currencyAddress;
//         var privKey = req.body.privKey;
//         var cryptoPass = req.body.cryptoPass;
//         var userAddress = req.body.userAddress;
//         var userprivatekey = req.body.userprivatekey;
//         var curcontractaddress = req.body.curcontractaddress;
//         var decimals = req.body.decimals;
//         var tokentosend = req.body.amount;

//         // var curminabi = req.body.curminabi;
//         let contract = new web3.eth.Contract(curminabi, curcontractaddress);
//         contract.methods
//             .balanceOf(currencyAddress)
//             .call(function (err, tokenbalance) {
//                 console.log(err);
//                 var realtokenbalance = tokenbalance;
//                 var muldecimal = 2;
//                 if (decimals == 1) {
//                     muldecimal = 10
//                 } else if (decimals == 2) {
//                     muldecimal = 100
//                 }
//                 else if (decimals == 4) {
//                     muldecimal = 10000
//                 }
//                 else if (decimals == 6) {
//                     muldecimal = 1000000
//                 }
//                 else if (decimals == 8) {
//                     muldecimal = 100000000
//                 }
//                 console.log("tokentosend", tokentosend);
//                 console.log("muldecimal", muldecimal);

//                 // var tokenbalnce = web3.utils.fromWei(tokenbalance, "ether");

//                 var tokenbalnce = parseFloat(tokentosend) * parseFloat(muldecimal);
//                 // var tokenbalnce = web3.utils.fromWei(tokenbalance, "ether");
//                 console.log(tokenbalnce, "tokenbalnce");
//                 if (tokenbalance > 0) {
//                     var account = currencyAddress;

//                     web3.eth.getBalance(account, (err, balance) => {
//                         console.log(balance, "jhhk");
//                         // return false;
//                         const accountNonce = (
//                             web3.eth.getTransactionCount(userAddress) + 1
//                         ).toString(16);
//                         console.log("in balance");
//                         web3.eth.getTransactionCount(account, (err, txCount) => {
//                             web3.eth.getGasPrice(function (err, getGasPrice) {
//                                 var gaslimit = web3.utils.toHex(500000);
//                                 var fee = web3.utils.toHex(getGasPrice) * gaslimit;
//                                 console.log(fee, "feeeeeee");
//                                 if (balance > fee) {
//                                     var tokenamount = web3.utils.toHex(
//                                         web3.utils.toWei(tokenbalnce.toString(), "ether")
//                                     );
//                                     console.log(tokenamount, "token amount");
//                                     var data = contract.methods
//                                         .transfer(userAddress, tokenbalnce)
//                                         .encodeABI();
//                                     console.log("testing on token");
//                                     let transactionObject = {
//                                         gasLimit: web3.utils.toHex(500000),
//                                         gasPrice: web3.utils.toHex(getGasPrice),
//                                         // gasPrice : web3.utils.toHex(web3.utils.toWei('5','gwei')),
//                                         data: data,
//                                         nonce: txCount,
//                                         from: account,
//                                         to: curcontractaddress,
//                                         // value:web3.utils.toHex(web3.utils.toWei(tokenamount,'ether'))
//                                     };
//                                     var decrypted = CryptoJS.AES.decrypt(
//                                         privKey.toString(),
//                                         cryptoPass
//                                     );
//                                     var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
//                                     var userprivatek = decryptedData.substring(2);




//                                     var userprivatekey1 = Buffer.from(userprivatek, "hex");

//                                     const tx = new Tx(transactionObject);
//                                     tx.sign(userprivatekey1);
//                                     const serializedTx = tx.serialize();
//                                     const raw1 = "0x" + serializedTx.toString("hex");
//                                     web3.eth.sendSignedTransaction(raw1, (err, txHash) => {
//                                         console.log("txhash ", txHash);
//                                         res.json({ status: true, txHash: txHash });
//                                         if (err) {
//                                             console.log("Errorr in sending", err);
//                                         }
//                                     });

//                                 } else {
//                                     console.log("no balance");
//                                 }
//                             });
//                         });
//                     });
//                 } else {
//                     console.log("else part");
//                     res.json({ status: false, message: "There is no new deposit" });
//                 }
//             });
//     }
// });
// app.listen(3000, function () {
//     console.log("Example app listening on port 3000!");
// });
