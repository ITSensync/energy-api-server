const express = require('express');
const { createRecord, getRecord } = require('../controllers/kwhRecordController');

const router = express.Router();

router.post('/', createRecord);
router.get('/', getRecord);
// router.get('/paginated', getPaginatedRecords);
// router.get('/', getRecords);

module.exports = router;
