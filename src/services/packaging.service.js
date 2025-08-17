const prisma = require("../database/database");

class PackagingService {
  async createPackaging(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newPackaging = await prisma.packaging.create({
          data: {
            user_id: data.user_id ? Number(data.user_id) : null,
            email: data.email,
            information: data.information,
          },
        });
        return newPackaging;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the packaging: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getAllPackagings() {
    try {
      const packagings = await prisma.packaging.findMany();
      return packagings;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving packagings: ${error.message}`
      );
    }
  }

  async getPackagingById(packagingId) {
    try {
      const packaging = await prisma.packaging.findUnique({
        where: { id: packagingId },
      });
      return packaging;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the packaging: ${error.message}`
      );
    }
  }

  async updatePackaging(packagingId, data) {
    try {
      const updatedPackaging = await prisma.packaging.update({
        where: { id: packagingId },
        data: {
          information: data.information,
        },
      });
      return updatedPackaging;
    } catch (error) {
      throw new Error(
        `Error occurred while updating the packaging: ${error.message}`
      );
    }
  }

  async deletePackaging(packagingId) {
    try {
      const deletedPackaging = await prisma.packaging.delete({
        where: { id: packagingId },
      });
      return deletedPackaging;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the packaging: ${error.message}`
      );
    }
  }
}

module.exports = new PackagingService();
