const prisma = require("../database/database");
const { slugify, tryParseJson } = require("../utils/slug.util");

class ServiceProService {
  normalizeNullableValue(value) {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }
    return value;
  }

  buildIdentifierFilter(identifier) {
    if (identifier === undefined || identifier === null) {
      return null;
    }

    if (typeof identifier === "number" && !Number.isNaN(identifier)) {
      return { service_id: identifier };
    }

    if (typeof identifier === "string") {
      const trimmed = identifier.trim();
      if (!trimmed) {
        return null;
      }
      const numericOnly = /^\d+$/.test(trimmed);
      if (numericOnly) {
        return { service_id: Number(trimmed) };
      }
      return { slug: slugify(trimmed) };
    }

    return null;
  }

  async generateUniqueSlug(source, excludeId) {
    if (!source) {
      return null;
    }
    const baseSlug = slugify(source);
    if (!baseSlug) {
      return null;
    }

    let candidate = baseSlug;
    let suffix = 1;

    while (true) {
      const existing = await prisma.service.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { service_id: { not: excludeId } } : {}),
        },
        select: { service_id: true },
      });

      if (!existing) {
        return candidate;
      }

      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  buildMetadataPayload(data) {
    const fields = ["meta_title", "meta_description", "meta_keywords", "meta_image_url"];
    return fields.reduce((acc, field) => {
      if (data[field] !== undefined) {
        acc[field] = this.normalizeNullableValue(data[field]);
      }
      return acc;
    }, {});
  }

  normalizeSchemaMarkup(value) {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === "") {
      return null;
    }
    if (typeof value === "object") {
      return value;
    }
    if (typeof value === "string") {
      return tryParseJson(value);
    }
    return null;
  }

  async ensureSlugPersistence(service) {
    if (!service || service.slug || !service.name) {
      return service;
    }

    const slug = await this.generateUniqueSlug(service.name, service.service_id);
    if (!slug) {
      return service;
    }

    const updatedService = await prisma.service.update({
      where: { service_id: service.service_id },
      data: { slug },
      include: { categories: true },
    });

    return updatedService;
  }

  async createService(data) {
    try {
      const metadata = this.buildMetadataPayload(data);
      const schemaMarkup = this.normalizeSchemaMarkup(data.schema_markup);
      const slug = await this.generateUniqueSlug(
        data.slug || data.name,
        null
      );

      const newService = await prisma.service.create({
        data: {
          name: data.name,
          secure: data.secure ?? false,
          description: this.normalizeNullableValue(data.description),
          image_url: this.normalizeNullableValue(data.image_url),
          slug,
          ...metadata,
          schema_markup: schemaMarkup ?? null,
        },
        include: { categories: true },
      });

      return newService;
    } catch (error) {
      throw new Error(
        `Error occurred while creating the service: ${error.message}`
      );
    }
  }

  async getAllServices() {
    try {
      const services = await prisma.service.findMany({
        include: { categories: true },
        orderBy: { created_at: "desc" },
        where: {
          is_active: true,
        },
      });

      const hydrated = await Promise.all(
        services.map((service) => this.ensureSlugPersistence(service))
      );

      return hydrated;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving services: ${error.message}`
      );
    }
  }

  async getServiceById(identifier) {
    try {
      const filter = this.buildIdentifierFilter(identifier);
      if (!filter) {
        return null;
      }

      const service = await prisma.service.findFirst({
        where: { ...filter, is_active: true },
        include: { categories: { where: { is_active: true } } },
      });

      return await this.ensureSlugPersistence(service);
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the service: ${error.message}`
      );
    }
  }

  async updateService(serviceId, data) {
    try {
      const existing = await prisma.service.findUnique({
        where: { service_id: serviceId },
        select: { slug: true },
      });

      if (!existing) {
        return null;
      }

      const updateData = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.description !== undefined) {
        updateData.description = this.normalizeNullableValue(data.description);
      }

      if (data.secure !== undefined) {
        updateData.secure = data.secure;
      }

      if (data.image_url !== undefined) {
        updateData.image_url = this.normalizeNullableValue(data.image_url);
      }

      const metadata = this.buildMetadataPayload(data);
      Object.assign(updateData, metadata);

      if (data.schema_markup !== undefined) {
        updateData.schema_markup = this.normalizeSchemaMarkup(
          data.schema_markup
        );
      }

      if (data.slug !== undefined) {
        const normalizedSlug = this.normalizeNullableValue(data.slug);
        updateData.slug = normalizedSlug
          ? await this.generateUniqueSlug(normalizedSlug, serviceId)
          : null;
      } else if (!existing.slug && data.name) {
        const generatedSlug = await this.generateUniqueSlug(
          data.name,
          serviceId
        );
        if (generatedSlug) {
          updateData.slug = generatedSlug;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return await prisma.service.findUnique({
          where: { service_id: serviceId },
          include: { categories: true },
        });
      }

      const updatedService = await prisma.service.update({
        where: { service_id: serviceId },
        data: updateData,
        include: { categories: true },
      });

      return updatedService;
    } catch (error) {
      throw new Error(
        `Error occurred while updating the service: ${error.message}`
      );
    }
  }

  async deleteService(serviceId) {
    try {
      const deletedService = await prisma.service.delete({
        where: { service_id: serviceId },
      });
      return deletedService;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the service: ${error.message}`
      );
    }
  }
}

module.exports = new ServiceProService();
