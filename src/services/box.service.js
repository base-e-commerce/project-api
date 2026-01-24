
const prisma = require("../database/database");
const { slugify, tryParseJson } = require("../utils/slug.util");

class BoxService {
  constructor() {
    this.defaultSort = "latest";
    this.sorts = {
      latest: [{ created_at: "desc" }],
      oldest: [{ created_at: "asc" }],
      "price-asc": [{ price: "asc" }],
      "price-desc": [{ price: "desc" }],
      alpha: [{ name: "asc" }],
    };
  }

  normalizeNumber(value, fallback) {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return fallback;
    }
    return parsed;
  }

  resolveSort(sortKey) {
    if (typeof sortKey === "string" && this.sorts[sortKey]) {
      return sortKey;
    }
    return this.defaultSort;
  }

  buildStatusFilter(rawStatus) {
    const status = typeof rawStatus === "string" ? rawStatus.trim().toLowerCase() : null;
    if (status === "inactive") {
      return { is_active: false };
    }
    if (status === "all") {
      return {};
    }
    return { is_active: true };
  }

  buildSearchFilters(term) {
    const normalized = (term || "").trim();
    if (!normalized) {
      return null;
    }

    const searchField = (field) => ({
      [field]: {
        contains: normalized,
      },
    });
    return ["name", "description", "descriptionRich"].map((field) => searchField(field));
  }

  parseImageArray(value) {
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
      return this.parseImageArray(value.imageUrls);
    }
    return [];
  }

  parseConfig(value) {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    if (typeof value === "object") {
      return value;
    }
    if (typeof value === "string") {
      return tryParseJson(value) ?? null;
    }
    return null;
  }

  toNumber(value) {
    if (value === null || value === undefined) {
      return null;
    }
    return Number(value);
  }

  normalizeBox(record) {
    if (!record) {
      return null;
    }
    const imageUrls = this.parseImageArray(record.image_urls);

    return {
      box_id: record.box_id,
      slug: record.slug,
      name: record.name,
      description: record.description,
      descriptionRich: record.descriptionRich,
      config: record.config ?? null,
      price: this.toNumber(record.price),
      price_pro:
        record.price_pro === null || record.price_pro === undefined
          ? null
          : this.toNumber(record.price_pro),
      currency: record.currency,
      cover: record.cover || imageUrls[0] || null,
      imageUrls,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  buildUniqueWhere(identifier) {
    if (identifier === undefined || identifier === null) {
      return null;
    }
    if (typeof identifier === "number") {
      return { box_id: identifier };
    }
    const trimmed = String(identifier).trim();
    if (!trimmed) {
      return null;
    }
    if (/^\d+$/.test(trimmed)) {
      return { box_id: Number(trimmed) };
    }
    const normalizedSlug = slugify(trimmed);
    if (!normalizedSlug) {
      return null;
    }
    return { slug: normalizedSlug };
  }

  async ensureUniqueSlug(desired, currentId) {
    const base = slugify(desired || "") || `box-${Date.now()}`;
    let candidate = base;
    let counter = 1;

    while (true) {
      const existing = await prisma.box.findUnique({ where: { slug: candidate } });
      if (!existing || (currentId && existing.box_id === currentId)) {
        return candidate;
      }
      candidate = `${base}-${counter++}`;
    }
  }

  buildCreatePayload(payload) {
    const imageUrls = this.parseImageArray(payload.imageUrls);
    const config = this.parseConfig(payload.config);

    return {
      name: payload.name,
      description: payload.description || null,
      descriptionRich: payload.descriptionRich || null,
      price: payload.price,
      price_pro:
        payload.price_pro === undefined || payload.price_pro === null
          ? null
          : payload.price_pro,
      currency: payload.currency || "EUR",
      cover: payload.cover || imageUrls[0] || null,
      image_urls: imageUrls,
      config,
      is_active: typeof payload.is_active === "boolean" ? payload.is_active : true,
    };
  }

  buildUpdatePayload(payload) {
    const data = {};
    if (payload.name !== undefined) {
      data.name = payload.name;
    }
    if (payload.description !== undefined) {
      data.description = payload.description || null;
    }
    if (payload.descriptionRich !== undefined) {
      data.descriptionRich = payload.descriptionRich || null;
    }
    if (payload.price !== undefined) {
      data.price = payload.price;
    }
    if (payload.price_pro !== undefined) {
      data.price_pro = payload.price_pro;
    }
    if (payload.currency !== undefined) {
      data.currency = payload.currency || null;
    }
    if (payload.cover !== undefined) {
      data.cover = payload.cover || null;
    }
    if (payload.imageUrls !== undefined) {
      data.image_urls = this.parseImageArray(payload.imageUrls);
      if ((payload.cover === undefined || payload.cover === null) && data.image_urls.length > 0) {
        data.cover = data.image_urls[0];
      }
    }
    if (payload.config !== undefined) {
      data.config = this.parseConfig(payload.config);
    }
    if (payload.is_active !== undefined) {
      data.is_active = payload.is_active;
    }
    return data;
  }

  async listBoxes({ page = 1, limit = 12, search = "", sort, status } = {}) {
    const sanitizedPage = this.normalizeNumber(page, 1);
    const sanitizedLimitRaw = this.normalizeNumber(limit, 12);
    const sanitizedLimit = Math.min(sanitizedLimitRaw, 50);
    const resolvedSortKey = this.resolveSort(sort);
    const where = this.buildStatusFilter(status);
    const searchFilters = this.buildSearchFilters(search);
    if (searchFilters) {
      where.OR = searchFilters;
    }

    const skip = (sanitizedPage - 1) * sanitizedLimit;

    const [records, totalItems] = await Promise.all([
      prisma.box.findMany({
        where,
        skip,
        take: sanitizedLimit,
        orderBy: this.sorts[resolvedSortKey],
      }),
      prisma.box.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / sanitizedLimit));

    return {
      boxes: records.map((record) => this.normalizeBox(record)),
      pagination: {
        page: sanitizedPage,
        totalPages,
        totalItems,
        limit: sanitizedLimit,
      },
    };
  }

  async getBox(identifier) {
    const uniqueWhere = this.buildUniqueWhere(identifier);
    if (!uniqueWhere) {
      return null;
    }

    const record = await prisma.box.findFirst({ where: uniqueWhere });
    return this.normalizeBox(record);
  }

  async createBox(payload) {
    const uniqueSlug = await this.ensureUniqueSlug(payload.slug || payload.name, null);
    const data = this.buildCreatePayload(payload);
    data.slug = uniqueSlug;

    const record = await prisma.box.create({ data });
    return this.normalizeBox(record);
  }

  async updateBox(identifier, payload) {
    const uniqueWhere = this.buildUniqueWhere(identifier);
    if (!uniqueWhere) {
      return null;
    }

    const existing = await prisma.box.findFirst({ where: uniqueWhere });
    if (!existing) {
      return null;
    }

    const data = this.buildUpdatePayload(payload);
    if (payload.slug !== undefined) {
      const desiredSlug = payload.slug || payload.name || existing.slug || existing.name;
      data.slug = await this.ensureUniqueSlug(desiredSlug, existing.box_id);
    }

    const updated = await prisma.box.update({ where: { box_id: existing.box_id }, data });
    return this.normalizeBox(updated);
  }

  async deleteBox(identifier) {
    const uniqueWhere = this.buildUniqueWhere(identifier);
    if (!uniqueWhere) {
      return null;
    }

    const existing = await prisma.box.findFirst({ where: uniqueWhere });
    if (!existing) {
      return null;
    }

    await prisma.box.delete({ where: { box_id: existing.box_id } });
    return this.normalizeBox(existing);
  }
}

module.exports = new BoxService();
