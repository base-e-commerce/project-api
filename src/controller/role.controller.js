const createResponse = require("../../utils/api.response");
const roleService = require("../services/role.service");

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await roleService.getAllRoles();
    res.status(200).json(createResponse("Roles fetched successfully", roles));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};

exports.getRoleById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid role ID"));
  }

  try {
    const role = await roleService.getRoleById(Number(id));
    if (!role) {
      return res.status(404).json(createResponse("Role not found"));
    }
    res.status(200).json(createResponse("Role fetched successfully", role));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};

exports.createRole = async (req, res) => {
  const { name } = req.body;

  try {
    const newRole = await roleService.createRole({ name });
    res.status(201).json(createResponse("Role created successfully", newRole));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid role ID"));
  }

  const { name } = req.body;

  try {
    const updatedRole = await roleService.updateRole(Number(id), { name });
    res
      .status(200)
      .json(createResponse("Role updated successfully", updatedRole));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};

exports.deleteRole = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRole = await roleService.deleteRole(Number(id));
    res
      .status(200)
      .json(createResponse("Role deleted successfully", deletedRole));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};
