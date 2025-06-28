const prisma = require("../database/database");

class CustomerService {
  async createCustomer(data) {
    try {
      const existingCustomer = await prisma.customer.findUnique({
        where: {
          email: data.email,
        },
      });

      if (existingCustomer) {
        return {
          status: false,
          message: "Utilisateur déjà existant",
          data: existingCustomer,
        };
      }

      const result = await prisma.$transaction(async (prisma) => {
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

        const newAccount = await prisma.customerAccount.create({
          data: {
            customer_id: newCustomer.customer_id,
            type: "standard"
          },
        });

        return { newCustomer, newAccount };
      });

      return {
        status: true,
        message: "Utilisateur et compte créés avec succès",
        data: result.newCustomer,
      };
    } catch (error) {
      return {
        status: false,
        message: `Erreur lors de la création du client : ${error.message}`,
        data: null,
      };
    }
  }

  async getAllCustomers(page, limit) {
    try {
      const totalCustomers = await prisma.customer.count();
      const customers = await prisma.customer.findMany({
        include: { accounts: true, addresses: true, reviews: true },
        skip: (page - 1) * limit,
        take: limit,
      });

      const totalPages = Math.ceil(totalCustomers / limit);

      return {
        customers,
        pagination: {
          page: Number(page),
          totalPages,
          totalUsers: totalCustomers,
          limit: Number(limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving customers: ${error.message}`
      );
    }
  }

  async getLastTenCustomers() {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: { created_at: "desc" },
        include: { accounts: true, addresses: true, reviews: true },
        take: 10,
      });
      return customers;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the last ten customers: ${error.message}`
      );
    }
  }

  async searchCustomers(searchTerm) {
    try {
      const customers = await prisma.customer.findMany({
        where: {
          OR: [
            { first_name: { contains: searchTerm.toLowerCase() } },
            { last_name: { contains: searchTerm.toLowerCase() } },
            { email: { contains: searchTerm.toLowerCase() } },
          ],
        },
        include: { accounts: true, addresses: true, reviews: true },
      });
      return customers;
    } catch (error) {
      throw new Error(
        `Error occurred while searching for customers: ${error.message}`
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

  // async updateCustomer(customerId, data) {
  //   try {
  //     const updatedCustomer = await prisma.customer.update({
  //       where: { customer_id: customerId },
  //       data: {
  //         first_name: data.first_name,
  //         last_name: data.last_name,
  //         email: data.email,
  //         password_hash: data.password_hash,
  //         oauth_provider: data.oauth_provider,
  //         oauth_id: data.oauth_id,
  //         phone: data.phone,
  //         default_address_id: data.default_address_id,
  //       },
  //     });
  //     return updatedCustomer;
  //   } catch (error) {
  //     throw new Error(
  //       `Error occurred while updating the customer: ${error.message}`
  //     );
  //   }
  // }

  async updateCustomer(customerId, data) {
    try {
      // Update the customer's basic information
      const updatedCustomer = await prisma.customer.update({
        where: { customer_id: customerId },
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
        },
      });

      // Find the existing customer account
      const existingAccount = await prisma.customerAccount.findFirst({
        where: { customer_id: customerId },
      });

      // Use the correct unique identifier for the upsert operation
      const updatedCustomerAccount = await prisma.customerAccount.upsert({
        where: {
          customer_account_id: existingAccount
            ? existingAccount.customer_account_id
            : -1,
        }, // Use a non-existent ID if no account exists
        create: {
          customer_id: customerId,
          type: data.accountType,
          ...(data.accountType === "professionel" && {
            entrepriseName: data.professionalDetails.entrepriseName,
            adresseEntreprise: data.professionalDetails.adresseEntreprise,
            phoneEntreprise: data.professionalDetails.phoneEntreprise,
            emailEntreprise: data.professionalDetails.emailEntreprise,
          }),
        },
        update: {
          type: data.accountType,
          ...(data.accountType === "professionel" && {
            entrepriseName: data.professionalDetails.entrepriseName,
            adresseEntreprise: data.professionalDetails.adresseEntreprise,
            phoneEntreprise: data.professionalDetails.phoneEntreprise,
            emailEntreprise: data.professionalDetails.emailEntreprise,
          }),
        },
      });

      return { updatedCustomer, updatedCustomerAccount };
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
