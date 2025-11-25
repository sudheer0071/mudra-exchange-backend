import "dotenv/config";
console.log("--process.env", process.env.REDIS_URL);
export default {
  PORT: process.env.PORT,
  SECRET_KEY: {
    CRYPTO: process.env.SECRET_KEY_CRYPTO,
  },
  REDIS_URL: process.env.REDIS_URL,
  REDIS_DB:process.env.REDIS_DB,
  WEB3_PROVIDER: process.env.WEB3_PROVIDER,
  WEB3_PROVIDER1: process.env.WEB3_PROVIDER1,
  WEB3_PROVIDER2: process.env.WEB3_PROVIDER2,
  WEB3_NETWORK_ID: process.env.WEB3_NETWORK_ID,
  WEB3_CHAIN_ID: process.env.WEB3_CHAIN_ID,
  SERVICE: {
    WALLET: {
      ID: process.env.SERVICE_WALLET_ID,
      URL: process.env.SERVICE_WALLET_URL,
    },
  },
  BNB: {
    URL: process.env.BNB_URL,
    KEY: process.env.BNB_KEY,
    ALTERNATE_KEY: process.env.BNB_KEY1,
  },
};
