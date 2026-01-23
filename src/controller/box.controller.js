
const createResponse = require("../utils/api.response");
const boxService = require("../services/box.service");

exports.listBoxes = async (req, res) => {
  try {
    const { page, limit, q, sort, status } = req.query;
    const payload = await boxService.listBoxes({
      page,
      limit,
      search: q,
      sort,
      status,
    });
    return res.json(createResponse("Boxes fetched successfully", payload));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getBoxById = async (req, res) => {
  try {
    const { identifier } = req.params;
    const box = await boxService.getBox(identifier);
    if (!box) {
      return res.status(404).json(createResponse("Box not found", null, false));
    }
    return res.json(createResponse("Box retrieved successfully", box));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createBox = async (req, res) => {
  try {
    const box = await boxService.createBox(req.body);
    return res
      .status(201)
      .json(createResponse("Box created successfully", box));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateBox = async (req, res) => {
  try {
    const { identifier } = req.params;
    const updated = await boxService.updateBox(identifier, req.body);
    if (!updated) {
      return res.status(404).json(createResponse("Box not found", null, false));
    }
    return res.json(createResponse("Box updated successfully", updated));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteBox = async (req, res) => {
  try {
    const { identifier } = req.params;
    const deleted = await boxService.deleteBox(identifier);
    if (!deleted) {
      return res.status(404).json(createResponse("Box not found", null, false));
    }
    return res.json(createResponse("Box deleted successfully", deleted));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
