const prisma = require("../database/database");

class CustomerAccountService {
  async createCustomerAccount(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newCustomerAccount = await prisma.customerAccount.create({
          data: {
            customer_id: data.customer_id,
            type: data.type,
            activate_pro: data.activate_pro,
            disabled_pro: data.disabled_pro,
          },
        });
        return newCustomerAccount;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the customer account: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getAllCustomerAccounts() {
    try {
      const customerAccounts = await prisma.customerAccount.findMany();
      return customerAccounts;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving customer accounts: ${error.message}`
      );
    }
  }

  async getCustomerAccountById(customerAccountId) {
    try {
      const customerAccount = await prisma.customerAccount.findUnique({
        where: { customer_account_id: customerAccountId },
      });
      return customerAccount;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the customer account: ${error.message}`
      );
    }
  }

  async updateCustomerAccount(customerAccountId, data) {
    try {
      const updatedCustomerAccount = await prisma.customerAccount.update({
        where: { customer_account_id: customerAccountId },
        data: {
          customer_id: data.customer_id,
          type: data.type,
          activate_pro: data.activate_pro,
          disabled_pro: data.disabled_pro,
        },
      });
      return updatedCustomerAccount;
    } catch (error) {
      throw new Error(
        `Error occurred while updating the customer account: ${error.message}`
      );
    }
  }

  async deleteCustomerAccount(customerAccountId) {
    try {
      const deletedCustomerAccount = await prisma.customerAccount.delete({
        where: { customer_account_id: customerAccountId },
      });
      return deletedCustomerAccount;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the customer account: ${error.message}`
      );
    }
  }
}

module.exports = new CustomerAccountService();
