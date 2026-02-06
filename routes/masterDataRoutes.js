const express = require('express');
const router = express.Router();

const {getDistricts, getMandals, getVillages, } = require('../controllers/masterDataController');

router.get('/districts', getDistricts);
router.get('/mandals/:district', getMandals);
router.get('/villages/:district/:mandal', getVillages);

module.exports = router;