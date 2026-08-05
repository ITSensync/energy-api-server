const express = require('express');
const { createActivityLog, getActivityLogs } = require('../controllers/activityLogsController');

const router = express.Router();

router.post('/', createActivityLog);
router.get('/', getActivityLogs);

module.exports = router;
