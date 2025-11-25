// import package
import axios from 'axios';
import https from 'https';
import converter from 'hex2dec';
import querystring from 'querystring'

// import modal
import Currency from '../../models/currency';
import Assets from '../../models/Assets';
import Transaction from '../../models/Transaction';

// import config
import config from '../../config';

// import lib
import isEmpty from '../../lib/isEmpty';
import isJsonParse from '../../lib/isJsonParse';

export const createAddress = async (data) => {
    try {
        data['type'] = 'getnewaddress';
        let respData = await axios({
            'method': 'post',
            'url': `${config.coinGateway.btc.url}/btcnode`,
            data
        });

        if (respData && respData.status == 200 && !isEmpty(respData.data.result)) {
            const { result } = respData.data;
            return {
                address: result,
                privateKey: ''
            }
        } else {
            return {
                address: '',
                privateKey: ''
            }
        }
    }
    catch (err) {
        return {
            address: '',
            privateKey: ''
        }
    }
}

export const deposit = async () => {
    try {
        let currencyData = await Currency.findOne({ "currencySymbol": "BTC" })
        if (!currencyData) {
            return false
        }

        let data = {};
        data['skip'] = currencyData.block;
        let respData = await axios({
            'method': 'post',
            'url': `${config.coinGateway.btc.url}/btcnode/listTrx`,
            data
        });

        if (respData && respData.status == 200 && !isEmpty(respData.data.result)) {
            const { result } = respData.data;

            for (let item of result) {
                let checkTransaction = await Transaction.findOne({ 'txid': item.txid })
                if (!checkTransaction) {
                    let userAssetData = await Assets.findOne({ 'currencyAddress': item.address })

                    if (userAssetData) {
                        let transactions = new Transaction();
                        transactions["userId"] = userAssetData.userId;
                        transactions["currencyId"] = userAssetData.currency;
                        transactions["toaddress"] = item.address;
                        transactions["transferType"] = "TOUSER";
                        transactions["amount"] = item.amount;
                        transactions["txid"] = item.txid;
                        transactions["status"] = 3;
                        transactions["paymentType"] = 1;

                        let newTransactions = await transactions.save();
                        userAssetData.spotwallet = userAssetData.spotwallet + item.amount;
                        await userAssetData.save();
                    }
                }
            }
            currencyData.block = currencyData.block + result.length
            await currencyData.save();
        }
    }
    catch (err) {
        console.log("\x1b[33m%s\x1b[0m", 'Erron on BTC Deposit ', err.toString());
    }
}

export const amountMoveToUser = async ({ userAddress, amount }) => {
    try {
        info.result
        let data = {};
        data['type'] = 'sendtoaddress';
        data['amount'] = amount;
        data['toaddress'] = userAddress;

        let respData = await axios({
            'method': 'post',
            'url': `${config.coinGateway.btc.url}/btcnode`,
            data
        });

        if (respData && respData.status == 200) {
            return {
                status: true,
                trxId: respData.data.result
            }
        } else {
            return {
                status: false,
                message: "Some error"
            }
        }
    }
    catch (err) {
        return {
            status: false,
            // message: err.response.data.message
            message: 'Some error'
        }
    }
}