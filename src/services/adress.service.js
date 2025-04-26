const prisma = require("../database/database");

class AdresseService {
  async createAdresse(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newAdresse = await prisma.adresse.create({
          data: {
            customer_id: data.customer_id,
            line1: data.line1,
            line2: data.line2,
            city: data.city,
            postal_code: data.postal_code,
            country: data.country,
          },
        });
        return newAdresse;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the address: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getAllAdresses() {
    try {
      const adresses = await prisma.adresse.findMany();
      return adresses;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving addresses: ${error.message}`
      );
    }
  }

  async getAdresseById(adresseId) {
    try {
      const adresse = await prisma.adresse.findUnique({
        where: { address_id: adresseId },
      });
      return adresse;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the address: ${error.message}`
      );
    }
  }

  async updateAdresse(adresseId, data) {
    try {
      const updatedAdresse = await prisma.adresse.update({
        where: { address_id: adresseId },
        data: {
          customer_id: data.customer_id,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          postal_code: data.postal_code,
          country: data.country,
        },
      });
      return updatedAdresse;
    } catch (error) {
      throw new Error(
        `Error occurred while updating the address: ${error.message}`
      );
    }
  }

  async deleteAdresse(adresseId) {
    try {
      const deletedAdresse = await prisma.adresse.delete({
        where: { address_id: adresseId },
      });
      return deletedAdresse;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the address: ${error.message}`
      );
    }
  }
}

module.exports = new AdresseService();
