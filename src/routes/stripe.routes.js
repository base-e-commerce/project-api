const express = require('express');
const router = express.Router();
const paymentController = require('../controller/stripe.controller');

router.post('/validation-payement', paymentController.handlePayment);
module.exports = router;