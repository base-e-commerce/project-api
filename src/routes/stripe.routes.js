const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const paymentController = require('../controller/stripe.controller');

router.post('/validation-payement', paymentController.handlePayment);
router.post('/webhook',bodyParser.raw({ type: 'application/json' }),paymentController.webhookHandler)
router.get('/session/:id', paymentController.getSessionInfo);

module.exports = router;