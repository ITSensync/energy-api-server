const express = require('express');
const { createGasRecord, fetchTodayGasRecords, fetchGasRecords } = require('../controllers/GasRecordController');
// const { fetchGasRecords } = require('../services/gasRecordService');

const router = express.Router();

router.post('/', createGasRecord);
router.get('/', fetchGasRecords);
router.get('/today', fetchTodayGasRecords);
// router.get('/paginated', getPaginatedRecords);
// router.get('/', getRecords);

module.exports = router;
