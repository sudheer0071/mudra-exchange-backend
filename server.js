// import package
import express from "express";
import passport from "passport";
import morgan from "morgan";
import cors from "cors";
import http from "http";
import https from "https";
import bodyParser from "body-parser";
const newsletterApi = require('./routes/api/newsletter');

import config from "./config";
import dbConnection from "./config/dbConnection";
import { createSocketIO } from "./config/socketIO";
import "./config/cron";

// import routes
import adminApi from "./routes/admin.route";
import userApi from "./routes/user.route";

import appApi from "./routes/app_user.route";
import v1Api from "./routes/v1.route";

// import controller
import * as priceCNVCtrl from "./controllers/priceCNV.controller";
import rateLimit from "express-rate-limit";
import usersRouter from "./routes/api/users.js";  // Note: you'll need to rename users.js to ensure .js extension
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const app = express();
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 10, // Limit each IP to 10 requests per `window` (here, per 1 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
process.on("uncaughtException", (err) => {
  // console.log("error is: " ,err)
  if ((process.env.NODE_ENV !="demo")&&(process.env.NODE_ENV!="production")){
    // console.log("erorrrrrrrrrrr/////////rrrrrrrrrrrr");
  }
});
// Apply the rate limiting middleware to all requests
app.use("/api/v1", limiter);
var ip = require("ip");
var fs = require("fs");
var myip = ip.address();

console.log(myip, "ip");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(cors("*"));
app.use(
  bodyParser.urlencoded({
    extended: false,
    limit: '5mb'
  })
);
app.use(bodyParser.json({ limit: '5mb' }));
app.use(passport.initialize());

// include passport stratagy
require("./config/passport").usersAuth(passport);
require("./config/passport").adminAuth(passport);

app.use(express.static(__dirname + "/public"));

// coin
app.get("/test", (req, res) => {
  console.log("successfully");
});

app.use("/adminApi", [adminApi, newsletterApi]);
app.use("/api", userApi);
app.use("/admin", userApi);
app.use("/appapi", appApi);
app.use("/api/v1", v1Api);
app.use("/api/users", usersRouter);

app.get("/testAPI", (req, res) => {
  // return res.send("Successfully Testing")
  return res.send(`
  <h1>API worok</h1>
  `);
});

if (myip == "172.105.40.100") {
  // const options = {
  //   key: fs.readFileSync("/home/mudra/ssl/mudraapi.wealwin.com.key"),
  //   cert: fs.readFileSync("/home/mudra/ssl/mudraapi.wealwin.com.crt"),
  // };
  // var server = https.createServer(options, app);
  var server = http.createServer(app);

} else {
  var server = http.createServer(app);
}

app.get("/", function (req, res) {
  res.json({ status: true });
});

createSocketIO(server);

// DATABASE CONNECTION
dbConnection((done) => {
  if (done) {
    server = server.listen(config.PORT, function () {
      console.log(
        "\x1b[34m%s\x1b[0m",
        `server is running on port ${config.PORT}`
      );
    });
  }
});


