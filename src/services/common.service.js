const prisma = require("../database/database");

class CommonService {
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
