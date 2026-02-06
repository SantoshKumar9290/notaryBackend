const express = require("express");
const {getDistricts, getNotaryHolderListByDistrict} = require("../controllers/notaryHolderController");
const router = express.Router();

router.get("/getDistricts", getDistricts);
router.get("/getNotaryHolderListByDistrict/:districtId", getNotaryHolderListByDistrict);


module.exports = router;
