/*
	This file is a node.js module.

	This is a sample implementation of UDF-compatible datafeed wrapper for (historical data) and (quotes).
	Some algorithms may be incorrect because it's rather an UDF implementation sample
	then a proper datafeed implementation.
*/

/* global require */
/* global console */
/* global exports */
/* global process */
const charts = require('../models/Chart');
const binanceChart = require('./helper/binanceHelper').binanceChart

"use strict";

var version = '2.0.2';
process.env.ABCD_API_KEY = "gvHCGNQBz6N2XGmtsMno";
var https = require("https");
var http = require("http");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var abcdCache = {};

var abcdCacheCleanupTime = 3 * 60 * 60 * 1000; // 3 hours
var abcdKeysValidateTime = 15 * 60 * 1000; // 15 minutes
var yahooFailedStateCacheTime = 3 * 60 * 60 * 1000; // 3 hours;
var abcdMinimumDate = '1970-01-01';

// this cache is intended to reduce number of requests to abcd
setInterval(function () {
	abcdCache = {};
	//console.warn(dateForLogs() + 'abcd cache invalidated');
}, abcdCacheCleanupTime);

function dateForLogs() {
	return (new Date()).toISOString() + ': ';
}

var defaultResponseHeader = {
	"Content-Type": "text/plain",
	'Access-Control-Allow-Origin': '*'
};

function sendJsonResponse(response, jsonData) {
	response.writeHead(200, defaultResponseHeader);
	response.write(JSON.stringify(jsonData));
	response.end();
}

function dateToYMD(date) {
	var obj = new Date(date);
	var year = obj.getFullYear();
	var m = obj.getMonth() + 1;
	var month = m < 10 ? '0' + m : m;
	var d = obj.getDate();
	var day = d < 10 ? '0' + d : d;
	return year + "-" + month + "-" + day;
}

var abcdKeys = process.env.ABCD_API_KEY.split(','); // you should create a free account on abcd.com to get this key, you can set some keys concatenated with a comma
var invalidabcdKeys = [];

function getValidabcdKey() {
	for (var i = 0; i < abcdKeys.length; i++) {
		var key = abcdKeys[i];
		if (invalidabcdKeys.indexOf(key) === -1) {
			return key;
		}
	}
	return null;
}

function markabcdKeyAsInvalid(key) {
	if (invalidabcdKeys.indexOf(key) !== -1) {
		return;
	}

	invalidabcdKeys.push(key);

	//console.warn(dateForLogs() + 'abcd key invalidated ' + key);

	setTimeout(function () {
		//console.log(dateForLogs() + "abcd key restored: " + invalidabcdKeys.shift());
	}, abcdKeysValidateTime);
}

function sendError(error, response) {
	response.writeHead(200, defaultResponseHeader);
	response.write("{\"s\":\"error\",\"errmsg\":\"" + error + "\"}");
	response.end();
}

function httpGet(datafeedHost, path, callback) {
	var options = {
		host: datafeedHost,
		path: path,
		port: '5000',
		method: "GET",
		headers: {
			"Content-Type": "application/json"
		},
		strictSSL: false
	};

	function onDataCallback(response) {
		var result = '';
		response.on('data', function (chunk) {
			result += chunk;
		});

		response.on('end', function () {
			if (response.statusCode !== 200) {
				callback({
					status: 'ERR_STATUS_CODE',
					errmsg: response.statusMessage || ''
				});
				return;
			}

			callback({
				status: 'ok',
				data: result
			});
		});
	}

	// var req = https.request(options, onDataCallback);
	var req = http.request(options, onDataCallback);

	req.on('socket', function (socket) {
		socket.setTimeout(15000);
		socket.on('timeout', function () {
			//console.log(dateForLogs() + 'timeout');
			req.abort();
		});
	});

	req.on('error', function (e) {
		callback({
			status: 'ERR_SOCKET',
			errmsg: e.message || ''
		});
	});

	req.end();
}

function convertabcdHistoryToUDFFormat(data, type) {

	function parseDate(input) {
		var parts = input.split('-');
		return Date.UTC(parts[0], parts[1] - 1, parts[2],);
	}

	function parseDated(input, timesx) {
		var parts = input.split('-');
		var times = timesx.split(':');
		return Date.UTC(parts[0], parts[1] - 1, parts[2], times[0], times[1], times[2], times[3]);
	}

	function formatDate(dateInput) {
		var datex = new Date(dateInput);
		var date = dateInput.split("-");
		var finaltimex = datex.getHours() + ":" + datex.getMinutes() + ":" + datex.getSeconds() + ":" + datex.getMilliseconds();
		return { "datex": date[0] + "-" + date[1] + "-" + date[2].substring(0, 2), "timex": finaltimex };
	}

	function columnIndices(columns) {
		var indices = {};
		for (var i = 0; i < columns.length; i++) {
			indices[columns[i].name] = i;
		}

		return indices;
	}

	var result = {
		t: [],
		c: [],
		o: [],
		h: [],
		l: [],
		v: [],
		s: "ok"
	};

	try {

		var json = JSON.parse(data);
		if (type == 'spotTradeTabel') {
			json.forEach(function (row) {
				var formatDatex = formatDate(row.Date);
				var fi = dateToYMD(formatDatex.datex);
				result.t.push(parseDated(fi, formatDatex.timex) / 1000);
				result.o.push(row.open);
				result.h.push(row.high);
				result.l.push(row.low);
				result.c.push(row.close);
				result.v.push(row.volume);
			});
		} else if (type == 'binance') {
			json.forEach(function (row) {
				let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = row;

				var formatDatex = formatDate(new Date(time).toISOString());
				var fi = dateToYMD(formatDatex.datex);
				result.t.push(parseDated(fi, formatDatex.timex) / 1000);
				result.o.push(open);
				result.h.push(high);
				result.l.push(low);
				result.c.push(close);
				result.v.push(volume);
			});
		}


	} catch (error) {
		return null;
	}

	return result;
}

function convertYahooQuotesToUDFFormat(tickersMap, data) {
	if (!data.query || !data.query.results) {
		var errmsg = "ERROR: empty quotes response: " + JSON.stringify(data);
		//console.log(dateForLogs() + errmsg);
		return {
			s: "error",
			errmsg: errmsg
		};
	}

	var result = {
		s: "ok",
		d: []
	};

	[].concat(data.query.results.quote).forEach(function (quote) {
		var ticker = tickersMap[quote.symbol];

		// this field is an error token
		if (quote["ErrorIndicationreturnedforsymbolchangedinvalid"] || !quote.StockExchange) {
			result.d.push({
				s: "error",
				n: ticker,
				v: {}
			});
			return;
		}

		result.d.push({
			s: "ok",
			n: ticker,
			v: {
				ch: +(quote.ChangeRealtime || quote.Change),
				chp: +((quote.PercentChange || quote.ChangeinPercent) && (quote.PercentChange || quote.ChangeinPercent).replace(/[+-]?(.*)%/, "$1")),

				short_name: quote.Symbol,
				exchange: quote.StockExchange,
				original_name: quote.StockExchange + ":" + quote.Symbol,
				description: quote.Name,

				lp: +quote.LastTradePriceOnly,
				ask: +quote.AskRealtime,
				bid: +quote.BidRealtime,

				open_price: +quote.Open,
				high_price: +quote.DaysHigh,
				low_price: +quote.DaysLow,
				prev_close_price: +quote.PreviousClose,
				volume: +quote.Volume,
			}
		});
	});
	return result;
}

function proxyRequest(controller, options, response) {
	controller.request(options, function (res) {
		var result = '';

		res.on('data', function (chunk) {
			result += chunk;
		});

		res.on('end', function () {
			if (res.statusCode !== 200) {
				response.writeHead(200, defaultResponseHeader);
				response.write(JSON.stringify({
					s: 'error',
					errmsg: 'Failed to get news'
				}));
				response.end();
				return;
			}
			response.writeHead(200, defaultResponseHeader);
			response.write(result);
			response.end();
		});
	}).end();
}

function RequestProcessor(symbolsDatabase) {
	this._symbolsDatabase = symbolsDatabase;
	this._failedYahooTime = {};
}

function filterDataPeriod(data, fromSeconds, toSeconds) {
	if (!data || !data.t) {
		return data;
	}

	if (data.t[data.t.length - 1] < fromSeconds) {
		return {
			s: 'no_data',
			nextTime: data.t[data.t.length - 1]
		};
	}

	var fromIndex = null;
	var toIndex = null;
	var times = data.t;
	for (var i = 0; i < times.length; i++) {
		var time = times[i];
		if (fromIndex === null && time >= fromSeconds) {
			fromIndex = i;
		}
		if (toIndex === null && time >= toSeconds) {
			toIndex = time > toSeconds ? i - 1 : i;
		}
		if (fromIndex !== null && toIndex !== null) {
			break;
		}
	}

	fromIndex = fromIndex || 0;
	toIndex = toIndex ? toIndex + 1 : times.length;

	var s = data.s;

	if (toSeconds < times[0]) {
		s = 'no_data';
	}

	toIndex = Math.min(fromIndex + 1000, toIndex); // do not send more than 1000 bars for server capacity reasons

	return {
		t: data.t,
		o: data.o,
		h: data.h,
		l: data.l,
		c: data.c,
		v: data.v,
		s: s
	};
}

RequestProcessor.prototype._sendConfig = function (response) {

	var config = {
		supports_search: true,
		supports_group_request: false,
		supports_marks: true,
		supports_timescale_marks: true,
		supports_time: true,
		exchanges: [{
			value: "",
			name: "All Exchanges",
			desc: ""
		},
		{
			value: "Alwin",
			name: "Alwin",
			desc: "Alwin"
		}

		],
		symbols_types: [{
			name: "All types",
			value: ""
		},
		{
			name: "Cryptocurrency",
			value: "crypto"
		}
		],
		supported_resolutions: ["1", "5", "15", "30", "60", "1D", "1W", "1M"]
	};

	response.writeHead(200, defaultResponseHeader);
	response.write(JSON.stringify(config));
	response.end();
};


RequestProcessor.prototype._sendMarks = function (response) {
	var now = new Date();
	now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 1000;
	var day = 60 * 60 * 24;

	var marks = {
		id: [0, 1, 2, 3, 4, 5],
		time: [now, now - day * 4, now - day * 7, now - day * 7, now - day * 15, now - day * 30],
		color: ["red", "blue", "green", "red", "blue", "green"],
		text: ["Today", "4 days back", "7 days back + Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", "7 days back once again", "15 days back", "30 days back"],
		label: ["A", "B", "CORE", "D", "EURO", "F"],
		labelFontColor: ["white", "white", "red", "#FFFFFF", "white", "#000"],
		minSize: [14, 28, 7, 40, 7, 14]
	};

	response.writeHead(200, defaultResponseHeader);
	response.write(JSON.stringify(marks));
	response.end();
};

RequestProcessor.prototype._sendTime = function (response) {
	var now = new Date();
	response.writeHead(200, defaultResponseHeader);
	response.write(Math.floor(now / 1000) + '');
	response.end();
};

RequestProcessor.prototype._sendTimescaleMarks = function (response) {
	var now = new Date();
	now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 1000;
	var day = 60 * 60 * 24;

	var marks = [{
		id: "tsm1",
		time: now,
		color: "red",
		label: "A",
		tooltip: ""
	},
	{
		id: "tsm2",
		time: now - day * 4,
		color: "blue",
		label: "D",
		tooltip: ["Dividends: $0.56", "Date: " + new Date((now - day * 4) * 1000).toDateString()]
	},
	{
		id: "tsm3",
		time: now - day * 7,
		color: "green",
		label: "D",
		tooltip: ["Dividends: $3.46", "Date: " + new Date((now - day * 7) * 1000).toDateString()]
	},
	{
		id: "tsm4",
		time: now - day * 15,
		color: "#999999",
		label: "E",
		tooltip: ["Earnings: $3.44", "Estimate: $3.60"]
	},
	{
		id: "tsm7",
		time: now - day * 30,
		color: "red",
		label: "E",
		tooltip: ["Earnings: $5.40", "Estimate: $5.00"]
	},
	];

	response.writeHead(200, defaultResponseHeader);
	response.write(JSON.stringify(marks));
	response.end();
};


RequestProcessor.prototype._sendSymbolSearchResults = function (query, type, exchange, maxRecords, response) {
	if (!maxRecords) {
		throw "wrong_query";
	}

	var result = this._symbolsDatabase.search(query, type, exchange, maxRecords);

	response.writeHead(200, defaultResponseHeader);
	response.write(JSON.stringify(result));
	response.end();
};

RequestProcessor.prototype._prepareSymbolInfo = function (symbolName) {
	var symbolInfo = this._symbolsDatabase.symbolInfo(symbolName);

	if (!symbolInfo) {
		throw "unknown_symbol " + symbolName;
	}

	return {
		"name": symbolInfo.name,
		"exchange-traded": symbolInfo.exchange,
		"exchange-listed": symbolInfo.exchange,
		"timezone": "America/New_York",
		"minmov": 1,
		"minmov2": 0,
		"pointvalue": 1,
		"session": "0930-1630",
		"has_intraday": true,
		"has_no_volume": symbolInfo.type !== "stock",
		"description": symbolInfo.description.length > 0 ? symbolInfo.description : symbolInfo.name,
		"type": symbolInfo.type,
		"supported_resolutions": ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
		"pricescale": 100000000,
		"ticker": symbolInfo.name.toUpperCase()
	};
};

RequestProcessor.prototype._sendSymbolInfo = function (symbolName, response) {
	var info = this._prepareSymbolInfo(symbolName);

	response.writeHead(200, defaultResponseHeader);
	response.write(JSON.stringify(info));
	response.end();
};

RequestProcessor.prototype._sendSymbolHistory = async function (symbol, startDateTimestamp, endDateTimestamp, resolution, response) {
	function sendResult(content) {
		var header = Object.assign({}, defaultResponseHeader);
		header["Content-Length"] = content.length;
		response.writeHead(200, header);
		response.write(content, null, function () {
			response.end();
		});
	}

	function secondsToISO(sec) {
		if (sec === null || sec === undefined) {
			return 'n/a';
		}
		return (new Date(sec * 1000).toISOString());
	}

	function logForData(data, key, isCached) {
		var fromCacheTime = data && data.t ? data.t[0] : null;
		var toCacheTime = data && data.t ? data.t[data.t.length - 1] : null;
		//console.log(dateForLogs() + "Return abcd result" + (isCached ? " from cache" : "") + ": " + key + ", from " + secondsToISO(fromCacheTime) + " to " + secondsToISO(toCacheTime));
	}

	function resolutionType(type) {
		switch (type) {
			case "1": return "1m";
			case "5": return "5m";
			case "15": return "15m";
			case "30": return "30m";
			case "60": return "1h";
			case '1d': return "1d";
			case '1w': return "1w";
			case 'd': return "1M";
			default: return "1m";
		}
	}

	//console.log(dateForLogs() + "Got history request for " + symbol + ", " + resolution + " from " + secondsToISO(startDateTimestamp) + " to " + secondsToISO(endDateTimestamp));

	// always request all data to reduce number of requests to abcd
	var from = abcdMinimumDate;
	// var to = dateToYMD(Date.now());
	const today = new Date()
	const tomorrow = new Date(today)
	tomorrow.setDate(tomorrow.getDate() + 1)
	var to = dateToYMD(tomorrow);

	var key = symbol + "|" + from + "|" + to;


	// if (abcdCache[key]) {
	// 	var dataFromCache = filterDataPeriod(abcdCache[key], startDateTimestamp, endDateTimestamp);
	// 	logForData(dataFromCache, key, true);
	// 	sendResult(JSON.stringify(dataFromCache));
	// 	return;
	// }

	var abcdKey = getValidabcdKey();

	if (abcdKey === null) {
		//console.log(dateForLogs() + "No valid abcd key available");
		sendError('No valid API Keys available', response);
		return;
	}

	var address = "/cryptoapi/chartData?" +
		"market=" + symbol +
		"&start_date=" + from +
		"&resolution=" + resolution +
		"&end_date=" + to;

	// console.log(address,'address');
	//console.log(dateForLogs() + "Sending request to abcd  " + key + ". url=" + address);

	// httpGet("localhost", address, function (result) {
	// console.log(response,'fsdkljflsdjflsdjflsjdfjsdlfjsdf')
	// if (response.finished) {
	// 	// we can be here if error happened on socket disconnect
	// 	return;
	// }
	//       // console.log(result,'okaayyyy')
	//       // console.log(result.status,'okaayyyy')

	// if (result.status !== 'ok') {
	// 	if (result.status === 'ERR_SOCKET') {
	// 		//console.log('Socket problem with request: ' + result.errmsg);
	// 		sendError("Socket problem with request " + result.errmsg, response);
	// 		return;
	// 	}

	// 	//console.error(dateForLogs() + "Error response from abcd for key " + key + ". Message: " + result.errmsg);
	// 	markabcdKeyAsInvalid(abcdKey);
	// 	sendError("Error abcd response " + result.errmsg, response);
	// 	return;
	// }

	var pair = symbol;
	var start_date = from;
	var end_date = to;
	var resol = resolution;
	var spl = pair.split("_");
	var first = spl[0];
	var second = spl[1];
	var pattern = /^([0-9]{4})\-([0-9]{2})\-([0-9]{2})$/;
	var _trProject;
	var _trGroup;
	var _exProject;
	var _exGroup;
	if (start_date) {
		if (!pattern.test(start_date)) {
			res.json({ "message": "Start date is not a valid format" });
			return false;
		}
	}
	else {
		res.json({ "message": "Start date parameter not found" });
		return false;
	}
	if (end_date) {
		if (!pattern.test(end_date)) {
			res.json({ "message": "End date is not a valid format" });
			return false;
		}
	}
	else {
		res.json({ "message": "End date parameter not found" });
		return false;
	}

	let timeType = resolutionType(resol.toString())
	let chartData = await binanceChart({
		pairName: pair,
		timeType
	});
	if (chartData && chartData.result && chartData.result.length > 0) {
		var data = convertabcdHistoryToUDFFormat(JSON.stringify(chartData.result), chartData.type);

		if (data === null) {
			// var dataStr = typeof result === "string" ? result.slice(0, 100) : result;
			//console.error(dateForLogs() + " failed to parse: " + dataStr);
			sendError("Invalid abcd response", response);
			return;
		}

		var filteredData = filterDataPeriod(data, startDateTimestamp, endDateTimestamp);

		logForData(filteredData, key, false);
		sendResult(JSON.stringify(filteredData));

	} else {
		// res.json([]);
		console.log("null");
	}
	// charts.findOne({ type: resol, pairname: pair }).exec(function (err, result) {

	// 	if (result) {
	// 		// console.log(result.data);
	// 		var data = convertabcdHistoryToUDFFormat(JSON.stringify(result.data));
	// 		// console.log(data,'data')
	// 		if (data === null) {
	// 			var dataStr = typeof result === "string" ? result.slice(0, 100) : result;
	// 			//console.error(dateForLogs() + " failed to parse: " + dataStr);
	// 			sendError("Invalid abcd response", response);
	// 			return;
	// 		}

	// 		if (data.t.length !== 0) {
	// 			// console.log(dateForLogs() + "Successfully parsed and put to cache " + data.t.length + " bars.");

	// 			//abcdCache[key] = data;
	// 		} else {
	// 			// console.log(dateForLogs() + "Parsing returned empty result.");
	// 		}

	// 		var filteredData = filterDataPeriod(data, startDateTimestamp, endDateTimestamp);

	// 		logForData(filteredData, key, false);
	// 		sendResult(JSON.stringify(filteredData));
	// 	}
	// 	else {
	// 		// res.json([]);
	// 		console.log("null");
	// 	}
	// });

	// });
};

RequestProcessor.prototype._quotesabcdWorkaround = function (tickersMap) {
	var from = abcdMinimumDate;
	// var to = dateToYMD(Date.now());
	const today = new Date()
	const tomorrow = new Date(today)
	tomorrow.setDate(tomorrow.getDate() + 1)
	var to = dateToYMD(tomorrow);

	var result = {
		s: "ok",
		d: [],
		source: 'abcd',
	};

	Object.keys(tickersMap).forEach(function (symbol) {
		var key = symbol + "|" + from + "|" + to;
		var ticker = tickersMap[symbol];

		var data = abcdCache[key];
		var length = data === undefined ? 0 : data.c.length;

		if (length > 0) {
			var lastBar = {
				o: data.o[length - 1],
				h: data.o[length - 1],
				l: data.o[length - 1],
				c: data.o[length - 1],
				v: data.o[length - 1],
			};

			result.d.push({
				s: "ok",
				n: ticker,
				v: {
					ch: 0,
					chp: 0,

					short_name: symbol,
					exchange: '',
					original_name: ticker,
					description: ticker,

					lp: lastBar.c,
					ask: lastBar.c,
					bid: lastBar.c,

					open_price: lastBar.o,
					high_price: lastBar.h,
					low_price: lastBar.l,
					prev_close_price: length > 1 ? data.c[length - 2] : lastBar.o,
					volume: lastBar.v,
				}
			});
		}
	});

	return result;
};

RequestProcessor.prototype._sendQuotes = function (tickersString, response) {
	var tickersMap = {}; // maps YQL symbol to ticker

	var tickers = tickersString.split(",");
	[].concat(tickers).forEach(function (ticker) {
		var yqlSymbol = ticker.replace(/.*:(.*)/, "$1");
		tickersMap[yqlSymbol] = ticker;
	});

	if (this._failedYahooTime[tickersString] && Date.now() - this._failedYahooTime[tickersString] < yahooFailedStateCacheTime) {
		sendJsonResponse(response, this._quotesabcdWorkaround(tickersMap));
		//console.log("Quotes request : " + tickersString + ' processed from abcd cache');
		return;
	}

	var that = this;

	var yql = "env 'store://datatables.org/alltableswithkeys'; select * from yahoo.finance.quotes where symbol in ('" + Object.keys(tickersMap).join("','") + "')";
	//console.log("Quotes query: " + yql);

	var options = {
		host: "query.yahooapis.com",
		path: "/v1/public/yql?q=" + encodeURIComponent(yql) +
			"&format=json" +
			"&env=store://datatables.org/alltableswithkeys"
	};
	// for debug purposes
	// console.log(options.host + options.path);

	http.request(options, function (res) {
		var result = '';

		res.on('data', function (chunk) {
			result += chunk;
		});

		res.on('end', function () {
			var jsonResponse = {
				s: 'error'
			};

			if (res.statusCode === 200) {
				jsonResponse = convertYahooQuotesToUDFFormat(tickersMap, JSON.parse(result));
			} else {
				console.error('Yahoo Fails with code ' + res.statusCode);
			}

			if (jsonResponse.s === 'error') {
				that._failedYahooTime[tickersString] = Date.now();
				jsonResponse = that._quotesabcdWorkaround(tickersMap);
				//console.log("Quotes request : " + tickersString + ' processed from abcd');
			}

			sendJsonResponse(response, jsonResponse);
		});
	}).end();
};

RequestProcessor.prototype._sendNews = function (symbol, response) {
	var options = {
		host: "feeds.finance.yahoo.com",
		path: "/rss/2.0/headline?s=" + symbol + "&region=US&lang=en-US"
	};

	// proxyRequest(https, options, response);
	proxyRequest(http, options, response);
};

RequestProcessor.prototype._sendFuturesmag = function (response) {
	var options = {
		host: "www.futuresmag.com",
		path: "/rss/all"
	};

	proxyRequest(http, options, response);
};

RequestProcessor.prototype.processRequest = function (action, query, response) {
	// try {
	if (action === "/config") {
		this._sendConfig(response);
	} else if (action === "/symbols" && !!query["symbol"]) {
		this._sendSymbolInfo(query["symbol"], response);
	} else if (action === "/search") {
		this._sendSymbolSearchResults(query["query"], query["type"], query["exchange"], query["limit"], response);
	} else if (action === "/history") {
		this._sendSymbolHistory(query["symbol"], query["from"], query["to"], query["resolution"].toLowerCase(), response);
	} else if (action === "/quotes") {
		this._sendQuotes(query["symbols"], response);
	} else if (action === "/marks") {
		this._sendMarks(response);
	} else if (action === "/time") {
		this._sendTime(response);
	} else if (action === "/timescale_marks") {
		this._sendTimescaleMarks(response);
	} else if (action === "/news") {
		this._sendNews(query["symbol"], response);
	} else if (action === "/futuresmag") {
		this._sendFuturesmag(response);
	} else {
		response.writeHead(200, defaultResponseHeader);
		response.write('Datafeed version is ' + version +
			'\nValid keys count is ' + String(abcdKeys.length - invalidabcdKeys.length) +
			'\nCurrent key is ' + (getValidabcdKey() || '').slice(0, 3) +
			(invalidabcdKeys.length !== 0 ? '\nInvalid keys are ' + invalidabcdKeys.reduce(function (prev, cur) {
				return prev + cur.slice(0, 3) + ',';
			}, '') : ''));
		response.end();
	}
	// } catch (error) {
	// 	sendError(error, response);
	// 	//console.error('Exception: ' + error);
	// }
};

exports.RequestProcessor = RequestProcessor;
