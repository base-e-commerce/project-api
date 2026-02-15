const prisma = require("../database/database");

class DemandeMachineService {
  resolveAssetBase() {
    const baseUrl = process.env.BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";
    return `${baseUrl}/api/demande-machine-assets`;
  }

  normalizeNumber(value, fallback) {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return fallback;
    }
    return parsed;
  }

  parsePrice(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      return null;
    }
    return parsed;
  }

  buildAssetUrl(filename) {
    return `${this.resolveAssetBase()}/${filename}`;
  }

  parseImageUrls(value) {
    if (!value && value !== "") {
      return [];
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? [trimmed] : [];
    }
    return [];
  }

  normalizeDemandeMachine(record) {
    if (!record) {
      return null;
    }

    const imageUrls = this.parseImageUrls(record.image_urls);
    return {
      id: record.id,
      customerId: record.customerId,
      customer:
        record.customer && typeof record.customer === "object"
          ? {
              customer_id: record.customer.customer_id,
              first_name: record.customer.first_name,
              last_name: record.customer.last_name,
              email: record.customer.email,
            }
          : undefined,
      description: record.description,
      image: record.image,
      imageUrls,
      price: record.price === null ? null : Number(record.price),
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async createDemandeMachine({ customerId, description, image, imageUrls }) {
    const normalizedImageUrls = this.parseImageUrls(imageUrls);
    const primaryImage = image || normalizedImageUrls[0] || null;
    if (!primaryImage) {
      throw new Error("At least one image is required");
    }

    const created = await prisma.demandeMachine.create({
      data: {
        customerId,
        description,
        image: primaryImage,
        image_urls: normalizedImageUrls.length ? normalizedImageUrls : [primaryImage],
        status: "PENDING",
        price: null,
      },
    });
    return this.normalizeDemandeMachine(created);
  }

  async listCustomerDemandes({ customerId, page = 1, limit = 10 }) {
    const safePage = this.normalizeNumber(page, 1);
    const safeLimit = Math.min(this.normalizeNumber(limit, 10), 50);
    const skip = (safePage - 1) * safeLimit;

    const [demandes, total] = await prisma.$transaction([
      prisma.demandeMachine.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit,
      }),
      prisma.demandeMachine.count({ where: { customerId } }),
    ]);

    return {
      demandes: demandes.map((item) => this.normalizeDemandeMachine(item)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  async listAdminDemandes({ page = 1, limit = 20, status }) {
    const safePage = this.normalizeNumber(page, 1);
    const safeLimit = Math.min(this.normalizeNumber(limit, 20), 100);
    const skip = (safePage - 1) * safeLimit;
    const where = status ? { status } : {};

    const [demandes, total] = await prisma.$transaction([
      prisma.demandeMachine.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit,
        include: {
          customer: {
            select: {
              customer_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      }),
      prisma.demandeMachine.count({ where }),
    ]);

    return {
      demandes: demandes.map((item) => this.normalizeDemandeMachine(item)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  async updateDemandeMachineAdmin(id, { price, status }) {
    const demandeId = Number(id);
    if (Number.isNaN(demandeId) || demandeId <= 0) {
      return null;
    }

    const existing = await prisma.demandeMachine.findUnique({
      where: { id: demandeId },
    });
    if (!existing) {
      return null;
    }

    const data = {};
    if (price !== undefined) {
      data.price = this.parsePrice(price);
    }
    if (status !== undefined) {
      data.status = status;
    }

    const updated = await prisma.demandeMachine.update({
      where: { id: demandeId },
      data,
      include: {
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return this.normalizeDemandeMachine(updated);
  }
}

module.exports = new DemandeMachineService();
