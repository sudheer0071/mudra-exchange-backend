// import model
import { User, Anouncement } from "../models";
import { newNotification } from "./notification.controller";

// import lib
import { nowDateInUTC } from "../lib/dateHelper";

/**
 * Add Announcement
 * METHOD : POST
 * URL : /adminapi/anouncement
 * BODY : content, endDateTime
 */
export const anouncementAdd = async (req, res) => {
  let { startDateTime, endDateTime, content } = req.body;

  new Anouncement({ startDateTime, endDateTime, content }).save(async (err, data) => {
    if (err) 
      return res.status(500).json({ success: false, message: "Something went wrong" });
    else
      return res.status(200).json({ success: true, message: "Successfully added" });
  });
};

/**
 * Get All Announcement
 * METHOD: GET
 * URL: /api/announcement
 */
export const getAnnouncement = (req, res) => {
  Anouncement.find({ startDateTime: { $lte: new Date() }, endDateTime: { $gt: new Date() } }, { content: 1 }, { sort: { _id: -1 }, limit: 1 }, (err, data) => {
    if (err)
      return res.status(500).json({ success: false, message: "Something went wrong" });
    else
      return res.status(200).json({ success: true, message: "Successfully added", result: data });
  });
};


/**
 * get announcement history
 * METHOD: POST
 * URL : /adminapi/getAnnouncementHistory
 */
export const getAnnouncementHistory = async (req, res) => {
  try {
    let { timezone, filter, sortOrder, offset, limit } = req.body;

    let sortBy = {};
    sortBy[sortOrder.column] = sortOrder.order;
    limit = parseInt(req.body.limit);

    let search = {};
    if (filter) {
      let searchColumns = [
        { name: "$startDateTime", type: "date", timezone, format: "%d-%m-%Y" },
        { name: "$endDateTime", type: "date", timezone, format: "%d-%m-%Y" },
        { name: "$content", type: "string" },
        { name: "$createdAt", type: "date", timezone, format: "%d-%m-%Y %H:%M" }
      ];
      search = searchQuery(searchColumns, filter);
    }

    let totalCount = await Anouncement.countDocuments(search);

    Anouncement.find(search).sort(sortBy).skip(offset).limit(limit).allowDiskUse(true).exec(function (err, history) {
      if (err) {
        console.log("getAnnouncementHistory", err);
        return res.status(400).json({ status: false, message: "Error occured" });
      } else {
        return res.status(200).json({ status: true, result: history, totalCount });
      }
    });
  } catch (err) {
    console.log("getPassbookHistory", err);
    return res.status(400).json({ status: false, message: "Error occured" });
  }
};