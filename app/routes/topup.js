const express = require('express');
const { createRecord, getRecords, deleteRecord } = require('../controllers/topupRecordController');

const router = express.Router();

router.post('/', createRecord);
router.get('/', getRecords);
router.delete('/', deleteRecord);

module.exports = router;