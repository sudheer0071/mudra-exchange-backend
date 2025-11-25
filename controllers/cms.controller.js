// import package

// import model
import { Cms } from "../models";
/**
 * Get Cms List
 * URL : /adminapi/cms
 * METHOD : GET
 */
export const getCmsList = (req, res) => {

  let filter = {}
  if (req.params.stage == "Footer") {
    filter = {
      page: req.params.stage
    }
  }else if (req.params.stage == "slider") {
    filter = {
      page: req.params.stage
    }
  } else  if (req.params.stage != "all") {
    filter = {
      stage: Number(req.params.stage)
    }
  }


  Cms.find(
    filter,
    {
      _id: 1,
      identifier: 1,
      title: 1,
      content: 1,
      image: 1,
      status: 1,
      metakeywords: 1,
      metatitle: 1,
      metadescription: 1,
      light_image: 1,
      dark_image: 1,
      sliderType: 1,
      subject: 1,
      page: 1,
    },
    { sort: { order: 1 } },
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Something went wrong" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Fetch successfully", result: data });
    }
  );
};

/**
 * Update Cms List
 * URL : /adminapi/cms
 * METHOD : PUT
 * BODY : id, identifier, title, content
 */
export const updateCms = async (req, res) => {
  try {
    let reqBody = req.body;

    let checkCmsData = await Cms.findOne({ _id: reqBody.id });
    if (!checkCmsData) {
      return res
        .status(400)
        .json({ status: false, message: "There is no cms" });
    }

    checkCmsData.identifier = reqBody.identifier;
    checkCmsData.title = reqBody.title;
    checkCmsData.content = reqBody.content;
    checkCmsData.metatitle = reqBody.metatitle;

    checkCmsData.metadescription = reqBody.metadescription;

    checkCmsData.metakeywords = reqBody.metakeywords;

    await checkCmsData.save();
    return res
      .status(200)
      .json({ status: true, message: "Cms updated successfully" });
  } catch (err) {
    console.log("Error on cms", err);
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
};
/**
 * Update Cms List
 * URL : /adminapi/cms
 * METHOD : PUT
 * BODY : id, identifier, title, content
 */
export const cms_statusChnage = async (req, res) => {
  try {
    let reqBody = req.body;
    let checkCmsData = await Cms.findById({ _id: reqBody._id });
    if (!checkCmsData) {
      return res
        .status(400)
        .json({ status: false, message: "There is no cms" });
    }
    checkCmsData.status = checkCmsData.status == "active" ? "deactive" : "active";

    await checkCmsData.save();
    return res
      .status(200)
      .json({ status: true, message: "Cms updated successfully" });
  } catch (err) {
    console.log("Error on cms", err);
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
};
/**
 * Get CMS Page
 * URL : /api/cms/{{}}
 * METHOD : GET
 * PARAMS : identifier
 */
export const getCMSPage = (req, res) => {
  Cms.findOne(
    { identifier: req.params.identifier },
    {
      _id: 0,
      title: 1,
      content: 1,
      metakeywords: 1,
      metatitle: 1,
      metadescription: 1,
    },
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ status: false, message: "Something went wrong" });
      }
      return res
        .status(200)
        .json({ status: true, message: "FETCH_SUCCESS", result: data });
    }
  );
};
export const getCMSPageHome = (req, res) => {
  Cms.find(
    { status: "active" },
    {
      _id: 0,
      title: 1,
      content: 1,
      metakeywords: 1,
      metatitle: 1,
      metadescription: 1,
      identifier: 1,
      sliderType: 1,
      light_image: 1,
      dark_image: 1,
      status: 1,
      page:1,
    },
    (err, data) => {
      if (err) {
        console.log("err", err);
        return res
          .status(500)
          .json({ status: false, message: "Something went wrong" });
      }
      return res
        .status(200)
        .json({ status: true, message: "FETCH_SUCCESS", result: data });
    }
  );
};



/**
 * Update slider Update List
 * URL : /adminapi/sliderUpdate
 * METHOD : PUT
 * BODY : id, identifier, title, content
 */
export const sliderUpdate = async (req, res) => {
  try {
    let reqBody = req.body, reqFile = req.files;;
    if (reqBody._id) {
      let checkCmsData = await Cms.findOne({ _id: reqBody._id });
      if (!checkCmsData) {
        return res
          .status(400)
          .json({ status: false, message: "There is no cms" });
      }

      checkCmsData.identifier = reqBody.identifier;
      checkCmsData.title = reqBody.title;
      if (reqBody.content)
        checkCmsData.content = reqBody.content;
      checkCmsData.subject = "slider";
      checkCmsData.metadescription = reqBody.metadescription;
      checkCmsData.metakeywords = reqBody.metakeywords;
      checkCmsData.dark_image = reqFile.dark_image && reqFile.dark_image[0]
        ? reqFile.dark_image[0].filename
        : checkCmsData.dark_image;
      checkCmsData.light_image = reqFile.light_image && reqFile.light_image[0]
        ? reqFile.light_image[0].filename
        : checkCmsData.light_image;
      await checkCmsData.save();
    } else {
      let checkCmsData = await Cms.findOne({ identifier: reqBody.identifier });
      if (checkCmsData) {
        return res
          .status(400)
          .json({ status: false, message: "Identifier already used" });
      }

      let newCms = new Cms({
        identifier: reqBody.identifier,
        title: reqBody.title,
        subject: "slider",
        page:"slider",
        stage:10
      })
      // if (reqBody.sliderType == 'app' && reqFile?.dark_image[0])
      //   newCms.dark_image = reqFile.dark_image[0].filename
      // if (reqBody.sliderType == 'app' && reqFile?.light_image[0])
      //   newCms.light_image = reqFile.light_image[0].filename
        if (reqFile?.dark_image[0])
        newCms.dark_image = reqFile.dark_image[0].filename
      if ( reqFile?.light_image[0])
        newCms.light_image = reqFile.light_image[0].filename
      if (reqBody.content) {
        newCms.content = reqBody.content
      } else {
        newCms.content = "<h1>test</h1>"
      }

      await newCms.save();

    }

    return res
      .status(200)
      .json({ status: true, message: "Cms updated successfully" });
  } catch (err) {
    console.log("Error on cms", err);
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
};
