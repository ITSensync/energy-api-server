const express = require('express');
const { createRecord, getRecords, getPaginatedRecords } = require('../controllers/recordsController');

const router = express.Router();

router.post('/', createRecord);
router.get('/paginated', getPaginatedRecords);
router.get('/', getRecords);

module.exports = router;
