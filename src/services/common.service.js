const prisma = require("../database/database");

class CommonService {
  async getCountProducts() {
    try {
      const count = await prisma.product.count();
      return count;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the product count: ${error.message}`
      );
    }
  }

  async getCountCustomers() {
    try {
      const count = await prisma.customer.count();
      return count;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the customer count: ${error.message}`
      );
    }
  }

  async createNewsLetter(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newData = await prisma.newsLetter.create({
          data: {
            email: data.email,
          },
        });
        return newData;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the category info: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getAllContactInfo(page, limit) {
    try {
      const contactInfo = await prisma.contactInfo.findMany({
        include: { customer: true },
        skip: (page - 1) * limit,
        take: limit,
      });

      const totalContactInfo = await prisma.contactInfo.count();

      const totalPages = Math.ceil(totalContactInfo / limit);

      return {
        contactInfo,
        pagination: {
          page: Number(page),
          totalPages,
          totalContactInfo,
          limit: Number(limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the contact info: ${error.message}`
      );
    }
  }

  async createContactInfo(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newData = await prisma.contactInfo.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message,
          },
        });
        return newData;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the category info: ${error.message}`
        );
      }
    });

    return transaction;
  }
}

module.exports = new CommonService();
