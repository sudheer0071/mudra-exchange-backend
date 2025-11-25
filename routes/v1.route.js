//  import packages
import express from 'express';
import requestIp from 'request-ip'

// import controllers
import * as apiKeyCtrl from '../controllers/apiManage.controller';
import * as spotV1Ctrl from '../controllers/v1/spot.v1';

const router = express();

router.route('/spot/ticker/24hr').get(requestIp.mw(), spotV1Ctrl.ticker24hr)
router.route('/spot/ticker/price').get(requestIp.mw(), spotV1Ctrl.tickerPrice)
router.route('/spot/pairs').get(requestIp.mw(), spotV1Ctrl.getTradepairs)
router.route('/spot/tradeOrders').get(requestIp.mw(), spotV1Ctrl.getRecentTrade)
router.route('/spot/orderBook').get(requestIp.mw(), spotV1Ctrl.getOrderBook)

export default router;