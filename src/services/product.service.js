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
            price: parseFloat(data.price),
            stock_quantity: data.stock_quantity,
            image_url: data.image_url,
            category_id: data.category_id,
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

  async getAllProducts(limit, offset) {
    try {
      const products = await prisma.product.findMany({
        include: { productImages: true, category: true },
        skip: offset,
        take: limit,
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
        include: { productImages: true, category: true },
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
