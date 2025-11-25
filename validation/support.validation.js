import isEmpty from '../lib/isEmpty';

/** 
 * Create New Ticket
 * URL: /api/ticket
 * METHOD : POST
 * BODY : categoryId, message
 * FILE : file (optional)
*/

export const createNewTicket = (req,res,next) => {

    let errors = {}, reqBody = req.body, reqFile = req.files;
    // console.log(reqBody,'reqBody---------')
    // console.log(file,'file---------')
    // return
    let allowedExtension = ['jpeg', 'jpg', 'png', 'pdf', 'mp4'];
    let allowedFileExtension = ['pdf', 'odt', 'doc'];

    if (isEmpty(reqBody.categoryId)) {
        errors.categoryId = "Category field is required";
    }

    if (isEmpty(reqBody.message)) {
        errors.message = "Message field is required";
    }

    

    if (!isEmpty(reqFile.file && reqFile.file[0])) {
    //     errors.file = "Image field is required";
    // }else{
        let type = reqFile.file[0].mimetype.split('/')[1]
     if(!allowedExtension.includes(type)){
        errors.file = "Please Choose with the known file types jpg, jpeg, png, pdf, or mp4.";
     }
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({'status':false,'errors':errors});
    }
    
    return next();
}

/** 
 * User Reply Message
 * URL: /api/ticket
 * METHOD : PUT
 * BODY : ticketId, receiverId, message
 * FILE : file (optional)
*/
export const usrReplyMsg = (req,res,next) => {

    let errors = {}, reqBody = req.body, reqFile = req.files;
    
    let allowedExtension = ['jpeg', 'jpg', 'png', 'pdf', 'mp4'];
    // let allowedFileExtension = ['pdf', 'odt', 'doc'];

    if (isEmpty(reqBody.message) && isEmpty(req.files)) {
        errors.message = "message field is required";
    }
    if (!isEmpty(reqFile.supportimage && reqFile.supportimage[0])) {
    //     errors.file = "Image field is required";
    // }else{
        let type = reqFile.supportimage[0].mimetype.split('/')[1]
     if(!allowedExtension.includes(type)){
        errors.supportimage = "Please Choose with the known file types jpg, jpeg, png, pdf, or mp4.";
     }
    }

    if (!isEmpty(errors)) {
        return res.status(400).json({'status':false,'errors':errors});
    }
    
    return next();
}
