const createResponse = require("../utils/api.response");
const commandBoxService = require("../services/commandbox.service");

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
