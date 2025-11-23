const express = require("express");
const router = express.Router();
const paymentController = require("../controller/stripe.controller");

router.post("/validation-payement", paymentController.handlePayment);
router.get("/session/:id", paymentController.getSessionInfo);

module.exports = router;
