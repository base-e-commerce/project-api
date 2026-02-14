const createResponse = require("../utils/api.response");
const machineService = require("../services/machine.service");

exports.listPublicMachines = async (req, res) => {
  try {
    const { page, limit, q, sort } = req.query;
    const payload = await machineService.listMachines({
      page,
      limit,
      search: q,
      sort,
      includeInactive: false,
    });
    return res.json(createResponse("Machines fetched successfully", payload));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getPublicMachineBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const machine = await machineService.getMachine(slug, { onlyActive: true });
    if (!machine) {
      return res.status(404).json(createResponse("Machine not found", null, false));
    }
    return res.json(createResponse("Machine retrieved successfully", machine));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.listAdminMachines = async (req, res) => {
  try {
    const { page, limit, q, sort, status } = req.query;
    const payload = await machineService.listMachines({
      page,
      limit,
      search: q,
      sort,
      status,
      includeInactive: true,
    });
    return res.json(createResponse("Machines fetched successfully", payload));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getAdminMachineById = async (req, res) => {
  try {
    const { identifier } = req.params;
    const machine = await machineService.getMachine(identifier, { onlyActive: false });
    if (!machine) {
      return res.status(404).json(createResponse("Machine not found", null, false));
    }
    return res.json(createResponse("Machine retrieved successfully", machine));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createMachine = async (req, res) => {
  try {
    const machine = await machineService.createMachine(req.body);
    return res
      .status(201)
      .json(createResponse("Machine created successfully", machine));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateMachine = async (req, res) => {
  try {
    const { identifier } = req.params;
    const updated = await machineService.updateMachine(identifier, req.body);
    if (!updated) {
      return res.status(404).json(createResponse("Machine not found", null, false));
    }
    return res.json(createResponse("Machine updated successfully", updated));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteMachine = async (req, res) => {
  try {
    const { identifier } = req.params;
    const deleted = await machineService.deleteMachine(identifier);
    if (!deleted) {
      return res.status(404).json(createResponse("Machine not found", null, false));
    }
    return res.json(createResponse("Machine deleted successfully", deleted));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
