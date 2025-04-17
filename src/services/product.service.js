const prisma = require("../database/database");

class ProductService {
  async createProduct(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newProduct = await prisma.product.create({
          data: {
            name: data.name,
            description: data.description,
            descriptionRich: data.descriptionRich,
            currency: data.currency,
            currency_name: data.currency_name,
            price: parseFloat(data.price),
            stock_quantity: data.stock_quantity,
            image_url: data.image_url,
            category_id: data.category_id,
            service_id: data.service_id,
            is_active: data.is_active,
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
  async getSearchProductsWithCategorySelected(idCategory,key) {
    try {
      const baseSearch = {
        OR: [
          { name: { contains: key, mode: 'insensitive' } },
          { description: { contains: key, mode: 'insensitive' } },
        ],
      };
  
      const whereClause =
        idCategory === 0
          ? baseSearch
          : {
              AND: [
                { category_id: idCategory },
                baseSearch,
              ],
            };
  
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
        include: { productImages: true, category: true, service: true },
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
      });

      const totalProducts = await prisma.product.count();

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
        where: { service_id: serviceId },
        include: { productImages: true, category: true, service: true },
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
        },
        include: { productImages: true, category: true, service: true },
        orderBy: { created_at: "desc" },
      });
      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving other products in service: ${error.message}`
      );
    }
  }

  async getAllCategoryProducts(category_id, limit, offset) {
    try {
      const products = await prisma.product.findMany({
        where: { category_id },
        include: { productImages: true, category: true, service: true },
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
      });

      const totalProducts = await prisma.product.count({
        where: { category_id },
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
  async getAllServiceProducts(service_id, limit, offset) {
    try {
      const products = await prisma.product.findMany({
        where: { service_id },
        include: { productImages: true, category: true, service: true },
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
      });

      const totalProducts = await prisma.product.count({
        where: { service_id },
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
  //       include: { productImages: true, category: true, service: true },
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
      const whereClause = idCategory === 0 ? {} : { category_id: idCategory };

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
        include: { productImages: true, category: true, service: true },
      });
      return product;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the product: ${error.message}`
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
