const prisma = require("../database/database");

class RoleService {
  async createRole(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newRole = await prisma.role.create({
          data: {
            name: data.name.toUpperCase(),
          },
        });
        return newRole;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the role: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getAllRoles() {
    try {
      const roles = await prisma.role.findMany();
      return roles;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving roles: ${error.message}`
      );
    }
  }

  async getRoleById(roleId) {
    try {
      const role = await prisma.role.findUnique({
        where: { role_id: roleId },
      });
      return role;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the role: ${error.message}`
      );
    }
  }

  async updateRole(roleId, data) {
    try {
      const updatedRole = await prisma.role.update({
        where: { role_id: roleId },
        data: {
          name: data.name.toUpperCase(),
        },
      });
      return updatedRole;
    } catch (error) {
      throw new Error(
        `Error occurred while updating the role: ${error.message}`
      );
    }
  }

  async deleteRole(roleId) {
    try {
      const deletedRole = await prisma.role.delete({
        where: { role_id: roleId },
      });
      return deletedRole;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the role: ${error.message}`
      );
    }
  }
}

module.exports = new RoleService();
