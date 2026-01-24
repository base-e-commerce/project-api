const prisma = require("../database/database");

const normalizeNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeOptionalNumber = (value) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

class DevisService {
  async createDevis(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newDevis = await prisma.devis.create({
          data: {
            user_id: normalizeNullableNumber(data.user_id),
            product_id: normalizeNullableNumber(data.product_id),
            box_id: normalizeNullableNumber(data.box_id),
            email: data.email,
            nombre: normalizeNullableNumber(data.nombre),
            description: data.description ?? null,
            telephone: data.telephone ?? null,
            entreprise: data.entreprise ?? null,
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
      const updatePayload = {
        productJson: data.productJson ?? undefined,
        telephone: data.telephone ?? undefined,
        email: data.email ?? undefined,
        entreprise: data.entreprise ?? undefined,
        description: data.description ?? undefined,
        nombre: normalizeOptionalNumber(data.nombre),
        box_id: normalizeOptionalNumber(data.box_id),
        product_id: normalizeOptionalNumber(data.product_id),
      };

      Object.keys(updatePayload).forEach((key) => {
        if (updatePayload[key] === undefined) {
          delete updatePayload[key];
        }
      });

      const updatedDevis = await prisma.devis.update({
        where: { id: devisId },
        data: updatePayload,
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
