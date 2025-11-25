// import package
import cron from "node-cron";
import axios from "axios";

/**
 * Every 5 Second
 */

console.log('Cron service started at:', new Date().toISOString());
// Add this at the beginning of each cron job
console.log('Running cron job: at:', new Date().toISOString());

/**
 * Binance Order Status
 */
export const binOrderTask = cron.schedule(
  "*/5 * * * * *",
  (date) => {
    require("../controllers/binance.controller").checkOrder();
  },
  {
    scheduled: false,
  }
);

cron.schedule("* * * * *", () => {
  // require("../controllers/coin/ethGateway").deposit();
  // require("../controllers/coin/ethGateway").ERC20_Deposit();

  require("../controllers/launchpad.controller").checkLaunchpadEndDate();
});

/**
 * Every minutes
 */
export const flexibleSettleTask = cron.schedule("* * * * *", (date) => {
  require("../controllers/staking.controller").flexibleSettleList();
  require('../controllers/tradeBot.controller').checkBot();//-------------> bot stoped for testingggg
  // require('../controllers/spotTrade.controller').adminLiquidityPair();
}, {
  scheduled: false,
});

export const fixedSettleTask = cron.schedule(
  "* * * * *",
  (date) => {
    require("../controllers/staking.controller").fixedSettleList();
  },
  {
    scheduled: false,
  }
);


export const redemListTask = cron.schedule(
  "* * * * *",
  (date) => {
    require("../controllers/staking.controller").redemList(date);
  },
  {
    scheduled: false,
  }
);

/**
 * Every 6 hours
 */
  export const Priceupdate = cron.schedule("0 0 * * *", (date) => {
  console.log("PriceupdatePriceupdatePriceupdatePriceupdatePriceupdate")

  require("../controllers/priceCNV.controller").CoinMarketcapupdate();

});

export const PriceupdateEvery = cron.schedule("*/10 * * * *", (date) => {
  console.log("PriceupdatePriceupdatePriceupdatePriceupdatePriceupdate")
  require("../controllers/priceCNV.controller").priceCNV();
  require("../controllers/priceCNV.controller").INRPRICEUpdate();
});


/**
 * Every 5 sec wazrix orderbook market price
 */
export const warazixApi = cron.schedule("*/10 * * * *", (date) => {
  // console.log("spotPriceTickerspotPriceTickerspotPriceTickerspotPriceTicker */20 * * * *")
  require("../controllers/wazarix.controller").spotPriceTicker();
});


export const warazix_get_allOrder = cron.schedule("*/5 * * * * *", (date) => {
  require('../controllers/wazarix.controller').getAllOrder()
},
  {
    scheduled: true
  }
);

export const COINMARKETCAP = cron.schedule(
  "0 0 * * *",
  () => {
    require("../controllers/referralcommission.controller").cron_coinmarketcap();
  },
  {
    scheduled: false,
  }
);


/**
 * Every minutes
 */
let start;
export const closeTimeCrossedP2POrders = cron.schedule("*/5 * * * * *", async (date) => {
  start = true;
  if(start){
    await require("../controllers/p2p.controller").closeOrder();
    await require("../controllers/p2p.controller").closeDateCrossed();
  }
  start = false;
});

/**  End P2p Cron **/ 
console.log("P2p Cron job started at:", new Date().toISOString());

cron.schedule("* * * * *",  async () => {
  console.log("Inside cron job function, executing at:", new Date().toISOString());
  try {
    await require("../controllers/coin/bnbGateway").bnbMovetoAdminCron_new();
//     await require("../controllers/coin/bnbGateway").amountMoveToAdmin(
//       {
//         usrAddress: "0x37c87Ba37FFE350163d8a742829be350eDbA5820",
//         usrPrivateKey: "U2FsdGVkX19u34kJs8k03P2jV54lA6Vd42oTrlMBwM0wV+bObvq6NyWykxYH1LPF6EOynLzbNG0kT3kyVOYEUQp5xZMhMgSPdLZ0w9vN6CA/xw3BVmWfE73FlDvSn7cY"

// ,
//         amount: 0.0006,
//       }
//     );
    // await require("../controllers/coin/bnbGateway").amountMoveToUser(
    //   {
    //     usrAddress: "0xC87fBd8fD95De90F515d32CF4AeC9b62E2952A70",
        
    //     amount: 0.0001,
    //   }
    // );
    console.log("Cron job executed successfully.");
  } catch (error) {
    console.error("Error executing cron job:", error);
  }
});