const express = require('express');
const { createRuntime, updateRuntime } = require('../controllers/runtimeController');

const router = express.Router();

router.post('/', createRuntime)
router.patch('/', updateRuntime)

module.exports = router;
