const imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|pdf|PDF)$/)) {
        req.validationError = {
            'fieldname':file.fieldname,
            'messages':'INVALID_IMAGE'
        }
        req.fileValidationError = 'INVALID_IMAGE';
        return cb(new Error('INVALID_IMAGE'), false);
    }
    cb(null, true);
};
module.exports = imageFilter;