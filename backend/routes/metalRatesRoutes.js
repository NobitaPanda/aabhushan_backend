const express = require('express');
const { getMetalRates } = require('../controllers/metalRatesController');

const router = express.Router();

router.get('/', getMetalRates);

module.exports = router;
