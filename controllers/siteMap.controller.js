import  {Sitemap}  from "../models";
import Config from '../config/index'
import axios from "axios";
const js2xmlparser = require("js2xmlparser");
const multer = require("multer")
/**
 * Add Sitemap
 * URL: /adminapi/sitemap
 * METHOD : POST
 * BODY : urlname
 */
 export const addSitemap = async (req, res) => {
    try {
      let reqBody = req.body;
      if (reqBody.url == "") {
        return res.status(400).json({
          success: false,
          errors: { url: "Please Enter SiteUrl" },
        });
      }
      let checkCategory = await Sitemap.findOne({
        url: reqBody.url,
      });
      if (checkCategory) {
        return res.status(400).json({
          success: false,
          errors: { url: "Siteurl already exists" },
        });
      }
      let newDoc = new Sitemap({
        url: reqBody.url
      });
  
      await newDoc.save();
      return res
        .status(200)
        .json({ success: false, result: { messages: "Added Successfully" } });
    } catch (err) {
        console.log('err',err)
      return res
        .status(500)
        .json({ success: false, errors: { messages: "Error on server" } });
    }
  };
  
  /**
   * Edit SiteMap
   * URL: /adminapi/sitemap
   * METHOD : PUT
   * BODY : url, id
   */
  export const editSitemap = async (req, res) => {
    try {
      let reqBody = req.body;

      let checkCategory = await Sitemap.findOne({
        url: reqBody.url,
        _id: { $ne: reqBody._id },
      });
      if (checkCategory) {
        return res.status(400).json({
          success: false,
          errors: { url: "Siteurl already exists" },
        });
      }
      await Sitemap.updateOne(
        { _id: reqBody._id },
        {
          $set: {
            url: reqBody.url,
          },
        }
      );
      return res
        .status(200)
        .json({ success: false, result: { messages: "Update Successfully" } });
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, errors: { messages: "Error on server" } });
    }
  };
  
  /**
   * Get SiteMap
   * URL: /adminapi/sitemap
   * METHOD : GET
   */
  export const getSitemap = (req, res) => {
    Sitemap.find(
      {},
      (err, categoryData) => {
        
        if (err) {
          return res
            .status(500)
            .json({ success: false, errors: { messages: "Error on server" } });
        }
        return res
          .status(200)
          .json({ success: true, result: { data: categoryData } });
      }
    );
  };

  /**
   * URL: /adminapi/deleteSiteUrl
   * METHOD : Delete
   */
  
  export const deleteSiteUrl = async (req, res) => {
    try {
        let SiteUrl = await Sitemap.findOneAndDelete({ _id: req.body._id });
    
        return res
          .status(200)
          .json({ status: true, message: "SiteUrl Deleted Successfully" });
      } catch (err) {
        return res
          .status(500)
          .json({ success: false, errors: { messages: "Error on server" } });
      }
  }