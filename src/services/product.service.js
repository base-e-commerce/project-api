const prisma = require("../database/database");
const { slugify } = require("../utils/slug.util");

class ProductService {
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

  buildCategoryFilter(identifier) {
    if (identifier === undefined || identifier === null) {
      return null;
    }

    if (typeof identifier === "number" && !Number.isNaN(identifier)) {
      return { category_id: identifier };
    }

    if (typeof identifier === "string") {
      const trimmed = identifier.trim();
      if (!trimmed) {
        return null;
      }

      if (/^\d+$/.test(trimmed)) {
        return { category_id: Number(trimmed) };
      }

      return { category: { slug: slugify(trimmed) } };
    }

    return null;
  }

  async createProduct(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        let price_final_pro = 0;
        if (data.price_pro == 0) {
          price_final_pro = parseFloat(data.price) / 5;
        } else {
          price_final_pro = data.price_pro;
        }
        const newProduct = await prisma.product.create({
          data: {
            name: data.name,
            description: data.description,
            descriptionRich: data.descriptionRich,
            currency: data.currency,
            currency_name: data.currency_name,
            price: data.price,
            price_pro: price_final_pro,
            stock_quantity: data.stock_quantity,
            image_url: data.image_url,
            category_id: data.category_id,
            service_id: data.service_id,
            is_active: data.is_active,
            is_for_pro: data.is_for_pro,
            suggest: data.suggest ?? false,
            min_commande_standard: data.min_commande_standard || { tiers: [] },
            min_commande_prof: data.min_commande_prof || { tiers: [] },
            min_co_standard: data.min_co_standard ?? null,
            min_co_pro: data.min_co_pro ?? null,
          },
        });
        return newProduct;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the product: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getSearchProducts(key) {
    try {
      const product = await prisma.product.findMany({
        where: {
          is_active: true,
          OR: [{ name: { contains: key } }, { description: { contains: key } }],
        },
        include: {
          productImages: true,
          category: true,
          service: true,
        },
        orderBy: { created_at: "desc" },
      });
      return product;
    } catch (error) {
      throw new Error(
        `Error occurred while searching for product: ${error.message}`
      );
    }
  }
  async getSearchProductsWithCategorySelected(idCategory, key) {
    try {
      const whereClause = { is_active: true };

      if (idCategory !== 0) {
        whereClause.category_id = idCategory;
      }

      if (key && key.trim() !== "") {
        const keyFilter = {
          OR: [{ name: { contains: key } }, { description: { contains: key } }],
        };

        if (idCategory !== 0) {
          whereClause.AND = [keyFilter];
        } else {
          Object.assign(whereClause, keyFilter);
        }
      }

      const product = await prisma.product.findMany({
        where: whereClause,
        include: {
          productImages: true,
          category: true,
          service: true,
        },
        orderBy: { created_at: "desc" },
      });

      return product;
    } catch (error) {
      throw new Error(
        `Error occurred while searching for product: ${error.message}`
      );
    }
  }

  async getAllProducts(limit, offset) {
    try {
      const products = await prisma.product.findMany({
        include: {
          productImages: true,
          category: true,
          service: true,
          reviews: {
            include: {
              customer: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
        where: { is_active: true },
      });

      const totalProducts = await prisma.product.count({
        where: { is_active: true },
      });

      return {
        products,
        totalProducts,
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving products: ${error.message}`
      );
    }
  }

  async getLastProductByServiceId(serviceId) {
    try {
      const products = await prisma.product.findMany({
        where: { service_id: serviceId, is_active: true },
        include: {
          productImages: true,
          category: true,
          service: true,
          reviews: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 4,
      });
      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the last products by service ID: ${error.message}`
      );
    }
  }

  async getOtherProductsInService(serviceId, productId) {
    try {
      const products = await prisma.product.findMany({
        where: {
          service_id: serviceId,
          product_id: { not: productId },
          is_active: true,
        },
        include: {
          productImages: true,
          category: true,
          service: true,
          reviews: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving other products in service: ${error.message}`
      );
    }
  }

  async getAllCategoryProducts(identifier, limit, offset) {
    try {
      const categoryFilter = this.buildCategoryFilter(identifier);
      if (!categoryFilter) {
        return { products: [], totalProducts: 0 };
      }

      const whereClause = { ...categoryFilter, is_active: true };

      const [products, totalProducts] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          include: {
            productImages: true,
            category: true,
            service: true,
            reviews: {
              include: {
                customer: true,
              },
            },
          },
          skip: offset,
          take: limit,
          orderBy: { created_at: "desc" },
        }),
        prisma.product.count({
          where: whereClause,
        }),
      ]);

      return {
        products,
        totalProducts,
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving products: ${error.message}`
      );
    }
  }

  async getAllServiceProducts(identifier, limit, offset) {
    try {
      const serviceFilter = this.buildServiceFilter(identifier);
      if (!serviceFilter) {
        return { products: [], totalProducts: 0 };
      }

      const whereClause = { ...serviceFilter, is_active: true };

      const [products, totalProducts] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          include: {
            productImages: true,
            category: true,
            service: true,
            reviews: {
              include: {
                customer: true,
              },
            },
          },
          skip: offset,
          take: limit,
          orderBy: { created_at: "desc" },
        }),
        prisma.product.count({
          where: whereClause,
        }),
      ]);

      return {
        products,
        totalProducts,
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving products: ${error.message}`
      );
    }
  }

  async getLastTenProducts() {
    try {
      const products = await prisma.product.findMany({
        orderBy: { created_at: "desc" },
        include: {
          productImages: true,
          category: {
            include: {
              service: true,
            },
          },
        },
        take: 10,
        where: { is_active: true },
      });
      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the last ten products: ${error.message}`
      );
    }
  }

  // async getProductsCategory(idCategory, limit) {
  //   try {
  //     const products = await prisma.product.findMany({
  //       where: { category_id: idCategory },
  //       include: { productImages: true, category: true, service: true, reviews: true, }, },
  //       take: limit,
  //     });
  //     return products;
  //   } catch (error) {
  //     throw new Error(
  //       `Error occurred while retrieving products by category: ${error.message}`
  //     );
  //   }
  // }
  async getProductsCategory(idCategory, limit) {
    try {
      const whereClause =
        idCategory === 0
          ? { is_active: true }
          : { category_id: idCategory, is_active: true };

      const products = await prisma.product.findMany({
        where: whereClause,
        include: {
          productImages: true,
          category: true,
          service: true,
        },
        take: limit,
      });

      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving products by category: ${error.message}`
      );
    }
  }

  async getLatestProducts(limit = 10) {
    try {
      const products = await prisma.product.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          created_at: "desc",
        },
        take: limit,
        include: {
          service: {
            select: {
              service_id: true,
              name: true,
            },
          },
          category: {
            select: {
              categorie_id: true,
              name: true,
            },
          },
          productImages: {
            select: {
              product_image_id: true,
              image_url: true,
            },
          },
        },
      });
      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving latest products: ${error.message}`
      );
    }
  }

  async getSuggestedProducts(limit = 12) {
    try {
      const products = await prisma.product.findMany({
        where: {
          is_active: true,
          suggest: true,
        },
        orderBy: {
          updated_at: "desc",
        },
        take: limit,
        include: {
          service: {
            select: {
              service_id: true,
              name: true,
            },
          },
          category: {
            select: {
              categorie_id: true,
              name: true,
            },
          },
          productImages: {
            select: {
              product_image_id: true,
              image_url: true,
            },
          },
        },
      });
      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving suggested products: ${error.message}`
      );
    }
  }

  async addImageToProduct(productId, imageUrl) {
    try {
      const productExists = await prisma.product.findUnique({
        where: { product_id: productId },
      });

      if (!productExists) {
        throw new Error(`Product with ID ${productId} does not exist`);
      }

      const productImage = await prisma.productImage.create({
        data: {
          product_id: productId,
          image_url: imageUrl,
        },
      });

      return productImage;
    } catch (error) {
      throw new Error(
        `Error occurred while adding image to product: ${error.message}`
      );
    }
  }

  async deleteImageProduct(productImageId) {
    try {
      const productImageExists = await prisma.productImage.findUnique({
        where: { product_image_id: productImageId },
      });
      if (!productImageExists) {
        throw new Error(
          `Product image with ID ${productImageId} does not exist`
        );
      }
      await prisma.productImage.delete({
        where: { product_image_id: productImageId },
      });
      return productImageExists;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting product image: ${error.message}`
      );
    }
  }

  async getProductById(productId) {
    try {
      const product = await prisma.product.findUnique({
        where: { product_id: productId },
        include: {
          productImages: true,
          category: true,
          service: true,
          reviews: {
            include: {
              customer: true,
            },
          },
        },
      });
      return product;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the product: ${error.message}`
      );
    }
  }

  async getProductsByIds(productIds) {
    try {
      const uniqueIds = Array.from(
        new Set(
          (productIds || [])
            .map((id) => Number(id))
            .filter((id) => !Number.isNaN(id))
        )
      );

      if (uniqueIds.length === 0) {
        return [];
      }

      const products = await prisma.product.findMany({
        where: {
          product_id: { in: uniqueIds },
        },
        select: {
          product_id: true,
          name: true,
          min_co_standard: true,
          min_co_pro: true,
        },
      });

      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving products by ids: ${error.message}`
      );
    }
  }

  async updateProduct(productId, data) {
    try {
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );

      const updatedProduct = await prisma.product.update({
        where: { product_id: productId },
        data: updateData,
      });
      return updatedProduct;
    } catch (error) {
      throw new Error(
        `Error occurred while updating product: ${error.message}`
      );
    }
  }

  async deleteProduct(productId) {
    try {
      const deletedProduct = await prisma.product.delete({
        where: { product_id: productId },
      });
      return deletedProduct;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the product: ${error.message}`
      );
    }
  }
}

module.exports = new ProductService();
