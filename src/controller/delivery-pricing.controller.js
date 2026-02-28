const createResponse = require("../utils/api.response");
const deliveryPricingService = require("../services/delivery-pricing.service");

exports.getPublicDeliveryPricing = async (req, res) => {
  try {
    const payload = await deliveryPricingService.getPublicPricing();
    return res.json(
      createResponse("Delivery pricing fetched successfully", payload)
    );
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
