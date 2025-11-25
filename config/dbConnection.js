// import package
import mongoose from 'mongoose';

// import config
import config from './index';

console.log("db url......",config.DATABASE_URL)

const dbConnection = (cb) => {
    mongoose.connect(config.DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    }, (err, data) => {
        if (err) {
            console.log("\x1b[31m",'Error on Database connection')
            setTimeout(() => {
                dbConnection(cb)
            }, 1000)
        } else {
            console.log('\x1b[33m%s\x1b[0m', `MongoDB successfully connected.`,config.DATABASE_URL)
            return cb(true)
        }
    })
}




export default dbConnection;