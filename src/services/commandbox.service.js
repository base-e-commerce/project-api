const prisma = require("../database/database");

class CommandBoxService {
  constructor() {
    this.defaultLimit = 20;
    this.maxLimit = 50;
    this.defaultInclude = {
      box: {
        select: {
          box_id: true,
          name: true,
          slug: true,
          price: true,
          currency: true,
          cover: true,
          is_active: true,
        },
      },
      commande: {
        select: {
          commande_id: true,
          customer_id: true,
          status: true,
          order_date: true,
          total_amount: true,
        },
      },
    };
  }

  sanitizeStatus(value) {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
  }

  normalizeStatus(value) {
    return this.sanitizeStatus(value) || "pending";
  }

  toNumber(value) {
    if (value === undefined || value === null) {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  normalizePage(value) {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return 1;
    }
    return Math.floor(parsed);
  }

  normalizeLimit(value) {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return this.defaultLimit;
    }
    return Math.min(this.maxLimit, Math.floor(parsed));
  }

  normalizeRecord(record) {
    if (!record) {
      return null;
    }

    const normalizedBox = record.box
      ? {
          box_id: record.box.box_id,
          name: record.box.name,
          slug: record.box.slug,
          price: this.toNumber(record.box.price),
          currency: record.box.currency,
          cover: record.box.cover,
          is_active: record.box.is_active,
        }
      : null;

    const normalizedCommande = record.commande
      ? {
          commande_id: record.commande.commande_id,
          customer_id: record.commande.customer_id,
          status: record.commande.status,
          order_date: record.commande.order_date,
          total_amount: this.toNumber(record.commande.total_amount),
        }
      : null;

    return {
      command_box_id: record.command_box_id,
      commande_id: record.commande_id,
      box_id: record.box_id,
      quantity: record.quantity,
      unit_price: this.toNumber(record.unit_price),
      created_at: record.created_at,
      updated_at: record.updated_at,
      status: record.status,
      box: normalizedBox,
      commande: normalizedCommande,
    };
  }

  buildCreatePayload(payload) {
    return {
      commande_id: Number(payload.commande_id),
      box_id: Number(payload.box_id),
      quantity: payload.quantity ?? 1,
      unit_price: Number(payload.unit_price),
      status: this.normalizeStatus(payload.status),
    };
  }

  buildUpdatePayload(payload) {
    const data = {};
    if (payload.commande_id !== undefined) {
      data.commande_id = Number(payload.commande_id);
    }
    if (payload.box_id !== undefined) {
      data.box_id = Number(payload.box_id);
    }
    if (payload.quantity !== undefined) {
      data.quantity = payload.quantity;
    }
    if (payload.unit_price !== undefined) {
      data.unit_price = Number(payload.unit_price);
    }
    if (payload.status !== undefined) {
      data.status = this.normalizeStatus(payload.status);
    }
    return data;
  }

  async listCommandBoxes({ page = 1, limit = this.defaultLimit, commandeId, boxId, status } = {}) {
    const sanitizedPage = this.normalizePage(page);
    const sanitizedLimit = this.normalizeLimit(limit);
    const skip = (sanitizedPage - 1) * sanitizedLimit;

    const where = {};
    if (commandeId !== undefined && commandeId !== null && String(commandeId).trim() !== "") {
      where.commande_id = Number(commandeId);
    }
    if (boxId !== undefined && boxId !== null && String(boxId).trim() !== "") {
      where.box_id = Number(boxId);
    }
    const statusFilter = this.sanitizeStatus(status);
    if (statusFilter) {
      where.status = statusFilter;
    }

    const [records, totalItems] = await Promise.all([
      prisma.commandBox.findMany({
        where,
        include: this.defaultInclude,
        skip,
        take: sanitizedLimit,
        orderBy: { created_at: "desc" },
      }),
      prisma.commandBox.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / sanitizedLimit));

    return {
      items: records.map((record) => this.normalizeRecord(record)),
      pagination: {
        page: sanitizedPage,
        limit: sanitizedLimit,
        totalPages,
        totalItems,
      },
    };
  }

  async getCommandBoxById(id) {
    const record = await prisma.commandBox.findUnique({
      where: { command_box_id: Number(id) },
      include: this.defaultInclude,
    });
    return this.normalizeRecord(record);
  }

  async createCommandBox(payload) {
    const data = this.buildCreatePayload(payload);

    const [commande, box] = await Promise.all([
      prisma.commande.findUnique({ where: { commande_id: data.commande_id } }),
      prisma.box.findUnique({ where: { box_id: data.box_id } }),
    ]);

    if (!commande) {
      throw new Error("Commande not found");
    }

    if (!box) {
      throw new Error("Box not found");
    }

    const record = await prisma.commandBox.create({
      data,
      include: this.defaultInclude,
    });
    return this.normalizeRecord(record);
  }

  async updateCommandBox(id, payload) {
    const existing = await prisma.commandBox.findUnique({
      where: { command_box_id: Number(id) },
    });

    if (!existing) {
      return null;
    }

    const data = this.buildUpdatePayload(payload);

    if (data.commande_id && data.commande_id !== existing.commande_id) {
      const commande = await prisma.commande.findUnique({
        where: { commande_id: data.commande_id },
      });
      if (!commande) {
        throw new Error("Commande not found");
      }
    }

    if (data.box_id && data.box_id !== existing.box_id) {
      const box = await prisma.box.findUnique({
        where: { box_id: data.box_id },
      });
      if (!box) {
        throw new Error("Box not found");
      }
    }

    const updated = await prisma.commandBox.update({
      where: { command_box_id: existing.command_box_id },
      data,
      include: this.defaultInclude,
    });

    return this.normalizeRecord(updated);
  }

  async deleteCommandBox(id) {
    const existing = await prisma.commandBox.findUnique({
      where: { command_box_id: Number(id) },
      include: this.defaultInclude,
    });

    if (!existing) {
      return null;
    }

    await prisma.commandBox.delete({
      where: { command_box_id: existing.command_box_id },
    });

    return this.normalizeRecord(existing);
  }
}

module.exports = new CommandBoxService();
