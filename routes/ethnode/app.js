var express = require("express");
var bodyParser = require("body-parser");
const CryptoJS = require("crypto-js");
const Tx = require("ethereumjs-tx").Transaction;


var app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const Web3 = require("web3");
const web3 = new Web3("https://ropsten.infura.io/v3/0701ef37d3a84e30ae807fc0c0f697c1");

app.use(bodyParser.json());


router.post('/ethnode', function (req, res) {A
    // console.log(req.body);
    var type = req.body.type;
    if (type == 'getnewaddress') {
        var account = web3.eth.accounts.create();
        res.json(account);
    }
    else if (type == 'getbalance') {
        var ethaddress = req.body.ethaddress;
        console.log(ethaddress, 'ethaddress')
        web3.eth.getBalance(ethaddress, (err, balance) => {
            console.log(balance, 'balance')
            var balance = web3.utils.fromWei(balance, 'ether');
            res.json({ result: balance })
        });
    }
    else if (type == 'listtransactions') {
        var argmns = [];
    }
    else if (type == 'sendtoaddress') {

        var account1 = req.body.account1;
        var privkey = req.body.privkey;
        var cryptoPass = req.body.cryptoPass;
        var useraddress = req.body.adminaddress;
        var amount = req.body.amount;

        var decrypted = CryptoJS.AES.decrypt(privkey, cryptoPass);
        var decryptedData = (decrypted.toString(CryptoJS.enc.Utf8));
        var userprivatekey = decryptedData.substring(2);
        userprivatekey = userprivatekey;
        web3.eth.getBalance(useraddress, (err, balance) => {
            var balance = web3.utils.fromWei(balance, 'ether');
            var kjhkhkhkh = amount;
            if (balance >= kjhkhkhkh) {

                web3.eth.getGasPrice(function (err, getGasPrice) {
                    web3.eth.getTransactionCount(useraddress, (err, txCount) => {

                        var gaslimit = web3.utils.toHex(500000);
                        var fee = web3.utils.toHex(getGasPrice) * gaslimit;
                        // var amount = balance - fee;

                        if (kjhkhkhkh > 0) {
                            var updateVal = {};
                            // var amount = web3.utils.toWei(kjhkhkhkh.toString(),'hex');
                            var amount = web3.utils.toHex(web3.utils.toWei(kjhkhkhkh, 'ether'))
                            console.log(amount, 'amountamount');
                            const txObject = {
                                nonce: web3.utils.toHex(txCount),
                                gasLimit: web3.utils.toHex(gaslimit),
                                gasPrice: web3.utils.toHex(getGasPrice),
                                to: account1.toString(),
                                value: amount
                            }

                            var userprivatekey1 = Buffer.from(userprivatekey, 'hex');

                            const tx = new Tx(txObject);
                            tx.sign(userprivatekey1);
                            const serializedTx = tx.serialize();
                            console.log(serializedTx);
                            const raw1 = '0x' + serializedTx.toString('hex');
                            console.log(raw1);
                            web3.eth.sendSignedTransaction(raw1, (err, txHash) => {
                                console.log(txHash);
                                console.log(err);
                                res.json({ status: true, txHash: txHash })
                            });
                        }
                        else {
                            console.log('no balance');
                        }
                    });
                });
            }
            else {
                res.json({ status: false, message: "Insuffient funds" });
            }
        });
    }
    else if (type == 'movetoadmin') {
        var account1 = req.body.adminaddress;
        var privkey = req.body.privkey;
        var cryptoPass = req.body.cryptoPass;
        var useraddress = req.body.useraddress;
        console.log(useraddress, 'useraddress')
        var decrypted = CryptoJS.AES.decrypt(privkey.toString(), cryptoPass);
        var decryptedData = (decrypted.toString(CryptoJS.enc.Utf8));
        var userprivatekey = decryptedData.substring(2);
        web3.eth.getBalance(useraddress, (err, balance) => {
            console.log(balance, 'fsdsdfds')
            web3.eth.getGasPrice(function (err, getGasPrice) {
                web3.eth.getTransactionCount(useraddress, (err, txCount) => {
                    console.log(getGasPrice, 'getGasPrice')
                    var gaslimit = web3.utils.toHex(50000);
                    var fee = web3.utils.toHex(getGasPrice) * gaslimit;
                    console.log(fee, 'fee')
                    var amount = balance - fee;
                    console.log(amount, 'amount')
                    if (amount > 0) {
                        var updateVal = {};
                        const txObject = {
                            nonce: web3.utils.toHex(txCount),
                            gasLimit: web3.utils.toHex(gaslimit),
                            gasPrice: web3.utils.toHex(getGasPrice),
                            to: account1.toString(),
                            value: amount
                        }

                        console.log("------txObject", txObject);
                        var userprivatekey1 = Buffer.from(userprivatekey, 'hex');
                        const tx = new Tx(txObject);
                        tx.sign(userprivatekey1);
                        const serializedTx = tx.serialize();
                        console.log("-----serializedTx", serializedTx);
                        const raw1 = '0x' + serializedTx.toString('hex');
                        console.log("----raw1", raw1);
                        web3.eth.sendSignedTransaction(raw1, (err, txHash) => {
                            console.log(err, 'err')
                            console.log(txHash, 'txHash')
                            var recamount = web3.utils.fromWei(amount.toString(), 'ether');
                            res.json({ txHash: txHash, recamount: recamount });
                        });
                    }
                    else {
                        console.log('no balance');
                    }
                });
            });
        });
    }
    else if (type == 'getTokenBalance') {
        let balance = getContractBalance()
        res.json({ result: balance })
    }

});

const getContractBalance = async (reqBody) => {
    try {
        let contract = new web3.eth.Contract(reqBody.minABI, reqBo.contractAddress);
        let balance = await contract.methods.balanceOf(reqBody.walletAddress).call();
        return balance
    }
    catch (err) {
        return 0
    }

}

app.listen(3000, function () {
    console.log("Example app listening on port 3000!");
});
