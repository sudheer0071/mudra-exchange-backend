// import modal
import { Notification, } from "../models";
import Admin from "../models/Admin";
import { socketEmitOne, socketEmitAll } from "../config/socketIO";
import { paginationQuery } from '../lib/adminHelpers'
import Mongoose from 'mongoose';
const { ObjectId } = Mongoose.Types
/**
 * Create Notification
 * userId, currencyId, transactionId, trxId, currencySymbol, amount, paymentType,status
 */
export const newNotification = async (doc) => {

  try {
    let newDoc = new Notification(doc);

    const data = await newDoc.save();

    // if(doc.type == 'General'){
    //   Unreadsocket(doc);
    // }
    Unreadsocket(doc.userId);

    return true;
  } catch (err) {
    console.log("errrrrrrrrrrrr", err);
    return false;
  }
};
export const Unreadsocket = async (userId) => {

  try {
    var unread_count = await Notification.find({
      userId: userId,
      noti_view_status: false,
    }).countDocuments();
  } catch (err) {
    console.log(err, "ererere");
  }
  socketEmitOne("unreadnotification", unread_count, userId);
};



//test compy form futer bitdrive

/*
create Notification
*/
export const createNotification = async (data) => {

  try {

    const newDoc = new Notification(data)
    await newDoc.save();
    if (data.viewType == "ADMIN") {
      socketEmitOne("notification", data, data.userId);

    } else {
      getNotifications(data.userId)

    }
    return true;
  } catch (err) {
    console.log("notification save err", err)
  }

}


/** 
*GET method
* parms:""or show All
*api: /api /getNotification
*/


export const getNotification = async (req, res) => {


  try {
    let pagination = paginationQuery(req.query);

    const paramData = req.query.param;

    if (paramData == 'showAll') {
      let count = await Notification.countDocuments({ userId: req.user.id, })
      let result = await Notification.find({ userId: req.user.id, },).sort({ _id: -1 }).limit(pagination.limit).skip(pagination.skip)
      return res.status(200).json({ 'status': true, 'count': count, 'result': result })
    }
    else {
      let count = await Notification.countDocuments({ userId: req.user.id, message_read: false })
      let result = await Notification.find({ userId: req.user.id, message_read: false },).limit(5).sort({ _id: -1 })
      return res.status(200).json({ 'status': true, 'count': count, 'result': result })
    }


  } catch (err) {
    console.log("errrrrrrrrrrr", err)
    res.status(500).json({ message: "error on server" })
  }

}

//function call

const getNotifications = async (userId) => {

  try {
    let data = {};
    // let count = await Notification.countDocuments({ userId: userId, message_read: false })
    // let result = await Notification.find({ userId: userId, message_read: false },).limit(5).sort({ _id: -1 })

    // console.log("notificationssssssssssssssssssssssss",result,count);
    // data["count"]=count;
    // data["result"]=result;

    socketEmitOne("notification", data, userId);


  } catch (err) {
    console.log("notification function call errrrrrrrr", err)
  }
}

/** 
* method:PUT
* rq.body:object id
*api:  /api/getNotification
*/
export const update_notification_status = async (req, res) => {

  try {

    const id = req.body.id;
    const update = { message_read: true }
    const updateData = await Notification.updateOne({ "_id": ObjectId(id) }, { $set: update }, { new: true })
    return res.status(200).json({ 'status': true, })

  } catch (err) {
    res.status(500).json({ message: "error on server" })

  }
}

/** 
* method:PUT
* rq.body:object id
*api:  /getNotification
*/
export const clearAllNotification = async (req, res) => {

  try {

    const update = { message_read: true }
    const updateData = await Notification.updateMany({ "userId": ObjectId(req.user.id) }, { $set: update }, { new: true })
    return res.status(200).json({ 'status': true, })

  } catch (err) {
    console.log("errrrrrrrrrrrrrrr", err)
    res.status(500).json({ message: "error on server" })

  }
}


/** 
* method:GET
* rq.body:object id
*adminapi:  /getNotification
*/

export const getAdminNotification = async (req, res) => {

  try {

    let pagination = paginationQuery(req.query);
    let findadmin = await Admin.find({ _id: ObjectId(req.user.id) })

    const paramData = req.query.param;

    if (findadmin[0].role == 'superadmin') {
      if (paramData == 'showAll') {

        let count = await Notification.countDocuments({ noti_view_status_super_admin: false });
        let result = await Notification.find({ noti_view_status_super_admin: false }).sort({ _id: -1 }).skip(pagination.skip).limit(pagination.limit).populate("userId").populate("adminId")

        return res.status(200).json({ 'status': true, 'count': count, 'result': result })
      }
      else {
        let count = await Notification.countDocuments({ noti_view_status: false })
        let result = await Notification.find({ noti_view_status: false },).limit(10).populate("adminId").populate("userId").sort({ _id: -1 })
        return res.status(200).json({ 'status': true, 'count': count, 'result': result })
      }
    } else {
      if (paramData == 'showAll') {

        let count = await Notification.countDocuments({ userId: ObjectId(req.user.id) });
        let result = await Notification.find({ userId: ObjectId(req.user.id) }).sort({ _id: -1 }).skip(pagination.skip).limit(pagination.limit)

        return res.status(200).json({ 'status': true, 'count': count, 'result': result })
      }
      else {
        let count = await Notification.countDocuments({ userId: ObjectId(req.user.id), noti_view_status: false })
        let result = await Notification.find({ userId: ObjectId(req.user.id), noti_view_status: false },).limit(10).populate("adminId").populate("userId").sort({ _id: -1 })
        return res.status(200).json({ 'status': true, 'count': count, 'result': result })
      }
    }



  } catch (err) {

    console.log("admin notification  errrrrrrrrrrrrrr", err)
  }

}

/** 
* method:GET
* rq.body:object id
*adminapi:/clearNotify
*/

export const clearNotify = async (req, res) => {

  try {
    const update = { noti_view_status: true }
    let findadmin = await Admin.find({ _id: ObjectId(req.user.id) })
  

    if (findadmin[0].role == 'superadmin') {
      let updatesueradmin = { noti_view_status_super_admin: true }
      const updateData = await Notification.updateMany({ /* createdAt: { $lte: new Date() } */ }, { $set: updatesueradmin }, { new: true })
    
    } else {
      const updateData = await Notification.updateMany({ viewType: "admin" }, { $set: update }, { new: true })
    }

    return res.status(200).json({ 'status': true, })

  } catch (err) {
    console.log("errrrrrrrrrrrrrrr", err)
    res.status(500).json({ message: "error on server" })

  }
}