const createResponse = require("../utils/api.response");
const devisService = require("../services/devis.service");
const stripeService = require("../services/stripe.payement.service");

exports.getAllDevisByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const devisList = await devisService.getAllDevisByEmail(email);
    res
      .status(200)
      .json(createResponse("Devis for user fetched successfully", devisList));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getAllDevis = async (req, res) => {
  try {
    const devisList = await devisService.getAllDevis();
    res
      .status(200)
      .json(createResponse("All devis fetched successfully", devisList));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getDevisById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid devis ID"));
  }

  try {
    const devis = await devisService.getDevisById(Number(id));
    if (!devis) {
      return res.status(404).json(createResponse("Devis not found"));
    }
    res.status(200).json(createResponse("Devis fetched successfully", devis));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createDevis = async (req, res) => {
  try {
    const newDevis = await devisService.createDevis(req.body);
    res
      .status(201)
      .json(createResponse("Devis created successfully", newDevis));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateDevis = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res
      .status(400)
      .json(createResponse("Invalid devis ID", null, false));
  }

  try {
    const updatedDevis = await devisService.updateDevis(Number(id), req.body);
    res
      .status(200)
      .json(createResponse("Devis updated successfully", updatedDevis));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteDevis = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedDevis = await devisService.deleteDevis(Number(id));
    res
      .status(200)
      .json(createResponse("Devis deleted successfully", deletedDevis));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createDevisPayment = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid devis ID", null, false));
  }

  try {
    const devis = await devisService.getDevisById(Number(id));
    if (!devis) {
      return res.status(404).json(createResponse("Devis not found", null, false));
    }

    const metadata = {
      devis_id: String(devis.id),
    };

    const productInfo = devis.productJson || {};
    const unitPrice = Number(productInfo.price_pro ?? productInfo.price ?? 0);
    const quantity = Number(devis.nombre ?? 1);
    const currency = (productInfo.currency ?? "EUR").toLowerCase();

    if (!unitPrice || unitPrice <= 0) {
      return res
        .status(400)
        .json(createResponse("Invalid unit price for devis", null, false));
    }

    const amount = unitPrice * Math.max(quantity, 1);
    const session = await stripeService.createCheckoutSession({
      amount,
      currency,
      metadata,
      itemName: productInfo.name || devis.entreprise || "Devis",
    });

    return res.status(200).json(
      createResponse("Payment session ready", {
        sessionId: session.id,
        url: session.url,
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Failed to create payment session", error.message, false));
  }
};
