const prisma = require("../database/database");

class CategoryService {
  async createCategory(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newCategory = await prisma.categorie.create({
          data: {
            name: data.name,
            description: data.description,
            secure: data.secure,
            service_id: data.service_id,
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
      const categories = await prisma.categorie.findMany();
      return categories;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving categories: ${error.message}`
      );
    }
  }

  async getAllCategoriesByService(service_id) {
    try {
      const categories = await prisma.categorie.findMany({
        where: { service_id },
      });
      return categories;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving categories by service: ${error.message}`
      );
    }
  }

  async getCategoryById(categoryId) {
    try {
      const category = await prisma.categorie.findUnique({
        where: { categorie_id: categoryId },
      });
      return category;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the category: ${error.message}`
      );
    }
  }

  async updateCategory(categoryId, data) {
    try {
      const updatedCategory = await prisma.categorie.update({
        where: { categorie_id: categoryId },
        data: {
          name: data.name,
          description: data.description,
          secure: data.secure,
          service_id: data.service_id,
        },
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
