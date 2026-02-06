const path = require('path');
const multer = require('multer');
const express = require('express');
const { fileUpload, sendFile, generatePDF, bulkUpload, rejectionCertificateGeneration } = require('../controllers/fileController');
const fs = require('fs');
const { protect, roleAccess } = require('../middleware/auth');
const { roleAccessConstants } = require('../constants');

const router = express.Router();

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = process.env.FILE_DESTINATION + '/' + req.params.appId
        fs.mkdirSync(dir, { recursive: true })
            cb(null, dir)
    },
    filename: (req, file, cb) => {
        if(req.params.filename ==undefined){
            cb(null,file.fieldname +'.pdf')
        }else{
            cb(null, req.params.filename + '' + path.extname(file.originalname))
        }
    }
});

const upload = multer({ storage: storage,
    fileFilter: (req, file, cb) => {
        var pattern2 = /^.+\.(([pP][dD][fF]))$/;
        if (file.mimetype === "application/pdf" && file.originalname.match(pattern2)) {
            cb(null, true);
        } else {
            req.fileValidationError = "Forbidden extension";
            return cb(null, false, req.fileValidationError);
        }
    }
 });

router.post('/upload-file/:filename/:appId',protect, upload.single('file'), fileUpload);
router.get('/:filename/:appId', protect, sendFile);
router.get('/generate/license/:appId',protect,roleAccess([roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), generatePDF);
router.post('/bulkUpload/:appId',protect, roleAccess([roleAccessConstants.DR]), upload.any(), bulkUpload);
router.post('/rejection-file/:appId', protect, roleAccess([roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), rejectionCertificateGeneration);

module.exports = router;

