const express = require('express');
const { getTodayAverage } = require('../controllers/averageController');

const router = express.Router();

router.get('/today', getTodayAverage);

module.exports = router;
