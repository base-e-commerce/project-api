const express = require("express");
const {
  getPublicDeliveryPricing,
} = require("../controller/delivery-pricing.controller");

const router = express.Router();

router.get("/", getPublicDeliveryPricing);

module.exports = router;
