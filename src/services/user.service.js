const prisma = require("../database/database");

class UserService {
  async createUser(data) {
    try {
      const newUser = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          password_hash: data.password_hash,
          role_id: data.role_id,
        },
      });
      return newUser;
    } catch (error) {
      throw new Error(
        `Error occurred while creating the user: ${error.message}`
      );
    }
  }

  async getAllUsers() {
    try {
      const users = await prisma.user.findMany({
        include: {
          role: true,
        },
      });
      return users;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving users: ${error.message}`
      );
    }
  }

  async getUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        include: {
          role: true,
        },
      });
      return user;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the user: ${error.message}`
      );
    }
  }

  async updateUser(userId, data) {
    try {
      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: {
          username: data.username,
          email: data.email,
          password_hash: data.password_hash,
          role_id: data.role_id,
          last_login: data.last_login,
        },
      });
      return updatedUser;
    } catch (error) {
      throw new Error(
        `Error occurred while updating the user: ${error.message}`
      );
    }
  }

  async deleteUser(userId) {
    try {
      const deletedUser = await prisma.user.delete({
        where: { user_id: userId },
      });
      return deletedUser;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the user: ${error.message}`
      );
    }
  }
}

module.exports = new UserService();
