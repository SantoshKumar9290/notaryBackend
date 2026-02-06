const express = require('express');
const { roleAccessConstants } = require('../constants');
const { saveDraft, submitApplication, getApplicationById, saveOldRenewal, getUserStatistics, getNotaryDataForRtgs, GetNotaryStatisticsForRtgs} = require('../controllers/renewalController');
const { protect, roleAccess, validateThirdPartyAccess } = require('../middleware/auth');

const router = express.Router();

// router.post('/:type', protect,  )
router.post('/saveDraft', protect, roleAccess([roleAccessConstants.User]), saveDraft);
router.put('/submitApplication', protect, roleAccess([roleAccessConstants.User]), submitApplication);
router.get('/getApplication/:appId', protect, roleAccess([roleAccessConstants.User]), getApplicationById);
router.post('/dataEntry', protect, roleAccess([roleAccessConstants.DR]), saveOldRenewal);
router.post('/statistics', protect, roleAccess([roleAccessConstants.DR, roleAccessConstants.DIG, roleAccessConstants.IG, roleAccessConstants.GOV]), getUserStatistics)
router.get('/getNotaryDataForRtgs',validateThirdPartyAccess, getNotaryDataForRtgs);
router.get('/GetNotaryStatisticsForRtgs',validateThirdPartyAccess, GetNotaryStatisticsForRtgs)

module.exports = router;