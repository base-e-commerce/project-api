const prisma = require("../database/database");

class UserService {
  async createUser(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newUser = await prisma.user.create({
          data: {
            username: data.username,
            email: data.email,
            phone: data.phone,
            password_hash: data.password_hash,
            role_id: data.role_id,
          },
        });
        // await prisma.$executeRaw`SELECT setval('user_id_seq', (SELECT MAX(id) FROM "User"))`;
        return newUser;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the user: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getUserByEmail(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email },
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

  async getAllUsers(limit, offset) {
    try {
      const users = await prisma.user.findMany({
        select: {
          user_id: true,
          username: true,
          phone: true,
          email: true,
          role: true,
          last_login: true,
          created_at: true,
          updated_at: true,
        },
        skip: offset,
        take: limit,
      });

      const totalUsers = await prisma.user.count();

      return {
        users,
        totalUsers,
      };
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
        select: {
          user_id: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          last_login: true,
          created_at: true,
          updated_at: true,
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
          phone: data.phone,
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

  async resetPassUser(userId, data) {
    try {
      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: {
          password_hash: data.password,
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
