// import package
import redis from 'redis'
import { promisify } from 'util'

const redisClient = redis.createClient({});
redisClient.get = promisify(redisClient.get);
redisClient.set = promisify(redisClient.set);

redisClient.on('connect', () => console.log('Connected to klklklklkllRedis') )

redisClient.on("error", function (error) {
    console.log("\x1b[31m", 'Error on redis client', error)
});


export const set = async (key, value) => {
    try {
        // console.log('redis18',key,value)
        await redisClient.set(key.toString(), value);
        return true
    } catch (err) {
        return false
    }
}

export const get = async (key) => {
    try {
        console.log('redisgetkey',key)
        return await redisClient.get(key.toString())
    } catch (err) {
        return null
    }
}

export const hset = async (key, uniqueId, data) => {
    let result = await redisClient.hset(key, uniqueId, JSON.stringify(data), function (err, value) {
        console.log("---err", err)
        console.log("---value", value)
    });
    console.log("-----result", result)
}

// hset('test','1',{"name":"ajith"})

export const hget = async (key, uniqueId) => {
    redisClient.hget(key, uniqueId, async function (err, value) {
        console.log("---err", err)
        console.log("---value", value)
    });
}

// get('1', { "email": 'test' })
// set('1', { "email": 'test' })
// client.hget(hash, key.toString(), async function (err, value) {
//     if (value) {
//         let res = await JSON.parse(value);
//         resolve(res);
//     } else {
//         resolve(null);
//     }
// })

// client.set("foo", "bar")

// client.get("foo", function(err, reply) {
//     // reply is null when the key is missing
//     console.log("----",reply);
//   });