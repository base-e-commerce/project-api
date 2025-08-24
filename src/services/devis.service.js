const prisma = require("../database/database");

class DevisService {
  async createDevis(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newDevis = await prisma.devis.create({
          data: {
            user_id: data.user_id ? Number(data.user_id) : null,
            product_id: data.product_id ? Number(data.product_id) : null,
            email: data.email,
            nombre: data.nombre,
            description: data.description,
            telephone: data.telephone,
            productJson: data.productJson,
          },
        });
        return newDevis;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the devis: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getAllDevis() {
    try {
      const devisList = await prisma.devis.findMany();
      return devisList;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving devis: ${error.message}`
      );
    }
  }

  async getDevisById(devisId) {
    try {
      const devis = await prisma.devis.findUnique({
        where: { id: devisId },
      });
      return devis;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the devis: ${error.message}`
      );
    }
  }

  async getAllDevisByEmail(email) {
    try {
      const devisList = await prisma.devis.findMany({
        where: { email: email },
      });
      return devisList;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving devis for user: ${error.message}`
      );
    }
  }

  async updateDevis(devisId, data) {
    try {
      const updatedDevis = await prisma.devis.update({
        where: { id: devisId },
        data: {
          productJson: data.productJson,
          telephone: data.telephone ?? undefined,
          email: data.email ?? undefined,
        },
      });
      return updatedDevis;
    } catch (error) {
      throw new Error(
        `Error occurred while updating the devis: ${error.message}`
      );
    }
  }

  async deleteDevis(devisId) {
    try {
      const deletedDevis = await prisma.devis.delete({
        where: { id: devisId },
      });
      return deletedDevis;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the devis: ${error.message}`
      );
    }
  }
}

module.exports = new DevisService();
