/*
	This file is a node.js module intended for use in different UDF datafeeds.
*/
//	This list should contain all the symbols available through your datafeed.
//	The current version is extremely incomplete (as it's just a sample): has much more of them.

"use strict";

/* global exports */
var https = require("https");
var http = require("http");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let symbols = []

// var symbols = [{
// 	name: 'BTCUSDT',
// 	description: 'BTCUSDT',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'KSCUSDT',
// 	description: 'KSCUSDT',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'ETHUSDT',
// 	description: 'ETHUSDT',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'BATUSDT',
// 	description: 'BATUSDT',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'FDAUSDT',
// 	description: 'FDAUSDT',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'BCHUSD',
// 	description: 'BCHUSD',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'XRPUSD',
// 	description: 'XRPUSD',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'XRPBTC',
// 	description: 'XRPBTC',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'LTCUSD',
// 	description: 'LTCUSD',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'ETHBTC',
// 	description: 'ETHBTC',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'GENONEBTC',
// 	description: 'GENONEBTC',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'GENONEUSDT',
// 	description: 'GENONEUSDT',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// {
// 	name: 'ABCBTC',
// 	description: 'ABCBTC',
// 	exchange: 'Trading',
// 	type: 'crypto'
// },
// ];

exports.initGetAllMarketsdata = () => {
	// An object of options to indicate where to post to
	var post_options = {
		// host: "thedopamine.tech",
		host: "localhost",
		path: "/cryptoapi/markets",
		method: "GET",
		port: "5000"
	};
	// Set up the request
	// var request = https.request(post_options, response => {
	var request = http.request(post_options, response => {
		//console.log(response);
		var result = "";
		response.setEncoding("utf8");
		response.on("data", chunk => {
			result += chunk;
			//console.log(result);
		});
		response.on("end", () => {
			if (response.statusCode !== 200) {
				return;
			}
			var receivedData = JSON.parse(result);
			var newCuurencyArray = receivedData.map(item => {
				var blankObj = {};
				blankObj["name"] = item.name;
				blankObj["description"] = item.name;
				blankObj["exchange"] = item.exchange;
				blankObj["type"] = "crypto";
				return blankObj;
			});
			//this.addSymbols(newCuurencyArray);
		});
	});
	request.on("error", function (e) {
		console.log("problem with request: ", e.message);
	});
	request.end();
};

function searchResultFromDatabaseItem(item) {
	return {
		symbol: item.name,
		full_name: item.name,
		description: item.description,
		exchange: item.exchange,
		type: item.type
	};
}

exports.search = function (searchString, type, exchange, maxRecords) {
	var MAX_SEARCH_RESULTS = !!maxRecords ? maxRecords : 50;
	var results = []; // array of WeightedItem { item, weight }
	var queryIsEmpty = !searchString || searchString.length === 0;
	var searchStringUpperCase = searchString.toUpperCase();

	for (var i = 0; i < symbols.length; ++i) {
		var item = symbols[i];

		if (type && type.length > 0 && item.type != type) {
			continue;
		}
		if (exchange && exchange.length > 0 && item.exchange != exchange) {
			continue;
		}

		var positionInName = item.name.toUpperCase().indexOf(searchStringUpperCase);
		var positionInDescription = item.description.toUpperCase().indexOf(searchStringUpperCase);

		if (queryIsEmpty || positionInName >= 0 || positionInDescription >= 0) {
			var found = false;
			for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
				if (results[resultIndex].item == item) {
					found = true;
					break;
				}
			}
			if (!found) {
				var weight = positionInName >= 0 ? positionInName : 8000 + positionInDescription;
				results.push({
					item: item,
					weight: weight
				});
			}
		}
	}

	return results
		.sort(function (weightedItem1, weightedItem2) {
			return weightedItem1.weight - weightedItem2.weight;
		})
		.map(function (weightedItem) {
			return searchResultFromDatabaseItem(weightedItem.item);
		})
		.slice(0, Math.min(results.length, MAX_SEARCH_RESULTS));
};


exports.addSymbols = function (newSymbols) {
	symbols = symbols.concat(newSymbols);
};

exports.symbolInfo = function (symbolName) {
	// console.log('symbolName : ',symbolName);
	var data = symbolName.split(':');
	//console.log('data : ',data);
	var exchange = (data.length > 1 ? data[0] : "").toUpperCase();
	var symbol = (data.length > 1 ? data[1] : symbolName).toUpperCase();
	// console.log('symbols',symbols.length);
	for (var i = 0; i < symbols.length; ++i) {
		var item = symbols[i];

		if (item.name.toUpperCase() == symbol && (exchange.length === 0 || exchange == item.exchange.toUpperCase())) {
			return item;
		}
	}

	return null;
};

exports.initialChartSymbol = (chartSymbol) => {
	symbols = [...symbols, ...chartSymbol]
}