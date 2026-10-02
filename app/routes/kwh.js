const express = require('express');
const { createRecord } = require('../controllers/kwhRecordController');

const router = express.Router();

router.post('/', createRecord);
// router.get('/paginated', getPaginatedRecords);
// router.get('/', getRecords);

module.exports = router;
