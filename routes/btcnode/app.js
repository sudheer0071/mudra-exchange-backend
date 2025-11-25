var express = require('express');
var ip           = require('ip');
const bitcoin_rpc  = require('node-bitcoin-rpc');
var bodyParser = require('body-parser')

var myip = ip.address();
console.log(myip);
var app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
app.post('/ltcnode', function (req, res) {
  console.log(req.body);
  var host     = '127.0.0.1';
  var port     = 8332;
  var username = 'bitcoinrpc';
  var password = "globalcryptobtcpass2020";
  var type    = req.body.type;
  if(type=='getnewaddress')
  {
    var email    = req.body.email;
    var argmns = [email];
  }
  else if(type=='getbalance')
  {
    var argmns = [];
  }
  else if(type=='listtransactions')
  {
    var argmns = [];
  }
  else if(type=='sendtoaddress')
  {
    var amount    = parseFloat(req.body.amount);
    var toaddress    = req.body.toaddress;
    var argmns = [toaddress,amount];
  }
  bitcoin_rpc.init(host, port, username, password)
    bitcoin_rpc.call(type, argmns, function (err, address) {
      if(!err){
        res.json(address);
      }
    })
});
app.listen(3003, function () {
  console.log('Example app listening on port 3000!');
});

 