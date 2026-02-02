const createResponse = require("../utils/api.response");
const commandBoxService = require("../services/commandbox.service");
const stripeService = require("../services/stripe.payement.service");

const isRelationMissing = (message) =>
  message === "Commande not found" || message === "Box not found";

const handleServiceError = (res, error) => {
  const status = isRelationMissing(error.message) ? 404 : 500;
  return res
    .status(status)
    .json(createResponse(
      isRelationMissing(error.message) ? error.message : "Internal server error",
      isRelationMissing(error.message) ? null : error.message,
      false
    ));
};

exports.listCommandBoxes = async (req, res) => {
  try {
    const { page, limit, commande_id, box_id, status } = req.query;
    const payload = await commandBoxService.listCommandBoxes({
      page,
      limit,
      commandeId: commande_id,
      boxId: box_id,
      status,
    });
    return res.json(
      createResponse("Command boxes retrieved successfully", payload)
    );
  } catch (error) {
    return handleServiceError(res, error);
  }
};

exports.getCommandBoxById = async (req, res) => {
  try {
    const { id } = req.params;
    const commandBox = await commandBoxService.getCommandBoxById(id);
    if (!commandBox) {
      return res
        .status(404)
        .json(createResponse("Command box not found", null, false));
    }
    return res.json(
      createResponse("Command box retrieved successfully", commandBox)
    );
  } catch (error) {
    return handleServiceError(res, error);
  }
};

exports.createCommandBox = async (req, res) => {
  try {
    const commandBox = await commandBoxService.createCommandBox(req.body);
    return res
      .status(201)
      .json(createResponse("Command box created successfully", commandBox));
  } catch (error) {
    return handleServiceError(res, error);
  }
};

exports.updateCommandBox = async (req, res) => {
  try {
    const { id } = req.params;
    const commandBox = await commandBoxService.updateCommandBox(id, req.body);
    if (!commandBox) {
      return res
        .status(404)
        .json(createResponse("Command box not found", null, false));
    }
    return res.json(
      createResponse("Command box updated successfully", commandBox)
    );
  } catch (error) {
    return handleServiceError(res, error);
  }
};

exports.deleteCommandBox = async (req, res) => {
  try {
    const { id } = req.params;
    const commandBox = await commandBoxService.deleteCommandBox(id);
    if (!commandBox) {
      return res
        .status(404)
        .json(createResponse("Command box not found", null, false));
    }
    return res.json(
      createResponse("Command box deleted successfully", commandBox)
    );
  } catch (error) {
    return handleServiceError(res, error);
  }
};

exports.createPaymentSession = async (req, res) => {
  try {
    const { id } = req.params;
    const commandBox = await commandBoxService.getCommandBoxById(id);
    if (!commandBox) {
      return res
        .status(404)
        .json(createResponse("Command box not found", null, false));
    }

    const customerId = req.customer?.customer_id;
    if (!customerId) {
      return res
        .status(401)
        .json(createResponse("Customer authentication required", null, false));
    }

    if (commandBox.commande?.customer_id !== customerId) {
      return res
        .status(403)
        .json(createResponse("Access denied", null, false));
    }

    if (!commandBox.box) {
      return res
        .status(400)
        .json(createResponse("Associated box information is required", null, false));
    }

    const amount = commandBox.unit_price * commandBox.quantity;
    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json(createResponse("Invalid amount", null, false));
    }

    const currency = commandBox.box.currency || "eur";
    const itemName = commandBox.box.name || "Command box";

    const session = await stripeService.createCheckoutSession({
      amount,
      currency,
      commande_id: commandBox.commande.commande_id,
      command_box_id: commandBox.command_box_id,
      itemName,
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Command box payment error:", error.message);
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
