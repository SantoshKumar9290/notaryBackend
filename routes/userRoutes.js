const express = require('express');
const { roleAccessConstants } = require('../constants');
const router = express.Router();
const {login, verifyUser, regVerifyUser, userRegistration, getRenewals, getMe} = require('../controllers/userController');
const { protect, roleAccess} = require('../middleware/auth');

router.post('/login/:type', login);
router.post('/verifyUser/:type', verifyUser);
router.post('/registerCheck', regVerifyUser);
router.post('/signUp', userRegistration);
router.get('/getRenewals', protect, roleAccess([roleAccessConstants.User]), getRenewals);
router.get('/getMe', protect, roleAccess([roleAccessConstants.User]), getMe)

module.exports = router;
