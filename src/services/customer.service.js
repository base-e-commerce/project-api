const prisma = require("../database/database");

class CustomerService {
  async createCustomer(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newCustomer = await prisma.customer.create({
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            password_hash: data.password_hash,
            oauth_provider: data.oauth_provider,
            oauth_id: data.oauth_id,
            phone: data.phone,
            default_address_id: data.default_address_id,
          },
        });
        return newCustomer;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the customer: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getAllCustomers() {
    try {
      const customers = await prisma.customer.findMany();
      return customers;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving customers: ${error.message}`
      );
    }
  }

  async getCustomerById(customerId) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { customer_id: customerId },
      });
      return customer;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the customer: ${error.message}`
      );
    }
  }

  async updateCustomer(customerId, data) {
    try {
      const updatedCustomer = await prisma.customer.update({
        where: { customer_id: customerId },
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          password_hash: data.password_hash,
          oauth_provider: data.oauth_provider,
          oauth_id: data.oauth_id,
          phone: data.phone,
          default_address_id: data.default_address_id,
        },
      });
      return updatedCustomer;
    } catch (error) {
      throw new Error(
        `Error occurred while updating the customer: ${error.message}`
      );
    }
  }

  async deleteCustomer(customerId) {
    try {
      const deletedCustomer = await prisma.customer.delete({
        where: { customer_id: customerId },
      });
      return deletedCustomer;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the customer: ${error.message}`
      );
    }
  }
}

module.exports = new CustomerService();
