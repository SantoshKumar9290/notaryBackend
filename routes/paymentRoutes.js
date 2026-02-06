const express = require('express');
const {protect, roleAccess} = require('../middleware/auth');
const router = express.Router();
const {verifyPaymentStatus, defaceTransID} = require('../controllers/paymentController');
const { roleAccessConstants } = require('../constants');


router.get('/:appId/:flag', protect, verifyPaymentStatus);
router.post('/deface/:id', protect, roleAccess([roleAccessConstants.DR]), defaceTransID)

module.exports = router;