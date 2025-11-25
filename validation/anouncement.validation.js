// import package
import mongoose from "mongoose";

// import helpers
import isEmpty from "../lib/isEmpty";

/**
 * Anouncement Add
 * URL: /adminApi/anouncement
 * METHOD : POST
 * BODY : endDateTime,content
 */
export const anouncementAdd = (req, res, next) => {
    let errors = {};
    let { startDateTime, endDateTime, content } = req.body;

    if (isEmpty(startDateTime)) errors.startDateTime = "Start date is required";
    if (isEmpty(endDateTime)) errors.endDateTime = "End date is required";
    if (startDateTime > endDateTime) errors.endDateTime = "End date should be greater than start date";
    if (isEmpty(content)) errors.content = "Content is required";
    else if (content.length >= 150)
        errors.content = "Only Allow 150 charactors";

    if (!isEmpty(errors)) return res.status(400).json({ errors });

    return next();
};