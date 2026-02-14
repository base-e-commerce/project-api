const fs = require("fs/promises");
const path = require("path");
const prisma = require("../database/database");
const { slugify } = require("../utils/slug.util");

class MachineService {
  constructor() {
    this.defaultSort = "latest";
    this.sorts = {
      latest: [{ created_at: "desc" }],
      oldest: [{ created_at: "asc" }],
      "price-asc": [{ price: "asc" }],
      "price-desc": [{ price: "desc" }],
      alpha: [{ name: "asc" }],
    };
    this.assetPrefix = "/api/machine-assets/";
    this.machineUploadDir = path.join(process.cwd(), "uploads", "machines");
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

  toNumber(value) {
    if (value === null || value === undefined) {
      return null;
    }
    return Number(value);
  }

  normalizeMachine(record) {
    if (!record) {
      return null;
    }
    const imageUrls = this.parseImageArray(record.image_urls);

    return {
      machine_id: record.machine_id,
      slug: record.slug,
      name: record.name,
      description: record.description,
      descriptionRich: record.descriptionRich,
      price: this.toNumber(record.price),
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
      return { machine_id: identifier };
    }
    const trimmed = String(identifier).trim();
    if (!trimmed) {
      return null;
    }
    if (/^\d+$/.test(trimmed)) {
      return { machine_id: Number(trimmed) };
    }
    const normalizedSlug = slugify(trimmed);
    if (!normalizedSlug) {
      return null;
    }
    return { slug: normalizedSlug };
  }

  async ensureUniqueSlug(desired, currentId) {
    const base = slugify(desired || "") || `machine-${Date.now()}`;
    let candidate = base;
    let counter = 1;

    while (true) {
      const existing = await prisma.machine.findUnique({ where: { slug: candidate } });
      if (!existing || (currentId && existing.machine_id === currentId)) {
        return candidate;
      }
      candidate = `${base}-${counter++}`;
    }
  }

  buildCreatePayload(payload) {
    const imageUrls = this.parseImageArray(payload.imageUrls);

    return {
      name: payload.name,
      description: payload.description || null,
      descriptionRich: payload.descriptionRich || null,
      price: payload.price,
      currency: payload.currency || "EUR",
      cover: payload.cover || imageUrls[0] || null,
      image_urls: imageUrls,
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
    if (payload.currency !== undefined) {
      data.currency = payload.currency || "EUR";
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
    if (payload.is_active !== undefined) {
      data.is_active = payload.is_active;
    }
    return data;
  }

  extractMachineAssetFilename(assetUrl) {
    if (!assetUrl || typeof assetUrl !== "string") {
      return null;
    }
    const clean = assetUrl.trim();
    if (!clean) {
      return null;
    }
    if (clean.includes(this.assetPrefix)) {
      return path.basename(clean.split("?")[0]);
    }
    if (!clean.includes("/") && !clean.includes("\\")) {
      return clean;
    }
    return null;
  }

  async deleteMachineAssets(machine) {
    const imageUrls = this.parseImageArray(machine.image_urls);
    const candidates = [machine.cover, ...imageUrls];
    const filenames = Array.from(
      new Set(
        candidates
          .map((url) => this.extractMachineAssetFilename(url))
          .filter((filename) => Boolean(filename))
      )
    );

    await Promise.all(
      filenames.map(async (filename) => {
        try {
          await fs.unlink(path.join(this.machineUploadDir, filename));
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }
      })
    );
  }

  async listMachines({ page = 1, limit = 12, search = "", sort, status, includeInactive = false } = {}) {
    const sanitizedPage = this.normalizeNumber(page, 1);
    const sanitizedLimitRaw = this.normalizeNumber(limit, 12);
    const sanitizedLimit = Math.min(sanitizedLimitRaw, 50);
    const resolvedSortKey = this.resolveSort(sort);
    const where = includeInactive ? this.buildStatusFilter(status) : { is_active: true };
    const searchFilters = this.buildSearchFilters(search);
    if (searchFilters) {
      where.OR = searchFilters;
    }

    const skip = (sanitizedPage - 1) * sanitizedLimit;

    const [records, totalItems] = await Promise.all([
      prisma.machine.findMany({
        where,
        skip,
        take: sanitizedLimit,
        orderBy: this.sorts[resolvedSortKey],
      }),
      prisma.machine.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / sanitizedLimit));

    return {
      machines: records.map((record) => this.normalizeMachine(record)),
      pagination: {
        page: sanitizedPage,
        totalPages,
        totalItems,
        limit: sanitizedLimit,
      },
    };
  }

  async getMachine(identifier, { onlyActive = false } = {}) {
    const uniqueWhere = this.buildUniqueWhere(identifier);
    if (!uniqueWhere) {
      return null;
    }

    const where = onlyActive ? { ...uniqueWhere, is_active: true } : uniqueWhere;
    const record = await prisma.machine.findFirst({ where });
    return this.normalizeMachine(record);
  }

  async createMachine(payload) {
    const uniqueSlug = await this.ensureUniqueSlug(payload.slug || payload.name, null);
    const data = this.buildCreatePayload(payload);
    data.slug = uniqueSlug;

    const record = await prisma.machine.create({ data });
    return this.normalizeMachine(record);
  }

  async updateMachine(identifier, payload) {
    const uniqueWhere = this.buildUniqueWhere(identifier);
    if (!uniqueWhere) {
      return null;
    }

    const existing = await prisma.machine.findFirst({ where: uniqueWhere });
    if (!existing) {
      return null;
    }

    const data = this.buildUpdatePayload(payload);
    if (payload.slug !== undefined) {
      const desiredSlug = payload.slug || payload.name || existing.slug || existing.name;
      data.slug = await this.ensureUniqueSlug(desiredSlug, existing.machine_id);
    }

    const updated = await prisma.machine.update({
      where: { machine_id: existing.machine_id },
      data,
    });
    return this.normalizeMachine(updated);
  }

  async deleteMachine(identifier) {
    const uniqueWhere = this.buildUniqueWhere(identifier);
    if (!uniqueWhere) {
      return null;
    }

    const existing = await prisma.machine.findFirst({ where: uniqueWhere });
    if (!existing) {
      return null;
    }

    await prisma.machine.delete({ where: { machine_id: existing.machine_id } });
    await this.deleteMachineAssets(existing);
    return this.normalizeMachine(existing);
  }
}

module.exports = new MachineService();
