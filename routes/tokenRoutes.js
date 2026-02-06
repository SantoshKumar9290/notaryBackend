const express = require('express');
const { refreshToken } = require('../controllers/tokenController');
const router = express.Router();

router.get('/', refreshToken);

module.exports = router;