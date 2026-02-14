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

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return String(value);
};

const toNumberOrNull = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseImageArray = (value) => {
  if (!value && value !== "") {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item && item.length > 0);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (typeof value === "object" && value !== null && Array.isArray(value.imageUrls)) {
    return parseImageArray(value.imageUrls);
  }
  return [];
};

class DevisService {
  async buildMachineProductJson(machineId, db) {
    if (!machineId) {
      return null;
    }

    const machine = await db.machine.findUnique({
      where: { machine_id: machineId },
    });

    if (!machine) {
      throw new Error("Machine not found");
    }

    const imageUrls = parseImageArray(machine.image_urls);
    return {
      type: "machine",
      machine_id: machine.machine_id,
      name: machine.name,
      slug: machine.slug,
      description: machine.description,
      descriptionRich: machine.descriptionRich,
      price: toNumberOrNull(machine.price),
      currency: machine.currency || "EUR",
      cover: machine.cover || imageUrls[0] || null,
      imageUrls,
      is_active: machine.is_active,
    };
  }

  async buildBoxProductJson(boxId, db) {
    if (!boxId) {
      return null;
    }

    const box = await db.box.findUnique({
      where: { box_id: boxId },
    });

    if (!box) {
      throw new Error("Box not found");
    }

    const imageUrls = parseImageArray(box.image_urls);
    return {
      type: "box",
      box_id: box.box_id,
      name: box.name,
      slug: box.slug,
      description: box.description,
      descriptionRich: box.descriptionRich,
      price: toNumberOrNull(box.price),
      price_pro: toNumberOrNull(box.price_pro),
      currency: box.currency || "EUR",
      cover: box.cover || imageUrls[0] || null,
      imageUrls,
      is_active: box.is_active,
    };
  }

  async buildProductProductJson(productId, db) {
    if (!productId) {
      return null;
    }

    const product = await db.product.findUnique({
      where: { product_id: productId },
      select: {
        product_id: true,
        name: true,
        description: true,
        descriptionRich: true,
        price: true,
        price_pro: true,
        currency: true,
        image_url: true,
        is_active: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    return {
      type: "product",
      product_id: product.product_id,
      name: product.name,
      description: product.description,
      descriptionRich: product.descriptionRich,
      price: toNumberOrNull(product.price),
      price_pro: toNumberOrNull(product.price_pro),
      currency: product.currency || "EUR",
      cover: product.image_url || null,
      imageUrls: product.image_url ? [product.image_url] : [],
      is_active: product.is_active,
    };
  }

  async resolveProductJson(data, db) {
    if (data.productJson && typeof data.productJson === "object") {
      return data.productJson;
    }

    const machineId = normalizeNullableNumber(data.machine_id);
    if (machineId) {
      return this.buildMachineProductJson(machineId, db);
    }

    const boxId = normalizeNullableNumber(data.box_id);
    if (boxId) {
      return this.buildBoxProductJson(boxId, db);
    }

    const productId = normalizeNullableNumber(data.product_id);
    if (productId) {
      return this.buildProductProductJson(productId, db);
    }

    throw new Error("productJson or a valid product reference is required");
  }

  async createDevis(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (tx) => {
      try {
        const resolvedProductJson = await this.resolveProductJson(data, tx);

        const newDevis = await tx.devis.create({
          data: {
            user_id: normalizeNullableNumber(data.user_id),
            product_id: normalizeNullableNumber(data.product_id),
            box_id: normalizeNullableNumber(data.box_id),
            machine_id: normalizeNullableNumber(data.machine_id),
            email: data.email,
            nombre: normalizeNullableNumber(data.nombre),
            description: data.description ?? null,
            telephone: data.telephone ?? null,
            entreprise: data.entreprise ?? null,
            country: normalizeText(data.country),
            status: data.status ?? "pending",
            productJson: resolvedProductJson,
            price_final: normalizeOptionalNumber(data.price_final),
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
        where: { email },
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
        machine_id: normalizeOptionalNumber(data.machine_id),
        country: data.country !== undefined ? normalizeText(data.country) : undefined,
        status: data.status ?? undefined,
        price_final: normalizeOptionalNumber(data.price_final),
      };

      if (updatePayload.productJson === undefined) {
        const hasReferenceUpdate =
          updatePayload.product_id !== undefined ||
          updatePayload.box_id !== undefined ||
          updatePayload.machine_id !== undefined;

        const hasResolvableReference =
          Number.isFinite(updatePayload.machine_id) ||
          Number.isFinite(updatePayload.box_id) ||
          Number.isFinite(updatePayload.product_id);

        if (hasReferenceUpdate && hasResolvableReference) {
          updatePayload.productJson = await this.resolveProductJson(
            {
              product_id: updatePayload.product_id,
              box_id: updatePayload.box_id,
              machine_id: updatePayload.machine_id,
            },
            prisma
          );
        }
      }

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
