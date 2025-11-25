// import package
const bitcoin_rpc = require('node-bitcoin-rpc');

// import lib
import { encryptString, decryptString } from '../../lib/cryptoJS'
import config from '../../lib/config';

var host     = '3.1.6.100';
var port     = '8332';
var username = 'lokalexchange';
var password = "lokal54321";


export const newAddress = (req, res) => {
    try {
        var argmns = ['ajith@britisheducationonline.org'];
        bitcoin_rpc.init(host, port, username, password)
        bitcoin_rpc.call('getnewaddress', argmns, function (err, address) {
            if (!err) {
                // console.log('llllllff', address);
                // res.json(address);
            }
            else {
                // console.log("Error", err)
            }
        })
    }
    catch (err) {
        // console.log("----err",err)
        // return res.status(500).json({ 'error': err.toString() })
    }
}

// newAddress()
