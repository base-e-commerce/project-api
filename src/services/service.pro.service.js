const prisma = require("../database/database");

class ServiceProService {
  async createService(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newService = await prisma.service.create({
          data: {
            name: data.name,
            secure: data.secure,
            description: data.description,
          },
        });
        return newService;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the service: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getAllServices() {
    try {
      const services = await prisma.service.findMany({
        include: { categories: true },
      });
      return services;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving services: ${error.message}`
      );
    }
  }

  async getServiceById(serviceId) {
    try {
      const service = await prisma.service.findUnique({
        where: { service_id: serviceId },
        include: { categories: true },
      });
      return service;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the service: ${error.message}`
      );
    }
  }

  async updateService(serviceId, data) {
    try {
      const updatedService = await prisma.service.update({
        where: { service_id: serviceId },
        data: {
          name: data.name,
          description: data.description,
        },
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
