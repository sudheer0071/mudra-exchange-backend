// import package
import { createClient } from "redis";

// import config
import config from "./config";

let redisClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on("error", (err) => console.log("Redis Cluster Error", err));

export const redisConnection = async () => {
  try {
    const client= await redisClient.connect();
    client.select(config.REDIS_DB);
    console.log("Redis connected successfully");
    return true;
  } catch (err) {
    console.log("Redis connection failed", err);
    return false;
  }
};

export const hset = async (key, uniqueId, data) => {
  let result = await redisClient.hSet(key, uniqueId, JSON.stringify(data));
  console.log("<-----result----->", result);
};

export const hget = async (key, uniqueId) => {
  return await redisClient.hGet(key, uniqueId);
};

export const hdel = async (key, uniqueId) => {
  return await redisClient.hDel(key, uniqueId.toString());
};

export const hgetall = async (key) => {
  let allvalues = await redisClient.hGetAll(key);
  return allvalues;
};

export const hdetall = async (key) => {
  await redisCtrl.del(key);
};
