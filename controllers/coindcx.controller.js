import mongoose from 'mongoose'
import axios from "axios";

import { SpotPair, SpotTrade } from "../models";



import { toFixed } from "../lib/roundOf";
import isEmpty from '../lib/isEmpty';

const request = require('request')

const baseurl = "https://public.coindcx.com"
const apiurl = "https://api.coindcx.com"

const ObjectId = mongoose.Types.ObjectId;

exports.ChartData = async function (pairname, type,startTime) {
   try{
    var marketbody = await axios.get(
        apiurl + "/exchange/v1/markets_details"
    );

    if (marketbody.data) {
        var marketlist = marketbody.data
        let curmarketdata = await marketlist.find(el => el.symbol == pairname)
        var cdcxpairname = curmarketdata.pair
        var chartdata = await axios.get(baseurl + "/market_data/candles?pair=" + cdcxpairname + "&interval=" + type+"&startTime="+startTime)

        if (chartdata) {
            return chartdata.data.reverse()
        }
    }
   } catch(err){
       console.log("------err",err)
   }


}




