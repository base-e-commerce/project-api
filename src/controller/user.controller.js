const createResponse = require("../../utils/api.response");
const userService = require("../services/user.service");

exports.getAllUser = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(createResponse("User fetched successfully", users));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid user ID"));
  }

  try {
    const user = await userService.getUserById(Number(id));
    if (!user) {
      return res.status(404).json(createResponse("User not found"));
    }
    res.status(200).json(createResponse("User fetched successfully", user));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};

exports.createUser = async (req, res) => {
  const { username, email, password_hash, role_id } = req.body;

  try {
    const newUser = await userService.createUser({
      username,
      email,
      password_hash,
      role_id,
    });
    res.status(201).json(createResponse("User created successfully", newUser));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid user ID"));
  }

  const { username, email, password_hash, role_id, last_login } = req.body;

  try {
    const updatedUser = await userService.updateUser(Number(id), {
      username,
      email,
      password_hash,
      role_id,
      last_login,
    });
    res
      .status(200)
      .json(createResponse("User updated successfully", updatedUser));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await userService.deleteUser(Number(id));
    res
      .status(200)
      .json(createResponse("User deleted successfully", deletedUser));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};
