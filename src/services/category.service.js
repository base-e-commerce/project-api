const prisma = require("../database/database");
const { slugify, tryParseJson } = require("../utils/slug.util");

class CategoryService {
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
      return { categorie_id: identifier };
    }

    if (typeof identifier === "string") {
      const trimmed = identifier.trim();
      if (!trimmed) {
        return null;
      }
      const numericOnly = /^\d+$/.test(trimmed);
      if (numericOnly) {
        return { categorie_id: Number(trimmed) };
      }
      return { slug: slugify(trimmed) };
    }
    return null;
  }

  buildServiceFilter(identifier) {
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
      if (/^\d+$/.test(trimmed)) {
        return { service_id: Number(trimmed) };
      }
      return { service: { slug: slugify(trimmed) } };
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
      const existing = await prisma.categorie.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { categorie_id: { not: excludeId } } : {}),
        },
        select: { categorie_id: true },
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

  async ensureSlugPersistence(category) {
    if (!category || category.slug || !category.name) {
      return category;
    }

    const slug = await this.generateUniqueSlug(
      category.name,
      category.categorie_id
    );

    if (!slug) {
      return category;
    }

    const updatedCategory = await prisma.categorie.update({
      where: { categorie_id: category.categorie_id },
      data: { slug },
    });

    return { ...category, slug: updatedCategory.slug };
  }

  async createCategory(data) {
    const transaction = await prisma.$transaction(async (tx) => {
      try {
        const metadata = this.buildMetadataPayload(data);
        const schemaMarkup = this.normalizeSchemaMarkup(data.schema_markup);
        const slug = await this.generateUniqueSlug(
          data.slug || data.name,
          null
        );

        const newCategory = await tx.categorie.create({
          data: {
            name: data.name,
            description: this.normalizeNullableValue(data.description),
            secure: data.secure ?? false,
            service_id: data.service_id,
            slug,
            ...metadata,
            schema_markup: schemaMarkup ?? null,
          },
        });
        return newCategory;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the category: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getAllCategories() {
    try {
      const categories = await prisma.categorie.findMany({
        orderBy: { created_at: "desc" },
        where: {
          is_active: true,
        },
      });

      return Promise.all(
        categories.map((category) => this.ensureSlugPersistence(category))
      );
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving categories: ${error.message}`
      );
    }
  }

  async getAllCategoriesByService(serviceIdentifier) {
    try {
      const serviceFilter = this.buildServiceFilter(serviceIdentifier);
      if (!serviceFilter) {
        return [];
      }

      const categories = await prisma.categorie.findMany({
        where: { ...serviceFilter, is_active: true },
        orderBy: { created_at: "desc" },
      });
      return Promise.all(
        categories.map((category) => this.ensureSlugPersistence(category))
      );
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving categories by service: ${error.message}`
      );
    }
  }

  async getCategoryById(identifier) {
    try {
      const filter = this.buildIdentifierFilter(identifier);
      if (!filter) {
        return null;
      }
      const category = await prisma.categorie.findFirst({
        where: { ...filter, is_active: true },
      });
      return await this.ensureSlugPersistence(category);
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the category: ${error.message}`
      );
    }
  }

  async updateCategory(categoryId, data) {
    try {
      const existing = await prisma.categorie.findUnique({
        where: { categorie_id: categoryId },
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

      if (data.service_id !== undefined) {
        updateData.service_id = data.service_id;
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
          ? await this.generateUniqueSlug(normalizedSlug, categoryId)
          : null;
      } else if (!existing.slug && data.name) {
        const generatedSlug = await this.generateUniqueSlug(
          data.name,
          categoryId
        );
        if (generatedSlug) {
          updateData.slug = generatedSlug;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return await prisma.categorie.findUnique({
          where: { categorie_id: categoryId },
        });
      }

      const updatedCategory = await prisma.categorie.update({
        where: { categorie_id: categoryId },
        data: updateData,
      });

      return updatedCategory;
    } catch (error) {
      throw new Error(
        `Error occurred while updating the category: ${error.message}`
      );
    }
  }

  async deleteCategory(categoryId) {
    try {
      const deletedCategory = await prisma.categorie.delete({
        where: { categorie_id: categoryId },
      });
      return deletedCategory;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the category: ${error.message}`
      );
    }
  }
}

module.exports = new CategoryService();
