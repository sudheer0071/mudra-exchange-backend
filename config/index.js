// let key = {};

// if (process.env.NODE_ENV === "production") {
//   console.log("\x1b[35m%s\x1b[0m", `Set Production Config`);

//   const API_URL = "https://producationapi.mudra.exchange"; //live
//   const PORT = 2053;


//   key = {
//     SITE_NAME: "Mudra Exchange",
//     secretOrKey: "test",
//     cryptoSecretKey: "1234567812345678",

//     // live
//     DATABASE_URL:
//       "mongodb://exchangeapidb:aT3PbGL1C9rG33K7T3VbBipGxX8A@127.0.0.1:27000/exchangeapidb", //live
//     PORT: PORT,
//     FRONT_URL: "https://mudra.exchange",
//     ADMIN_URL: "https://controls.mudra.exchange",
//     // SERVER_URL: `${API_URL}:${PORT}`,
//     SERVER_URL: "https://producationapi.mudra.exchange",
//     // IMAGE_URL: `${API_URL}`,
//     IMAGE_URL: "https://producationapi.mudra.exchange",
//     // RECAPTCHA_SECRET_KEY:"6LeqMQwcAAAAAGhqxaoHE7HilIk63wul6m8oyQwC",
//     RECAPTCHA_SECRET_KEY: "6LdBy14dAAAAAFT-aGUaz3QFdILPrLN5M05IwILL", //MUDREAX
//     P2P_ChatTime: 30,

//     emailGateway: {
//       SENDGRID_API_KEY: "G2_6DHfmSaWcrRQ1RxTHrQ",
//       fromMail: "info@mudra.exchange",
//       nodemailer: {
//         host: "smtp.zoho.in",
//         port: 465,
//         secure: true,
//         tls: {
//           rejectUnauthorized: false,
//         }, // true for 465, false for other ports
//         auth: {
//           user: "info@mudra.exchange",
//           // generated ethereal user
//           pass: "Info@123$", // generated ethereal password
//         },
//       },
//     },
//     coinGateway: {
//       eth: {
//         mode: "live", // infura
//         address: "0xd58305e38D3379C990a228a3F2b719839A64A574",
//         privateKey: "U2FsdGVkX1+SXRvttRlkL0Mvw+RNkhQefwqzY/3XfS4Ozjb4TPkz+KUo4p1mm1t9xy+LA9ro4Ikv6izvXyw0WRSWFlp4dcf6VlaZPURrCfeCVpBygQ6HcDAlp4+wEULZ",
//         ethDepositUrl: "https://api.etherscan.io/api?module=account&action=txlist&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=CSM5YXQG5MTE8XWM57UWH6DBXQRS8SQP3K",
//         ethTokenDepositUrl: "https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=##CONTRACT_ADDRESS##&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=CSM5YXQG5MTE8XWM57UWH6DBXQRS8SQP3K",
//       },
//       bnb: {
//         id:"e5ed28cc-d19a-4770-a3e4-b56f3818cb6b",
//         serverURL:"https://bnbcheckapi.mudra.exchange/bnb", // infura
//         mode: "test", // infura
//         address: "0x7618A81355053E112C112cA92Ec3d49a2b2015FE",
//         privateKey: "U2FsdGVkX19sKiJap4KPCiVTRoYodxctYsMqF+ryQ0bQROg12kB2TlJdAoiFGCebYVvhPL08poKiBvOA6K4SvmLibAU9sixpvkW+HCsSZCNXjVJ6BJ3A3NkDLUWj3p66",
//        },
//       btc: {
//         url: "http://3.1.6.100:3003",
//       },
//     },

//     //Sms Gateway
//     smsGateway: {
//       TWILIO_ACCOUT_SID: "ACba7cc76128227cdbab3b61d1479025ea",
//       TWILIO_AUTH_TOKEN: "bcf18252a7907ed8f693dcbe22af6382",
//       TWILIO_PHONE_NUMBER: "+19036508262",
//     },

//     IMAGE: {
//       DEFAULT_SIZE: 1 * 1024 * 1024, // 1 MB,
//       PROFILE_PATH: "public/images/profile",
//       URL_PATH: "/images/profile/",
//       PROFILE_SIZE: 1 * 1024 * 1024, // 1 MB
//       ID_DOC_SIZE: 12 * 1024 * 1024, // 12 MB,
//       KYC_PATH: "public/images/kyc",
//       KYC_URL_PATH: "/images/kyc/",
//       CURRENCY_SIZE: 0.02 * 1024 * 1024, // 20 KB
//       CURRENCY_PATH: "public/currency",
//       CURRENCY_URL_PATH: "/currency/",
//       DEPOSIT_PATH: "public/deposit",
//       DEPOSIT_URL_PATH: "/deposit/",
//       SETTINGS_PATH: "public/settings",
//       SETTINGS_URL_PATH: "/settings/",
//       LAUNCHPAD_WHITEPAPER_PATH: "public/images/launchpad/whitePaper",
//       LAUNCHPAD_WHITEPAPER_URL_PATH: "/images/launchpad/whitePaper/",
//       EDITOR_PATH: "public/images/tinymce",
//       SUPPORT_PATH: "public/images/support",
//       SUPPORT_URL_PATH: "/images/support/",
//     },

//     WAZIRIX: {
//       API: "EPqF2F9WVuEaPC0naJoHk1VVyR8ZTuknGShHTmACnrBDA402zpoZYZiOzGqCoRkf", //using for orderplace
//       SECRET: "HJzLo1yrMm9iWf1Tc3Px0uxx61YxlR8OxwURr3xe", //using for orderplace
//       Email: "mudraex@gmail.com",
//       PhoneNo: "9873188583"
//     },
//     NODE_TWOFA: {
//       NAME: "Mudra Exchange",
//       QR_IMAGE:
//         "https://quickchart.io/chart?cht=qr&chs=150x150&chl=",
//     },

//     BINANCE_GATE_WAY: {
//       API_KEY:
//         "wDRjuSt45c9hgPOHyWatJaLUTKxrWbR2x9u5uWgbpNiT3oudKaYUvg3t35f8FsLR",
//       API_SECRET:
//         "CPQVcPDoXZXpQKa9IGdctPHlveyVy1ntbNE4IHrMMzb3TAsmy4XxYT56PLu6GNbo",
//       Email: "mudraex@gmail.com",
//       PhoneNo: "9873188583"
//     },
//     coinpaymentGateway: {
//       PUBLIC_KEY:
//         "eb3c8aea9db504f331b442f2e3cf9df702c99b976ff4ad8993abbab29d415b77",
//       PRIVATE_KEY:
//         "434b44dC8b78652845c3C812b25d9eaa8a71750831e9eD4f37156f06387fb50D",
//       IPN_SECRET: "mkvxrbazad",
//       MERCHANT_ID: "d004345a8dc87fec392634f5a2260009",
//     },
//     CLOUDINARY_GATE_WAY: {
//       CLOUD_NAME: "",
//       API_KEY: "",
//       API_SECRET: "",
//     },
//     COINMARKETCAP: {
//       API_KEY: "6dc35eeb-ba06-418a-8367-3dead803dd3b",
//       PRICE_CONVERSION:
//         "https://pro-api.coinmarketcap.com/v1/tools/price-conversion",
//     },
//     ICOAPI: "https://producationicoapi.mudra.exchange",
//     zaakpayurl: "https://api.zaakpay.com/api/paymentTransact/V8",
//     MerchantID: "2955a6b7be264d07ac7aa525bc560c17",
//     returnUrl: "https://producationapi.mudra.exchange/api/zaakpay/zaakpayconfirmed",
//     zaaksecretkey: "e7d6d03069c448e685b1ce0237f37aed",
//     zaakrespurl: "https://mudra.exchange/wallet",
//   };
// } else if (process.env.NODE_ENV === "demo") {
//   console.log("\x1b[35m%s\x1b[0m", `Set demo Config in test`);

//   const API_URL = "https://mudraapi.wealwin.com"; // demo
//   const PORT = 2053;
//   key = {
//     SITE_NAME: "Mudra Exchange",
//     secretOrKey: "test",
//     cryptoSecretKey: "1234567812345678",

//     // demo
//     PORT: PORT,
//     FRONT_URL: "https://mudra.wealwin.com", // demo
//     ADMIN_URL: "https://mudraexchange-adminpanel.pages.dev", // demo
//     SERVER_URL: `${API_URL}`, // demo
//     IMAGE_URL: `${API_URL}`, // demo
//     RECAPTCHA_SECRET_KEY: "6LdfEEIcAAAAAJSzSbMQlDS4foTXt6QI-_g2s8pe", // demo
//     DATABASE_URL:
//       "mongodb://dbUser:dbPassword123@127.0.0.1:27017/exchangeLocaldb", //demo
//     P2P_ChatTime: 5,
//     emailGateway: {
//       fromMail: "developer@dev.wealwin.com",
//       nodemailer: {
//         host: "smtp.hostinger.com",
//         port: 465,
//         secure: true, // true for 465, false for other ports
//         auth: {
//           user: "developer@dev.wealwin.com",
//           pass: "WeAlwin___MA1L___niwlAeW"
//         }
//       }
//     },

//     coinGateway: {
//       eth: {
//         mode: "test", // ropsten
//         address: "0x206aD4B0336748De93f5F40A783AC8FF22E6200e",
//         privateKey: "U2FsdGVkX19JFIZdkQGzWTqdJn4j8MM5kveci6jMfXeHIU8kyPMggiEUPgH0IwWLWZwb/VEBC5RaTGFKAMfeBfAHbuVmDGA9D+QbeJSwOCs9ANLPbLIkG1JcTlD3TI/4",
//         ethDepositUrl: "https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=QIPV7D2WGWGEU4HYPVABFP4WD46VRW3SYR",
//         ethTokenDepositUrl: "https://api-sepolia.etherscan.io/api?module=account&action=tokentx&contractaddress=##CONTRACT_ADDRESS##&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=QIPV7D2WGWGEU4HYPVABFP4WD46VRW3SYR",
//       },
//       bnb: {
//         id:"e5ed28cc-d19a-4770-a3e4-b56f3818cb6b",
//         serverURL:"https://bnbcheckapi.mudra.exchange/bnb", // infura
//         mode: "test", // infura
//         address: "0x0EB31F690937CAD54dC68AE9d076B6b8Ba19f4Ad",
//         privateKey: "U2FsdGVkX1+ogyPEP94ySTWAft7WffbHR0PyOaBCPIR8ZtsHJ/9J45RhxgdKw/09K8mVj+/ZvUaASPUYJLRk5NxyPMV0l/eCWO/gyGrssceZH5e7gSZcehDpiKLmE8yB",
//        },
//       btc: {
//         url: "http://3.1.6.100:3003",
//       },
//     },



//     //Sms Gateway
//     smsGateway: {
//       TWILIO_ACCOUT_SID: "ACba7cc76128227cdbab3b61d1479025ea",
//       TWILIO_AUTH_TOKEN: "bcf18252a7907ed8f693dcbe22af6382",
//       TWILIO_PHONE_NUMBER: "+19036508262",
//     },

//     IMAGE: {
//       DEFAULT_SIZE: 1 * 1024 * 1024, // 1 MB,
//       PROFILE_PATH: "public/images/profile",
//       URL_PATH: "/images/profile/",
//       PROFILE_SIZE: 1 * 1024 * 1024, // 1 MB
//       ID_DOC_SIZE: 12 * 1024 * 1024, // 12 MB,
//       KYC_PATH: "public/images/kyc",
//       KYC_URL_PATH: "/images/kyc/",
//       CURRENCY_SIZE: 0.02 * 1024 * 1024, // 20 KB
//       CURRENCY_PATH: "public/currency",
//       CURRENCY_URL_PATH: "/currency/",
//       DEPOSIT_PATH: "public/deposit",
//       DEPOSIT_URL_PATH: "/deposit/",
//       SETTINGS_PATH: "public/settings",
//       SETTINGS_URL_PATH: "/settings/",
//       LAUNCHPAD_WHITEPAPER_PATH: "public/images/launchpad/whitePaper",
//       LAUNCHPAD_WHITEPAPER_URL_PATH: "/images/launchpad/whitePaper/",
//       EDITOR_PATH: "public/images/tinymce",
//       SUPPORT_PATH: "public/images/support",
//       SUPPORT_URL_PATH: "/images/support/",
//     },

//     WAZIRIX: {
//       API: "EPqF2F9WVuEaPC0naJoHk1VVyR8ZTuknGShHTmACnrBDA402zpoZYZiOzGqCoRkf", //using for orderplace
//       SECRET: "HJzLo1yrMm9iWf1Tc3Px0uxx61YxlR8OxwURr3xe", //using for orderplace
//       Email: "mudraex@gmail.com",
//       PhoneNo: "9873188583"
//     },
//     NODE_TWOFA: {
//       NAME: "Mudra Exchange",
//       QR_IMAGE:
//         "https://quickchart.io/chart?cht=qr&chs=150x150&chl=",
//     },

//     BINANCE_GATE_WAY: {
//       API_KEY:
//         "wDRjuSt45c9hgPOHyWatJaLUTKxrWbR2x9u5uWgbpNiT3oudKaYUvg3t35f8FsLR",
//       API_SECRET:
//         "CPQVcPDoXZXpQKa9IGdctPHlveyVy1ntbNE4IHrMMzb3TAsmy4XxYT56PLu6GNbo",
//       Email: "mudraex@gmail.com",
//       PhoneNo: "9873188583"
//     },
//     coinpaymentGateway: {
//       PUBLIC_KEY:
//         "eb3c8aea9db504f331b442f2e3cf9df702c99b976ff4ad8993abbab29d415b77",
//       PRIVATE_KEY:
//         "434b44dC8b78652845c3C812b25d9eaa8a71750831e9eD4f37156f06387fb50D",
//       IPN_SECRET: "mkvxrbazad",
//       MERCHANT_ID: "d004345a8dc87fec392634f5a2260009",
//     },
//     CLOUDINARY_GATE_WAY: {
//       CLOUD_NAME: "",
//       API_KEY: "",
//       API_SECRET: "",
//     },
//     COINMARKETCAP: {
//       API_KEY: "6dc35eeb-ba06-418a-8367-3dead803dd3b",
//       PRICE_CONVERSION:
//         "https://pro-api.coinmarketcap.com/v1/tools/price-conversion",
//     },
//     ICOAPI: "https://mudraicoapi.wealwin.com/",
//     zaakpayurl: "https://api.zaakpay.com/api/paymentTransact/V8",
//     MerchantID: "2955a6b7be264d07ac7aa525bc560c17",
//     returnUrl: "https://api.mudra.exchange/api/zaakpay/zaakpayconfirmed",
//     zaaksecretkey: "e7d6d03069c448e685b1ce0237f37aed",
//     zaakrespurl: "https://mudra.exchange/wallet",
//   };
// } else {
//   console.log("running in locallyyy")

//   console.log("\x1b[35m%s\x1b[0m", `Set Development Config`);

//   const API_URL = "http://localhost";
//   const PORT = 2054;
//   key = {
//     SITE_NAME: "Mudra Exchange",

//     secretOrKey: "test",

//     cryptoSecretKey: "1234567812345678",
   
 
//     // DATABASE_URL: "mongodb://127.0.0.1:27017/exchangeLocaldb",
//     DATABASE_URL: "mongodb://dbUser:dbPassword123@127.0.0.1:27000/exchangeLocaldb",
//     // DATABASE_URL: "mongodb://exchangeapidb:aT3PbGL1C9rG33K7T3VbBipGxX8A@170.187.238.202:27000/exchangeapidb",
   

//     PORT: PORT,
//     FRONT_URL: "http://localhost:3000",
//     ADMIN_URL: "http://localhost:3001/admin",
//     SERVER_URL: `${API_URL}:${PORT}`,
//     // RECAPTCHA_SECRET_KEY:"6Ld9F-QcAAAAAKF6sXAceH7uk4OX2Y9V7Nlzqklr",
//     RECAPTCHA_SECRET_KEY: "6LfwpSkhAAAAAHtt8zDAkdI4GoKTKoQ3uSrzDukK",
//     //,6Lf-oQAaAAAAABqwBZFTvAk0BKkjZUL9gDZdtEbZ
//     // P2P_ChatTime:2,
//     //Sms Gateway
//     smsGateway: {
//       TWILIO_ACCOUT_SID: "ACca541baaa0d4fbfd5c865186130d19cf",
//       TWILIO_AUTH_TOKEN: "03b2b6633d709f20bb85c60f0a5737e7",
//       TWILIO_PHONE_NUMBER: "+18608314564",
//     },

//     emailGateway: {
//       fromMail: "developer@dev.wealwin.com",
//       nodemailer: {
//         host: "smtp.hostinger.com",
//         port: 465,
//         secure: true, // true for 465, false for other ports
//         auth: {
//           user: "developer@dev.wealwin.com",
//           pass: "WeAlwin___MA1L___niwlAeW"
//         }
//       }
//     },
    

//     IMAGE: {
//       DEFAULT_SIZE: 1 * 1024 * 1024, // 1 MB,
//       PROFILE_PATH: "public/images/profile",
//       URL_PATH: "/images/profile/",
//       PROFILE_SIZE: 1 * 1024 * 1024, // 1 MB
//       ID_DOC_SIZE: 12 * 1024 * 1024, // 12 MB,
//       KYC_PATH: "public/images/kyc",
//       KYC_URL_PATH: "/images/kyc/",
//       CURRENCY_SIZE: 0.02 * 1024 * 1024, // 20 KB
//       CURRENCY_PATH: "public/currency",
//       CURRENCY_URL_PATH: "/currency/",
//       DEPOSIT_PATH: "public/deposit",
//       DEPOSIT_URL_PATH: "/deposit/",
//       SETTINGS_PATH: "public/settings",
//       SETTINGS_URL_PATH: "/settings/",
//       LAUNCHPAD_WHITEPAPER_PATH: "public/images/launchpad/whitePaper",
//       LAUNCHPAD_WHITEPAPER_URL_PATH: "/images/launchpad/whitePaper/",
//       SUPPORT_PATH: "public/images/support",
//       SUPPORT_URL_PATH: "/images/support/",
//       EDITOR_PATH: "public/images/tinymce",
//     },

//     WAZIRIX: {
//       API: "EPqF2F9WVuEaPC0naJoHk1VVyR8ZTuknGShHTmACnrBDA402zpoZYZiOzGqCoRkf", //using for orderplace
//       SECRET: "HJzLo1yrMm9iWf1Tc3Px0uxx61YxlR8OxwURr3xe", //using for orderplace
//       Email: "mudraex@gmail.com",
//       PhoneNo: "9873188583"
//     },


//     NODE_TWOFA: {
//       NAME: "Mudra Exchange",
//       QR_IMAGE:
//         "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=",
//     },

//     coinGateway: {
//       eth: {
//         mode: "test", // ropsten
//         address: "0x206aD4B0336748De93f5F40A783AC8FF22E6200e",
//         privateKey: "U2FsdGVkX19JFIZdkQGzWTqdJn4j8MM5kveci6jMfXeHIU8kyPMggiEUPgH0IwWLWZwb/VEBC5RaTGFKAMfeBfAHbuVmDGA9D+QbeJSwOCs9ANLPbLIkG1JcTlD3TI/4",
//         ethDepositUrl: "https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=QIPV7D2WGWGEU4HYPVABFP4WD46VRW3SYR",
//         ethTokenDepositUrl: "https://api-sepolia.etherscan.io/api?module=account&action=tokentx&contractaddress=##CONTRACT_ADDRESS##&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=QIPV7D2WGWGEU4HYPVABFP4WD46VRW3SYR",
//       },
//       bnb: {
//         id:"e5ed28cc-d19a-4770-a3e4-b56f3818cb6b",
//         serverURL:"https://bnbcheckapi.mudra.exchange/bnb", // infura
//         mode: "test", // infura
//         address: "0x0EB31F690937CAD54dC68AE9d076B6b8Ba19f4Ad",
//         privateKey: "U2FsdGVkX1+ogyPEP94ySTWAft7WffbHR0PyOaBCPIR8ZtsHJ/9J45RhxgdKw/09K8mVj+/ZvUaASPUYJLRk5NxyPMV0l/eCWO/gyGrssceZH5e7gSZcehDpiKLmE8yB",
//        },
//       btc: {
//         url: "http://3.1.6.100:3003",
//       },
//     },

 
//     BINANCE_GATE_WAY: {
//       API_KEY:
//         "KrsF9HDc4NfArY0b7jurYVugWbfCatCnXOyx5bINDoPth4haWEB45BGceniTYIha",
//       API_SECRET:
//         "CDd7t2W7XjfJinaIjmUBevWhZArF6Jy6RTeLnnoi3y5hVj130NU1pfj95xJPtnId",
//       Email: "mudraex@gmail.com",
//       PhoneNo: "9873188583"
//     },
//     coinpaymentGateway: {
//       PUBLIC_KEY:
//         "eb3c8aea9db504f331b442f2e3cf9df702c99b976ff4ad8993abbab29d415b77",
//       PRIVATE_KEY:
//         "434b44dC8b78652845c3C812b25d9eaa8a71750831e9eD4f37156f06387fb50D",
//       IPN_SECRET: "mkvxrbazad",
//       MERCHANT_ID: "d004345a8dc87fec392634f5a2260009",
//     },
//     CLOUDINARY_GATE_WAY: {
//       CLOUD_NAME: "",
//       API_KEY: "",
//       API_SECRET: "",
//     },
//     COINMARKETCAP: {
//       API_KEY: "6dc35eeb-ba06-418a-8367-3dead803dd3b",
//       PRICE_CONVERSION:
//         "https://pro-api.coinmarketcap.com/v1/tools/price-conversion",
//     },
//     ICOAPI: "http://localhost:2054",
//     zaakpayurl: "https://zaakstaging.zaakpay.com/api/paymentTransact/V8",
//     MerchantID: "fb2016ffd3a64b2994a6289dc2b671a4",
//     returnUrl: "http://localhost:2053/api/zaakpay/zaakpayconfirmed",
//     zaaksecretkey: "0678056d96914a8583fb518caf42828a",
//     zaakrespurl: "http://localhost:3000/profile",
//   };
// }

// export default key;


let key = {};

if (process.env.NODE_ENV === "production") {
  console.log("\x1b[35m%s\x1b[0m", `Set Production Config`);

  const API_URL = "https://producationapi.mudra.exchange"; //live
  const PORT = 2053;


  key = {
    SITE_NAME: "Mudra Exchange",
    secretOrKey: "test",
    cryptoSecretKey: "1234567812345678",

    // live
    DATABASE_URL:
      "mongodb://exchangeapidb:aT3PbGL1C9rG33K7T3VbBipGxX8A@127.0.0.1:27000/exchangeapidb", //live
    PORT: PORT,
    FRONT_URL: "https://mudra.exchange",
    ADMIN_URL: "https://controls.mudra.exchange",
    // SERVER_URL: `${API_URL}:${PORT}`,
    SERVER_URL: "https://producationapi.mudra.exchange",
    // IMAGE_URL: `${API_URL}`,
    IMAGE_URL: "https://producationapi.mudra.exchange",
    // RECAPTCHA_SECRET_KEY:"6LeqMQwcAAAAAGhqxaoHE7HilIk63wul6m8oyQwC",
    RECAPTCHA_SECRET_KEY: "6LdBy14dAAAAAFT-aGUaz3QFdILPrLN5M05IwILL", //MUDREAX
    P2P_ChatTime: 30,

    emailGateway: {
      SENDGRID_API_KEY: "G2_6DHfmSaWcrRQ1RxTHrQ",
      fromMail: "info@mudra.exchange",
      nodemailer: {
        host: "smtp.zoho.in",
        port: 465,
        secure: true,
        tls: {
          rejectUnauthorized: false,
        }, // true for 465, false for other ports
        auth: {
          user: "info@mudra.exchange",
          // generated ethereal user
          pass: "Info@123$", // generated ethereal password
        },
      },
    },
    coinGateway: {
      eth: {
        mode: "live", // infura
        address: "0xd58305e38D3379C990a228a3F2b719839A64A574",
        privateKey: "U2FsdGVkX1+SXRvttRlkL0Mvw+RNkhQefwqzY/3XfS4Ozjb4TPkz+KUo4p1mm1t9xy+LA9ro4Ikv6izvXyw0WRSWFlp4dcf6VlaZPURrCfeCVpBygQ6HcDAlp4+wEULZ",
        ethDepositUrl: "https://api.etherscan.io/api?module=account&action=txlist&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=CSM5YXQG5MTE8XWM57UWH6DBXQRS8SQP3K",
        ethTokenDepositUrl: "https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=##CONTRACT_ADDRESS##&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=CSM5YXQG5MTE8XWM57UWH6DBXQRS8SQP3K",
      },
      bnb: {
        id:"e5ed28cc-d19a-4770-a3e4-b56f3818cb6b",
        serverURL:"https://bnbcheckapi.mudra.exchange/bnb", // infura
        mode: "test", // infura
        address: "0x7618A81355053E112C112cA92Ec3d49a2b2015FE",
        privateKey: "U2FsdGVkX19sKiJap4KPCiVTRoYodxctYsMqF+ryQ0bQROg12kB2TlJdAoiFGCebYVvhPL08poKiBvOA6K4SvmLibAU9sixpvkW+HCsSZCNXjVJ6BJ3A3NkDLUWj3p66",
       },
      btc: {
        url: "http://3.1.6.100:3003",
      },
    },

    //Sms Gateway
    smsGateway: {
      TWILIO_ACCOUT_SID: "ACba7cc76128227cdbab3b61d1479025ea",
      TWILIO_AUTH_TOKEN: "bcf18252a7907ed8f693dcbe22af6382",
      TWILIO_PHONE_NUMBER: "+19036508262",
    },

    IMAGE: {
      DEFAULT_SIZE: 1 * 1024 * 1024, // 1 MB,
      PROFILE_PATH: "public/images/profile",
      URL_PATH: "/images/profile/",
      PROFILE_SIZE: 1 * 1024 * 1024, // 1 MB
      ID_DOC_SIZE: 12 * 1024 * 1024, // 12 MB,
      KYC_PATH: "public/images/kyc",
      KYC_URL_PATH: "/images/kyc/",
      CURRENCY_SIZE: 0.02 * 1024 * 1024, // 20 KB
      CURRENCY_PATH: "public/currency",
      CURRENCY_URL_PATH: "/currency/",
      DEPOSIT_PATH: "public/deposit",
      DEPOSIT_URL_PATH: "/deposit/",
      SETTINGS_PATH: "public/settings",
      SETTINGS_URL_PATH: "/settings/",
      LAUNCHPAD_WHITEPAPER_PATH: "public/images/launchpad/whitePaper",
      LAUNCHPAD_WHITEPAPER_URL_PATH: "/images/launchpad/whitePaper/",
      EDITOR_PATH: "public/images/tinymce",
      SUPPORT_PATH: "public/images/support",
      SUPPORT_URL_PATH: "/images/support/",
    },

    WAZIRIX: {
      API: "EPqF2F9WVuEaPC0naJoHk1VVyR8ZTuknGShHTmACnrBDA402zpoZYZiOzGqCoRkf", //using for orderplace
      SECRET: "HJzLo1yrMm9iWf1Tc3Px0uxx61YxlR8OxwURr3xe", //using for orderplace
      Email: "mudraex@gmail.com",
      PhoneNo: "9873188583"
    },
    NODE_TWOFA: {
      NAME: "Mudra Exchange",
      QR_IMAGE:
        "https://quickchart.io/chart?cht=qr&chs=150x150&chl=",
    },

    BINANCE_GATE_WAY: {
      API_KEY:
        "wDRjuSt45c9hgPOHyWatJaLUTKxrWbR2x9u5uWgbpNiT3oudKaYUvg3t35f8FsLR",
      API_SECRET:
        "CPQVcPDoXZXpQKa9IGdctPHlveyVy1ntbNE4IHrMMzb3TAsmy4XxYT56PLu6GNbo",
      Email: "mudraex@gmail.com",
      PhoneNo: "9873188583"
    },
    coinpaymentGateway: {
      PUBLIC_KEY:
        "eb3c8aea9db504f331b442f2e3cf9df702c99b976ff4ad8993abbab29d415b77",
      PRIVATE_KEY:
        "434b44dC8b78652845c3C812b25d9eaa8a71750831e9eD4f37156f06387fb50D",
      IPN_SECRET: "mkvxrbazad",
      MERCHANT_ID: "d004345a8dc87fec392634f5a2260009",
    },
    CLOUDINARY_GATE_WAY: {
      CLOUD_NAME: "",
      API_KEY: "",
      API_SECRET: "",
    },
    COINMARKETCAP: {
      API_KEY: "6dc35eeb-ba06-418a-8367-3dead803dd3b",
      PRICE_CONVERSION:
        "https://pro-api.coinmarketcap.com/v1/tools/price-conversion",
    },
    ICOAPI: "https://producationicoapi.mudra.exchange",
    zaakpayurl: "https://api.zaakpay.com/api/paymentTransact/V8",
    MerchantID: "2955a6b7be264d07ac7aa525bc560c17",
    returnUrl: "https://producationapi.mudra.exchange/api/zaakpay/zaakpayconfirmed",
    zaaksecretkey: "e7d6d03069c448e685b1ce0237f37aed",
    zaakrespurl: "https://mudra.exchange/wallet",
  };
} else if (process.env.NODE_ENV === "demo") {
  console.log("\x1b[35m%s\x1b[0m", `Set demo Config`);

  const API_URL = "https://mudraapi.wealwin.com"; // demo
  const PORT = 3503;
  key = {
    SITE_NAME: "Mudra Exchange",
    secretOrKey: "test",
    cryptoSecretKey: "1234567812345678",

    // demo
    PORT: PORT,
    FRONT_URL: "https://mudra.wealwin.com", // demo
    ADMIN_URL: "https://mudraexchange-adminpanel.pages.dev", // demo
    SERVER_URL: `${API_URL}`, // demo
    IMAGE_URL: `${API_URL}`, // demo
    RECAPTCHA_SECRET_KEY: "6LebygErAAAAABZ0yDRPXfqPLSbdxnty16h6zAGQ", // demo
    DATABASE_URL:
      "mongodb://mudradb:KCasajcnascascsacsdew@127.0.0.1:27000/mudradb", //demo
    P2P_ChatTime: 5,
    emailGateway: {
      fromMail: "developer@dev.wealwin.com",
      nodemailer: {
        host: "smtp.hostinger.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: "developer@dev.wealwin.com",
          pass: "WeAlwin___MA1L___niwlAeW"
        }
      }
    },

    coinGateway: {
      eth: {
        mode: "test", // ropsten
        address: "0x206aD4B0336748De93f5F40A783AC8FF22E6200e",
        privateKey: "U2FsdGVkX19JFIZdkQGzWTqdJn4j8MM5kveci6jMfXeHIU8kyPMggiEUPgH0IwWLWZwb/VEBC5RaTGFKAMfeBfAHbuVmDGA9D+QbeJSwOCs9ANLPbLIkG1JcTlD3TI/4",
        ethDepositUrl: "https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=QIPV7D2WGWGEU4HYPVABFP4WD46VRW3SYR",
        ethTokenDepositUrl: "https://api-sepolia.etherscan.io/api?module=account&action=tokentx&contractaddress=##CONTRACT_ADDRESS##&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=QIPV7D2WGWGEU4HYPVABFP4WD46VRW3SYR",
      },
      bnb: {
        id:"e5ed28cc-d19a-4770-a3e4-b56f3818cb6b",
        serverURL:"https://bnbcheckapi.mudra.exchange/bnb", // infura 
        mode: "test", // infura
        address: "0x0EB31F690937CAD54dC68AE9d076B6b8Ba19f4Ad",
        privateKey: "U2FsdGVkX1+ogyPEP94ySTWAft7WffbHR0PyOaBCPIR8ZtsHJ/9J45RhxgdKw/09K8mVj+/ZvUaASPUYJLRk5NxyPMV0l/eCWO/gyGrssceZH5e7gSZcehDpiKLmE8yB",
       },
      btc: {
        url: "http://3.1.6.100:3003",
      },
    },



    //Sms Gateway
    smsGateway: {
      TWILIO_ACCOUT_SID: "ACba7cc76128227cdbab3b61d1479025ea",
      TWILIO_AUTH_TOKEN: "bcf18252a7907ed8f693dcbe22af6382",
      TWILIO_PHONE_NUMBER: "+19036508262",
    },

    IMAGE: {
      DEFAULT_SIZE: 1 * 1024 * 1024, // 1 MB,
      PROFILE_PATH: "public/images/profile",
      URL_PATH: "/images/profile/",
      PROFILE_SIZE: 1 * 1024 * 1024, // 1 MB
      ID_DOC_SIZE: 12 * 1024 * 1024, // 12 MB,
      KYC_PATH: "public/images/kyc",
      KYC_URL_PATH: "/images/kyc/",
      CURRENCY_SIZE: 0.02 * 1024 * 1024, // 20 KB
      CURRENCY_PATH: "public/currency",
      CURRENCY_URL_PATH: "/currency/",
      DEPOSIT_PATH: "public/deposit",
      DEPOSIT_URL_PATH: "/deposit/",
      SETTINGS_PATH: "public/settings",
      SETTINGS_URL_PATH: "/settings/",
      LAUNCHPAD_WHITEPAPER_PATH: "public/images/launchpad/whitePaper",
      LAUNCHPAD_WHITEPAPER_URL_PATH: "/images/launchpad/whitePaper/",
      EDITOR_PATH: "public/images/tinymce",
      SUPPORT_PATH: "public/images/support",
      SUPPORT_URL_PATH: "/images/support/",
    },

    WAZIRIX: {
      API: "EPqF2F9WVuEaPC0naJoHk1VVyR8ZTuknGShHTmACnrBDA402zpoZYZiOzGqCoRkf", //using for orderplace
      SECRET: "HJzLo1yrMm9iWf1Tc3Px0uxx61YxlR8OxwURr3xe", //using for orderplace
      Email: "mudraex@gmail.com",
      PhoneNo: "9873188583"
    },
    NODE_TWOFA: {
      NAME: "Mudra Exchange",
      QR_IMAGE:
        "https://quickchart.io/chart?cht=qr&chs=150x150&chl=",
    },

    BINANCE_GATE_WAY: {
      API_KEY:
        "wDRjuSt45c9hgPOHyWatJaLUTKxrWbR2x9u5uWgbpNiT3oudKaYUvg3t35f8FsLR",
      API_SECRET:
        "CPQVcPDoXZXpQKa9IGdctPHlveyVy1ntbNE4IHrMMzb3TAsmy4XxYT56PLu6GNbo",
      Email: "mudraex@gmail.com",
      PhoneNo: "9873188583"
    },
    coinpaymentGateway: {
      PUBLIC_KEY:
        "eb3c8aea9db504f331b442f2e3cf9df702c99b976ff4ad8993abbab29d415b77",
      PRIVATE_KEY:
        "434b44dC8b78652845c3C812b25d9eaa8a71750831e9eD4f37156f06387fb50D",
      IPN_SECRET: "mkvxrbazad",
      MERCHANT_ID: "d004345a8dc87fec392634f5a2260009",
    },
    CLOUDINARY_GATE_WAY: {
      CLOUD_NAME: "",
      API_KEY: "",
      API_SECRET: "",
    },
    COINMARKETCAP: {
      API_KEY: "6dc35eeb-ba06-418a-8367-3dead803dd3b",
      PRICE_CONVERSION:
        "https://pro-api.coinmarketcap.com/v1/tools/price-conversion",
    },
    ICOAPI: "https://mudraicoapi.wealwin.com/",
    zaakpayurl: "https://api.zaakpay.com/api/paymentTransact/V8",
    MerchantID: "2955a6b7be264d07ac7aa525bc560c17",
    returnUrl: "https://api.mudra.exchange/api/zaakpay/zaakpayconfirmed",
    zaaksecretkey: "e7d6d03069c448e685b1ce0237f37aed",
    zaakrespurl: "https://mudra.exchange/wallet",
  };
} else {
  console.log("\x1b[35m%s\x1b[0m", `Set Development Config`);

  const API_URL = "http://localhost";
  const PORT = 808;
  key = {
    SITE_NAME: "Mudra Exchange",

    secretOrKey: "test",

    cryptoSecretKey: "1234567812345678",
 
    // DATABASE_URL: "mongodb://dbUser2:dbPassword123@172.26.205.171:27017/exchangeTestdb2", // Local
    DATABASE_URL: "mongodb://localhost:27017/exchangeapilocaldb", // Local
    // DATABASE_URL: "mongodb://dbUser:dbPassword123@127.0.0.1:27000/exchangeLocaldb", // Test linode server



    PORT: PORT,
    FRONT_URL: "http://localhost:3000",
    ADMIN_URL: "http://localhost:3001/admin",
    SERVER_URL: `${API_URL}:${PORT}`,
    // SERVER_URL: "https://producationapi.mudra.exchange",
    IMAGE_URL: "https://producationapi.mudra.exchange", 
    // IMAGE_URL: `${API_URL}:${PORT}`, 
    RECAPTCHA_SECRET_KEY:"6LebygErAAAAABZ0yDRPXfqPLSbdxnty16h6zAGQ",
    // RECAPTCHA_SECRET_KEY: "6LfwpSkhAAAAAHtt8zDAkdI4GoKTKoQ3uSrzDukK",
    //,6Lf-oQAaAAAAABqwBZFTvAk0BKkjZUL9gDZdtEbZ
    // P2P_ChatTime:2,
    //Sms Gateway
    smsGateway: {
      TWILIO_ACCOUT_SID: "ACca541baaa0d4fbfd5c865186130d19cf",
      TWILIO_AUTH_TOKEN: "03b2b6633d709f20bb85c60f0a5737e7",
      TWILIO_PHONE_NUMBER: "+18608314564",
    },



    emailGateway: {
      fromMail: "developer@dev.wealwin.com",
      nodemailer: {
        host: "smtp.hostinger.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: "developer@dev.wealwin.com",
          pass: "WeAlwin___MA1L___niwlAeW"
        }
      }
    },



    IMAGE: {
      DEFAULT_SIZE: 1 * 1024 * 1024, // 1 MB,
      PROFILE_PATH: "public/images/profile",
      URL_PATH: "/images/profile/",
      PROFILE_SIZE: 1 * 1024 * 1024, // 1 MB
      ID_DOC_SIZE: 12 * 1024 * 1024, // 12 MB,
      KYC_PATH: "public/images/kyc",
      KYC_URL_PATH: "/images/kyc/",
      CURRENCY_SIZE: 0.02 * 1024 * 1024, // 20 KB
      CURRENCY_PATH: "public/currency",
      CURRENCY_URL_PATH: "/currency/",
      DEPOSIT_PATH: "public/deposit",
      DEPOSIT_URL_PATH: "/deposit/",
      SETTINGS_PATH: "public/settings",
      SETTINGS_URL_PATH: "/settings/",
      LAUNCHPAD_WHITEPAPER_PATH: "public/images/launchpad/whitePaper",
      LAUNCHPAD_WHITEPAPER_URL_PATH: "/images/launchpad/whitePaper/",
      SUPPORT_PATH: "public/images/support",
      SUPPORT_URL_PATH: "/images/support/",
      EDITOR_PATH: "public/images/tinymce",
    },

    WAZIRIX: {
      API: "EPqF2F9WVuEaPC0naJoHk1VVyR8ZTuknGShHTmACnrBDA402zpoZYZiOzGqCoRkf", //using for orderplace
      SECRET: "HJzLo1yrMm9iWf1Tc3Px0uxx61YxlR8OxwURr3xe", //using for orderplace
      Email: "mudraex@gmail.com",
      PhoneNo: "9873188583"
    },


    NODE_TWOFA: {
      NAME: "Mudra Exchange",
      QR_IMAGE:
        "https://quickchart.io/chart?cht=qr&chs=150x150&chl=",
    },

    coinGateway: {
      eth: {
        mode: "live", // infura
        address: "0xd58305e38D3379C990a228a3F2b719839A64A574",
        privateKey: "U2FsdGVkX1+SXRvttRlkL0Mvw+RNkhQefwqzY/3XfS4Ozjb4TPkz+KUo4p1mm1t9xy+LA9ro4Ikv6izvXyw0WRSWFlp4dcf6VlaZPURrCfeCVpBygQ6HcDAlp4+wEULZ",
        ethDepositUrl: "https://api.etherscan.io/api?module=account&action=txlist&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=CSM5YXQG5MTE8XWM57UWH6DBXQRS8SQP3K",
        ethTokenDepositUrl: "https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=##CONTRACT_ADDRESS##&address=##USER_ADDRESS##&startblock=##START_BLOCK##&endblock=##END_BLOCK##&sort=asc&apikey=CSM5YXQG5MTE8XWM57UWH6DBXQRS8SQP3K",
      },
      bnb: {
        id:"e5ed28cc-d19a-4770-a3e4-b56f3818cb6b",
        // serverURL:"https://bnbcheckapi.mudra.exchange/bnb", // infura Live
        serverURL:"http://localhost:3050/bnb", // infura Local
        mode: "test", // infura
        address: "0x55d83CBafcAAdba6d109055B93E957C9c1B75Df5",
        privateKey: "128951f15be489f66c1262451eaba8ab5a0ca39aa7d662a159a9a9532580c7b9",
       },
      btc: {
        url: "http://3.1.6.100:3003",
      },
    },


    BINANCE_GATE_WAY: {
      API_KEY:
        "KrsF9HDc4NfArY0b7jurYVugWbfCatCnXOyx5bINDoPth4haWEB45BGceniTYIha",
      API_SECRET:
        "CDd7t2W7XjfJinaIjmUBevWhZArF6Jy6RTeLnnoi3y5hVj130NU1pfj95xJPtnId",
      Email: "mudraex@gmail.com",
      PhoneNo: "9873188583"
    },
    coinpaymentGateway: {
      PUBLIC_KEY:
        "eb3c8aea9db504f331b442f2e3cf9df702c99b976ff4ad8993abbab29d415b77",
      PRIVATE_KEY:
        "434b44dC8b78652845c3C812b25d9eaa8a71750831e9eD4f37156f06387fb50D",
      IPN_SECRET: "mkvxrbazad",
      MERCHANT_ID: "d004345a8dc87fec392634f5a2260009",
    },
    CLOUDINARY_GATE_WAY: {
      CLOUD_NAME: "",
      API_KEY: "",
      API_SECRET: "",
    },
    COINMARKETCAP: {
      API_KEY: "6dc35eeb-ba06-418a-8367-3dead803dd3b",
      PRICE_CONVERSION:
        "https://pro-api.coinmarketcap.com/v1/tools/price-conversion",
    },
    ICOAPI: "http://localhost:2054",
    zaakpayurl: "https://zaakstaging.zaakpay.com/api/paymentTransact/V8",
    MerchantID: "fb2016ffd3a64b2994a6289dc2b671a4",
    returnUrl: "http://localhost:2053/api/zaakpay/zaakpayconfirmed",
    zaaksecretkey: "0678056d96914a8583fb518caf42828a",
    zaakrespurl: "http://localhost:3000/profile",
  };
}

export default key;