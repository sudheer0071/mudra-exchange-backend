//import packages
import multer from "multer";
import mongoose from "mongoose";

//import config
import config from "../config";

//import controller
import { createAssetAtAddCurrency } from "./assets.controller";

//import lib
import isEmpty from "../lib/isEmpty";

// Models
import { Launchpad, User, Assets, Currency, launchpadOrder, LaunchpadCms } from "../models";
import { createPassBook } from "./passbook.controller";

const ObjectId = mongoose.Types.ObjectId;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname == "whitePaper") {
      cb(null, config.IMAGE.LAUNCHPAD_WHITEPAPER_PATH);
    } else {
      cb(null, config.IMAGE.CURRENCY_PATH);
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage });
export const LaunchpadUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "whitePaper", maxCount: 1 },
]);

/**
 * Add Launchpad
 * URL : /adminapi/add-launchpad
 * METHOD : POST
 * BODY : tokenName, symbol, availableCurrency, price, minAmt, discount, availableSale, maxSupply, industry, website, content, startDate, endDate
 * FILE : image, whitePaper
 */
export const createLaunchpad = async (req, res) => {
  try {
    let reqBody = req.body;
    let file = req.files;

    let checkCurrency = await Launchpad.findOne({ symbol: reqBody.symbol });

    if (checkCurrency) {
      return res
        .status(400)
        .json({
          status: false,
          errors: { symbol: "currency symbol already exists" },
        });
    }
    const newLaunchpad = new Launchpad({
      tokenName: reqBody.tokenName,
      // tokenType : reqBody.tokenType,
      symbol: reqBody.symbol,
      availableCurrency: reqBody.availableCurrency,
      price: reqBody.price,
      minAmt: reqBody.minAmt,
      discount: reqBody.discount,
      availableSale: reqBody.maxSupply,
      maxSupply: reqBody.maxSupply,
      industry: reqBody.industry,
      website: reqBody.website,
      content: reqBody.content,
      image: file.image[0].filename,
      whitePaper: file.whitePaper[0].filename,
      status: "active",
      startDate: reqBody.startDate,
      endDate: reqBody.endDate,
      telegramLink: reqBody.telegramLink,
      twitterLink: reqBody.twitterLink,
      linkedinLink: reqBody.linkedinLink,
      redditLink: reqBody.redditLink,
      youtubeLink: reqBody.youtubeLink,
      facebookLink: reqBody.facebookLink,
      instagramLink: reqBody.instagramLink,
      decimals: reqBody.decimals,
      contractAddress: reqBody.contractAddress,

    });

    let newData = await newLaunchpad.save();

    let currencyData = await addCurrency({
      currencyName: newData.tokenName,
      currencySymbol: newData.symbol,
      type: "token",
      currencyImage: newData.image,
      tokenType: "erc20",
      isLaunchpad: true,
      contractAddress: reqBody.contractAddress,
      decimals: reqBody.decimals,
      gateWay: "ERC"
    });

    createAssetAtAddCurrency(currencyData);

    if (newData) {
      return res
        .status(200)
        .json({ status: true, message: "Launchpad Added Successfully" });
    }
  } catch (err) {
    console.log(err, "errrrrrrrrrr");
    return res.status(500).json({ status: false, message: "Error On Occured" });
  }
};

export const addCurrency = async ({
  currencyName,
  currencySymbol,
  type,
  currencyImage,
  tokenType,
  isLaunchpad,
  gateWay,
  decimals,
  contractAddress,
}) => {
  try {
    const newRecord = await Currency({
      currencyName: currencyName,
      currencySymbol: currencySymbol,
      type: type,
      currencyImage: currencyImage,
      tokenType: tokenType,
      isLaunchpad: isLaunchpad,
      contractAddress: contractAddress,
      decimals: decimals,
      gateWay: gateWay
    });

    return await newRecord.save();
  } catch (err) {
    console.log(err, "----err");
    return;
  }
};

/**
 * Update Launchpad
 * URL : /adminapi/get-launchpad
 * METHOD : GET
 */

export const getLaunchpad = async (req, res) => {
  try {
    let launchpadData = await Launchpad.find({}).sort({ _id: -1 });
    if (launchpadData) {
      return res.status(200).json({ status: true, data: launchpadData });
    }
  } catch (err) {
    console.log(err, "----err");
    return res.status(500).json({ status: false, message: "Error On Occured" });
  }
};


/**
 * Update Launchpad
 * URL : /adminapi/launchpad-change-status
 * METHOD : POST
 * BODY : _id
 */

export const changeStatus = async (req, res) => {
  let launchpadData = await Launchpad.findOne({ _id: ObjectId(req.body._id) });
  var title,
    updateData = {};
  if (launchpadData.status == "active") {
    title = "Deactivated";
    updateData["status"] = "inactive";
  } else {
    title = "Activated";
    updateData["status"] = "active";
  }
  if (launchpadData.status != "active") {
    return res.status(400).json({ status: false, message: "Token not active" });
  }
  Launchpad.findOneAndUpdate(
    { _id: ObjectId(req.body._id) },
    { $set: updateData },
    { new: true }
  ).exec(function (uperr, resUpdate) {
    if (!uperr) {
      res.json({
        status: true,
        message: "Status " + title + " successfully",
      });
    }
  });
};

/**
 * Update Launchpad
 * URL : /adminapi/update-launchpad
 * METHOD : POST
 * BODY : tokenName, symbol, availableCurrency, price, minAmt, discount, availableSale, maxSupply, industry, website, content, startDate, endDate
 * FILE : image, whitePaper
 */
function convertLocalToUTC(localDate) {
  var localOffset = localDate.getTimezoneOffset() * 60000; // Offset in milliseconds

  var utcTime = localDate.getTime() + localOffset;
  var utcDate = new Date(utcTime);
  return utcDate;
}
export const updateLaunchpad = async (req, res) => {
  try {
    let reqBody = req.body;
    const file = req.files;

console.log("reqBodyreqBodyreqBodyreqBody",new Date(reqBody.startDate));
    let checkCurrency = await Launchpad.findOne({
      _id: { $ne: reqBody._id },
      symbol: reqBody.symbol,
    });

    if (checkCurrency) {
      return res
        .status(400)
        .json({
          status: false,
          errors: { symbol: "currency symbol already exists" },
        });
    }
    let updateData = {};
    if (
      !isEmpty(file) &&
      !isEmpty(file.image) &&
      !isEmpty(file.image[0]) &&
      isEmpty(file.whitePaper)
    ) {
      console.log("******************** IMAGE *************************");
      updateData = {
        tokenName: reqBody.tokenName,
        symbol: reqBody.symbol,
        availableCurrency: reqBody.availableCurrency,
        price: reqBody.price,
        minAmt: reqBody.minAmt,
        discount: reqBody.discount,
        // availableSale : reqBody.availableSale,
        maxSupply: reqBody.maxSupply,
        industry: reqBody.industry,
        website: reqBody.website,
        content: reqBody.content,
        image: file.image[0].filename,
        // whitePaper : file.whitePaper[0].filename,
        status: 'active',
        tokenStatus: '',
        startDate: reqBody.startDate,
        endDate: reqBody.endDate,
        telegramLink: reqBody.telegramLink,
        twitterLink: reqBody.twitterLink,
        linkedinLink: reqBody.linkedinLink,
        redditLink: reqBody.redditLink,
        youtubeLink: reqBody.youtubeLink,
        facebookLink: reqBody.facebookLink,
        instagramLink: reqBody.instagramLink,
        contractAddress: reqBody.contractAddress,
        decimals: reqBody.decimals,
      };
    } else if (
      !isEmpty(file) &&
      !isEmpty(file.whitePaper) &&
      !isEmpty(file.whitePaper[0]) &&
      isEmpty(file.image)
    ) {
      console.log("******************** WHITE PAPER *************************");
      updateData = {
        tokenName: reqBody.tokenName,
        symbol: reqBody.symbol,
        availableCurrency: reqBody.availableCurrency,
        price: reqBody.price,
        minAmt: reqBody.minAmt,
        discount: reqBody.discount,
        // availableSale : reqBody.availableSale,
        maxSupply: reqBody.maxSupply,
        industry: reqBody.industry,
        website: reqBody.website,
        content: reqBody.content,
        // image : file.image[0].filename,
        whitePaper: file.whitePaper[0].filename,
        status: 'active',
        tokenStatus: '',
        startDate: reqBody.startDate,
        endDate: reqBody.endDate,
        telegramLink: reqBody.telegramLink,
        twitterLink: reqBody.twitterLink,
        linkedinLink: reqBody.linkedinLink,
        redditLink: reqBody.redditLink,
        youtubeLink: reqBody.youtubeLink,
        facebookLink: reqBody.facebookLink,
        instagramLink: reqBody.instagramLink,
        contractAddress: reqBody.contractAddress,
        decimals: reqBody.decimals,
      };
    } else if (
      !isEmpty(file) &&
      !isEmpty(file.whitePaper) &&
      !isEmpty(file.whitePaper[0]) &&
      !isEmpty(file.image[0])
    ) {
      console.log(
        "********************IMAGE && WHITE PAPER *************************"
      );
      updateData = {
        tokenName: reqBody.tokenName,
        symbol: reqBody.symbol,
        availableCurrency: reqBody.availableCurrency,
        price: reqBody.price,
        minAmt: reqBody.minAmt,
        discount: reqBody.discount,
        // availableSale : reqBody.availableSale,
        maxSupply: reqBody.maxSupply,
        industry: reqBody.industry,
        website: reqBody.website,
        content: reqBody.content,
        image: file.image[0].filename,
        whitePaper: file.whitePaper[0].filename,
        status: 'active',
        tokenStatus: '',
        startDate: reqBody.startDate,
        endDate: reqBody.endDate,
        telegramLink: reqBody.telegramLink,
        twitterLink: reqBody.twitterLink,
        linkedinLink: reqBody.linkedinLink,
        redditLink: reqBody.redditLink,
        youtubeLink: reqBody.youtubeLink,
        facebookLink: reqBody.facebookLink,
        instagramLink: reqBody.instagramLink,
        contractAddress: reqBody.contractAddress,
        decimals: reqBody.decimals,
      };
    } else {
      updateData = {
        tokenName: reqBody.tokenName,
        symbol: reqBody.symbol,
        availableCurrency: reqBody.availableCurrency,
        price: reqBody.price,
        minAmt: reqBody.minAmt,
        discount: reqBody.discount,
        // availableSale : reqBody.availableSale,
        maxSupply: reqBody.maxSupply,
        industry: reqBody.industry,
        website: reqBody.website,
        content: reqBody.content,
        // image : file.image[0].filename,
        // whitePaper : file.whitePaper[0].filename,
        status: 'active',
        tokenStatus: '',
        startDate: reqBody.startDate,
        endDate: reqBody.endDate,
        telegramLink: reqBody.telegramLink,
        twitterLink: reqBody.twitterLink,
        linkedinLink: reqBody.linkedinLink,
        redditLink: reqBody.redditLink,
        youtubeLink: reqBody.youtubeLink,
        facebookLink: reqBody.facebookLink,
        instagramLink: reqBody.instagramLink,
        contractAddress: reqBody.contractAddress,
        decimals: reqBody.decimals,
      };
      console.log("******************** EMPTY FILES *************************");
    }

    let update = await Launchpad.findOneAndUpdate(
      { _id: reqBody._id },
      { $set: updateData },
      { new: true }
    );


    let newCurrency = await Currency.findOne({ currencySymbol: reqBody.symbol });

    if (!newCurrency) {
   
      let currencyData = await addCurrency({
        currencyName: update.tokenName,
        currencySymbol: update.symbol,
        type: "token",
        currencyImage: update.image,
        tokenType: "erc20",
        isLaunchpad: true,
        contractAddress: update.contractAddress,
        decimals: update.decimals,
        gateWay: "ERC"
      });
      createAssetAtAddCurrency(currencyData);
    }
    if (update) {
      return res
        .status(200)
        .json({ status: true, message: "Launchpad updated successfully" });
    }
  } catch (err) {
    console.log(err, "----errr");
    return res.status(200).json({ status: false, message: "Error On Occured" });
  }
};
export const rejectLaunchpad = async (req, res) => {
  try {
    let reqBody = req.body;
    let update = await Launchpad.findOneAndUpdate(
      { _id: reqBody.id },
      { status: "rejected" },
      { new: true }
    );

    if (update) {
      return res
        .status(200)
        .json({ status: true, message: "Launchpad rejected successfully" });
    } else {
      res.status(200).json({ status: false, message: "Error On Occured" });
    }
  } catch (err) {
    console.log(err, "----errr");
    return res.status(200).json({ status: false, message: "Error On Occured" });
  }
};
/**
 * Update Launchpad
 * URL : /adminapi/delete-launchpad
 * METHOD : POST
 * BODY : _id
 */

export const deleteLaunchpad = async (req, res) => {
  try {
    let deleteData = await Launchpad.deleteOne({ _id: req.body._id });
    if (deleteData) {
      return res
        .status(200)
        .json({
          status: true,
          message: "Launchpad data deleted successfully. Refreshing data...",
        });
    }
  } catch (err) {
    console.log(err, "----errr");
    return res.status(200).json({ status: false, message: "Error On Occured" });
  }
};

/**
 * Update Launchpad
 * URL : /adminapi/getAppLaunchpadList
 * METHOD : GET
 */

export const getAppLaunchpadList = async (req, res) => {
  try {
    let darkList = [];
    let lightList = [];
    let d = await LaunchpadCms.find({ themeMode: "dark" });
    let launchpadData = await LaunchpadCms.find({ themeMode: { $in: ['dark', 'light'] } });
    if (launchpadData.length > 0) {
      launchpadData.map((data, i) => {
        if (data.themeMode == "dark") {
          darkList.push({
            image: data.image
          })
        } else if (data.themeMode == "light") {
          lightList.push({
            image: data.image
          })
        }
      })
    }
    let result = {
      darkList,
      lightList
    }

    return res.status(200).json({ status: true, data: result });

  } catch (err) {
    console.log(err, "----err");
    return res.status(500).json({ status: false, message: "Error On Occured" });
  }
};
/**
 * Update Launchpad List
 * URL : /api/get-launchpad
 * METHOD : GET
 */

export const getLaunchpadList = async (req, res) => {
  try {
    let launchpadActive = await Launchpad.aggregate([
      { $match: { status: "active" } },
      {
        $project: {
          tokenName: 1,
          symbol: 1,
          tokenType: 1,
          availableCurrency: 1,
          price: 1,
          minAmt: 1,
          discount: 1,
          availableSale: 1,
          maxSupply: 1,
          industry: 1,
          website: 1,
          content: 1,
          image: {
            $concat: [
              config.SERVER_URL,
              config.IMAGE.CURRENCY_URL_PATH,
              "$image",
            ],
          },
          whitePaper: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          created_date: 1,
        },
      },
    ]);

    let launchpadCompleted = await Launchpad.aggregate([
      {
        $match: {
          tokenStatus: "completed",
          //  'status': 'active'
        },
      },
      {
        $project: {
          tokenName: 1,
          symbol: 1,
          tokenType: 1,
          availableCurrency: 1,
          price: 1,
          minAmt: 1,
          discount: 1,
          availableSale: 1,
          maxSupply: 1,
          industry: 1,
          website: 1,
          content: 1,
          image: {
            $concat: [
              config.SERVER_URL,
              config.IMAGE.CURRENCY_URL_PATH,
              "$image",
            ],
          },
          whitePaper: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          created_date: 1,
        },
      },
    ]);

    // console.log(launchpadActive,'----------Active')
    // console.log(launchpadCompleted,'----------launchpadCompleted')
    if (launchpadActive && launchpadCompleted) {
      return res
        .status(200)
        .json({
          status: true,
          launchpadActive: {
            data: launchpadActive,
            count: launchpadActive.length,
          },
          launchpadComplete: {
            data: launchpadCompleted,
            count: launchpadCompleted.length,
          },
        });
    }
  } catch (err) {
    console.log(err, "----err");
    return res.status(500).json({ status: false, message: "Error On Occured" });
  }
};

/**
 * Update Launchpad List
 * URL : /api/get-single-launchpad
 * METHOD : GET
 * PARAMS : launchpadId
 */

export const getSingleLaunchpad = async (req, res) => {
  try {
    let launchpadData = await Launchpad.findOne({
      _id: req.params.launchpadId,
    });
    launchpadData.image = `${config.SERVER_URL}${config.IMAGE.CURRENCY_URL_PATH}${launchpadData.image}`;
    launchpadData.whitePaper = `${config.SERVER_URL}${config.IMAGE.LAUNCHPAD_WHITEPAPER_URL_PATH}${launchpadData.whitePaper}`;
    if (launchpadData) {
      return res.status(200).json({ status: true, data: launchpadData });
    }
  } catch (err) {
    console.log(err, "----err");
    return res.status(500).json({ status: false, message: "Error On Occured" });
  }
};

/**
 * users create-launchpad-order
 * URL : /api/create-launchpad-order
 * METHOD : POST
 * BODY : price, amount, totalAmount, currencySymbol, launchpadId
 */

export const createLaunchpadOrder = async (req, res) => {
  try {
    let reqBody = req.body;
    console.log("launchpaddssss", req.body);
    console.log("req.user.idreq.user.idreq.user.id", req.user.id);

    let launchpadData = await Launchpad.findOne({ _id: reqBody.launchpadId });
    let currencyData = await Currency.findOne({
      currencySymbol: reqBody.currencySymbol,
    });
    let userfirstCurrencyAssetData = await Assets.findOne({
      userId: req.user.id,
      currencySymbol: reqBody.currencySymbol,
    });
    let usersecondCurrencyAssetData = await Assets.findOne({
      userId: req.user.id,
      currencySymbol: launchpadData.symbol,
    });

    let total = parseFloat(reqBody.amount) * parseFloat(reqBody.price);
    let finalAmount =
      total - (parseFloat(total) * parseFloat(launchpadData.discount)) / 100;
    // console.log(usersecondCurrencyAssetData,'usersecondCurrencyAssetData')
    if (parseFloat(reqBody.amount) < parseFloat(launchpadData.minAmt)) {
      return res
        .status(400)
        .json({
          status: false,
          message: `Minimum Quantity ${launchpadData.minAmt} ${launchpadData.symbol}`,
        });
    }
    console.log("asdasdasd", launchpadData.startDate, new Date(launchpadData.startDate).getTime(), new Date().getTime());
    if (
      new Date(launchpadData.startDate).getTime() >=
      new Date().getTime() /* || launchpadData.tokenStatus!="active"*/
    ) {
      return res
        .status(400)
        .json({ status: false, message: "Sorry, Token will launch soon, kindly check Token launch time" });
    }
    if (
      new Date(launchpadData.endDate).getTime() <
      new Date().getTime() /* || launchpadData.tokenStatus!="active"*/
    ) {
      return res
        .status(400)
        .json({ status: false, message: "Sorry, Token deadline  is reached" });
    }

    if (parseFloat(userfirstCurrencyAssetData.spotwallet) < finalAmount) {
      return res
        .status(400)
        .json({ status: false, message: "Insufficient Balance" });
    }

    if (parseFloat(launchpadData.availableSale) < parseFloat(reqBody.amount)) {
      return res
        .status(400)
        .json({
          status: false,
          message: "Token available Sale is " + launchpadData.availableSale,
        });
    }

    usersecondCurrencyAssetData.spotwallet =
      parseFloat(usersecondCurrencyAssetData.spotwallet) +
      parseFloat(reqBody.amount);
    await usersecondCurrencyAssetData.save();

    userfirstCurrencyAssetData.spotwallet =
      parseFloat(userfirstCurrencyAssetData.spotwallet) -
      parseFloat(finalAmount);
    await userfirstCurrencyAssetData.save();

    const newData = new launchpadOrder({
      userId: req.user.id,
      launchpadId: launchpadData._id,
      currencyId: currencyData._id,
      discount: launchpadData.discount,
      price: reqBody.price,
      quantity: reqBody.amount,
      total: finalAmount,
      currencySymbol: reqBody.currencySymbol,
    });

    await newData.save();

    let passbookData = {};
    passbookData.userId = newData.userId;
    passbookData.coin = newData.currencySymbol;
    passbookData.currencyId = newData.currencyId;
    passbookData.tableId = newData.launchpadId;
    passbookData.beforeBalance = userfirstCurrencyAssetData.spotwallet;
    passbookData.afterBalance = userfirstCurrencyAssetData.spotwallet;
    passbookData.amount = newData.quantity;
    passbookData.type = "LAUNCHPAD";
    passbookData.category = "debit";
    createPassBook(passbookData);

    launchpadData.availableSale =
      parseFloat(launchpadData.availableSale) - parseFloat(reqBody.amount);
    await launchpadData.save();

    return res
      .status(200)
      .json({ status: true, message: "Token purchased successfully" });
  } catch (err) {
    console.log(err, "----err");
    return res.status(500).json({ status: false, message: "Error On Occured" });
  }
};

/**
 * users launchpad orders history
 * URL : /api/get-launchpad-orders
 * METHOD : GET
 */

export const getLaunchpadHistory = async (req, res) => {
  try {
    let launchpadData = await launchpadOrder.find({
      userId: req.user.id,
      launchpadId: req.params.launchpadId,
    });
    return res.status(200).json({ status: true, result: launchpadData });
  } catch (err) {
    console.log(err, "----err");
    return res.status(500).json({ status: false, message: "Error On Occured" });
  }
};

// cron Function
export const checkLaunchpadEndDate = async () => {
  try {
    let startLaunchpad = await Launchpad.updateMany(
      { startDate: { $lte: new Date() }, tokenStatus: "" },
      { $set: { tokenStatus: "active" } }
    );
    let expiredLaunchpad = await Launchpad.updateMany(
      { endDate: { $lte: new Date() }, status: "active" },
      { $set: { tokenStatus: "completed", status: "inactive" } }
    );
  } catch (err) { }

  // var tokendata = await Launchpad.find({endDate : { $lte : new Date() }})
  // console.log("tokendatatokendatatokendata",tokendata)
  // console.log("tokendatatokendatatokendata",tokendata.length)

  // console.log("expiredLaunchpadexpiredLaunchpadexpiredLaunchpad",expiredLaunchpad)
};

export const getuserlaunchhistory = async (req, res) => {
  try {
    let launchpadData = await launchpadOrder
      .find({ userId: req.user.id })
      .populate("launchpadId");
    // return res.status(200).json({'status':true,'result':launchpadData})
    const count = await launchpadOrder.countDocuments({ userId: req.user.id });

    let result = {
      launchpadData,
      count: count,
    };
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.log(err, "errerererrere");
    return res.status(500).json({ status: false, message: "Error On Occured" });
  }
};


/**
 * users newLauncPadRequest
 * URL : /api/newLauncPadRequest
 * METHOD : POST

 */

export const newLauncPadRequest = async (req, res) => {
  try {
    let reqBody = req.body;
    let file = req.files;
    console.log("launchpaddssss", req.body);
    console.log("req.user.idreq.user.idreq.user.id", req.user.id);
    let checkCurrency = await Launchpad.findOne({ symbol: reqBody.symbol });

    if (checkCurrency) {
      return res
        .status(400)
        .json({
          status: false,
          errors: { symbol: "currency symbol already exists" },
        });
    }
    const newLaunchpad = new Launchpad({
      tokenName: reqBody.tokenName,
      // tokenType : reqBody.tokenType,
      symbol: reqBody.symbol,
      availableCurrency: reqBody.availableCurrency,
      price: parseFloat(reqBody.price),
      // minAmt: parseFloat(0.000001),
      discount: 0,
      availableSale: parseFloat(reqBody.maxSupply),
      maxSupply: parseFloat(reqBody.maxSupply),
      industry: reqBody.industry,
      website: reqBody.website,
      content: reqBody.content,
      image: file.image[0].filename,
      whitePaper: file.whitePaper[0].filename,
      status: "request",
      startDate: reqBody.startDate,
      endDate: reqBody.endDate,
      telegramLink: reqBody.telegramLink,
      twitterLink: reqBody.twitterLink,
      linkedinLink: reqBody.linkedinLink,
      redditLink: reqBody.redditLink,
      youtubeLink: reqBody.youtubeLink,
      facebookLink: reqBody.facebookLink,
      instagramLink: reqBody.instagramLink,
      email: reqBody.email,
      Name: reqBody.Name,
      country: reqBody.country,
      state: reqBody.state,
      city: reqBody.instagramLink,
      postalCode: reqBody.postalCode,
      contractAddress: reqBody.contractAddress,
      decimals: reqBody.decimals
    });

    let newData = await newLaunchpad.save();
    return res
      .status(200)
      .json({ status: true, message: "Token request successfully" });
  } catch (err) {
    console.log(err, "----err");
    return res.status(500).json({ status: false, message: "Error On Occured" });
  }
};