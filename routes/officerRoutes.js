const express = require('express');
const { roleAccessConstants } = require('../constants');
const { login, updateOfficerDetails, getRenewals, acceptApplication, getStatistics, getApplicationById, getMyDetails, getActionItemsCount, getActionItemsList, getRelatedRenewals, 
    changePasswordForOfficers,updatedappId
} = require('../controllers/officerController');
const { protect, roleAccess } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.put('/updateOfficerDetails', protect, roleAccess([roleAccessConstants.DR, roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), updateOfficerDetails);
router.post('/getRenewals', protect, roleAccess([roleAccessConstants.DR, roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), getRenewals);
router.put('/updateApplication/:appId', protect, roleAccess([roleAccessConstants.DR, roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), acceptApplication);
router.get('/getStatistics', protect, roleAccess([roleAccessConstants.DR, roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), getStatistics)
router.get('/getApplication/:appId', protect, roleAccess([roleAccessConstants.DR, roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), getApplicationById);
router.get('/getMyDetails', protect, roleAccess([roleAccessConstants.DR, roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), getMyDetails);
router.get('/getActionItemsCount', protect, roleAccess([roleAccessConstants.DR, roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), getActionItemsCount);
router.get('/getActionItemsList/:page/:limit', protect, roleAccess([roleAccessConstants.DR, roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), getActionItemsList);
router.post('/getRelatedRenewals/:appId', protect, roleAccess([roleAccessConstants.DR, roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), getRelatedRenewals);
router.put('/updatedappId/:id', protect, roleAccess([roleAccessConstants.DR, roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), updatedappId);
// router.get('/changePassword', changePasswordForOfficers);

module.exports = router;