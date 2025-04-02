const createResponse = require("../utils/api.response");
const userService = require("../services/user.service");
const roleService = require("../services/role.service");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userService.getUserByEmail(email);

    if (!user) {
      return res
        .status(401)
        .json(createResponse("Invalid email or password", null, false));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json(createResponse("Invalid email or password", null, false));
    }

    user.last_login = new Date();
    await userService.updateUser(user.user_id, user);

    const token = generateToken(user);

    dataReturn = {
      token,
      role: user.role_id,
    };

    res.status(200).json(createResponse("Login successful", dataReturn));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await userService.getUserById(userId);

    if (!user) {
      return res
        .status(404)
        .json(createResponse("User not found", null, false));
    }

    res
      .status(200)
      .json(createResponse("Current user retrieved successfully", user));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, email, password } = req.body;

    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

    const updatedUser = await userService.updateUser(userId, {
      username,
      email,
      ...(passwordHash && { password_hash: passwordHash }),
    });

    res
      .status(200)
      .json(
        createResponse("User information updated successfully", updatedUser)
      );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { users, totalUsers } = await userService.getAllUsers(limit, offset);

    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json(
      createResponse("User fetched successfully", {
        users,
        pagination: {
          page,
          limit,
          totalPages,
          totalUsers,
        },
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid user ID", null, false));
  }

  try {
    const user = await userService.getUserById(Number(id));
    if (!user) {
      return res
        .status(404)
        .json(createResponse("User not found", null, false));
    }
    res.status(200).json(createResponse("User fetched successfully", user));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createUser = async (req, res) => {
  const { username, email, password, role_id } = req.body;
  try {
    const roleCheck = await roleService.getRoleById(role_id);

    if (!roleCheck) {
      return res
        .status(400)
        .json(createResponse("Invalid role ID", null, false));
    }

    const password_hash = await bcrypt.hash(password, 10);
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
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid user ID", null, false));
  }

  const { username, email, role_id, last_login } = req.body;

  try {
    const updatedUser = await userService.updateUser(Number(id), {
      username,
      email,
      role_id,
      last_login,
    });
    res
      .status(200)
      .json(createResponse("User updated successfully", updatedUser));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
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
      .json(createResponse("Internal server error", error.message, false));
  }
};
