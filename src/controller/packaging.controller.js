const createResponse = require("../utils/api.response");
const packagingService = require("../services/packaging.service");

exports.getAllPackagings = async (req, res) => {
  try {
    const packagings = await packagingService.getAllPackagings();
    res.status(200).json(createResponse("Packagings fetched successfully", packagings));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getPackagingById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid packaging ID"));
  }

  try {
    const packaging = await packagingService.getPackagingById(Number(id));
    if (!packaging) {
      return res.status(404).json(createResponse("Packaging not found"));
    }
    res.status(200).json(createResponse("Packaging fetched successfully", packaging));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createPackaging = async (req, res) => {
  try {
    const newPackaging = await packagingService.createPackaging(req.body);
    res.status(201).json(createResponse("Packaging created successfully", newPackaging));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updatePackaging = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid packaging ID", null, false));
  }

  const { name } = req.body;

  try {
    const updatedPackaging = await packagingService.updatePackaging(Number(id), { name });
    res
      .status(200)
      .json(createResponse("Packaging updated successfully", updatedPackaging));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deletePackaging = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPackaging = await packagingService.deletePackaging(Number(id));
    res
      .status(200)
      .json(createResponse("Packaging deleted successfully", deletedPackaging));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
