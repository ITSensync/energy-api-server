const express = require('express');
const { updateStatus } = require('../controllers/machineStatusController');

const router = express.Router();

router.patch('/', updateStatus);

module.exports = router;
