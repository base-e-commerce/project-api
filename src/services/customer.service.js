const prisma = require("../database/database");
const bcrypt = require("bcrypt");

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
        include: { accounts: true },
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

  async updateCustomerPassword(customerId, { currentPassword, newPassword }) {
    const customer = await prisma.customer.findUnique({
      where: { customer_id: customerId },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (customer.password_hash) {
      if (!currentPassword) {
        const err = new Error("Current password is required");
        err.code = "CURRENT_PASSWORD_REQUIRED";
        throw err;
      }

      const isValid = await bcrypt.compare(
        currentPassword,
        customer.password_hash
      );
      if (!isValid) {
        const err = new Error("Current password is invalid");
        err.code = "INVALID_CURRENT_PASSWORD";
        throw err;
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedCustomer = await prisma.customer.update({
      where: { customer_id: customerId },
      data: {
        password_hash: hashedPassword,
        oauth_provider: customer.oauth_provider,
        oauth_id: customer.oauth_id,
      },
    });

    return {
      customer: updatedCustomer,
      action: customer.password_hash ? "updated" : "created",
    };
  }

  async requestAccountDeletion(customerId) {
    const customer = await prisma.customer.findUnique({
      where: { customer_id: customerId },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (customer.deleted_at) {
      return {
        deleted_at: customer.deleted_at,
        delete_scheduled_for: customer.delete_scheduled_for,
        alreadyRequested: true,
      };
    }

    const now = new Date();
    const scheduled = new Date(now.getTime() + 360 * 24 * 60 * 60 * 1000);

    const updated = await prisma.customer.update({
      where: { customer_id: customerId },
      data: {
        deleted_at: now,
        delete_scheduled_for: scheduled,
        is_active: false,
      },
    });

    return {
      deleted_at: updated.deleted_at,
      delete_scheduled_for: updated.delete_scheduled_for,
      alreadyRequested: false,
    };
  }

  async cancelAccountDeletion(customerId) {
    const customer = await prisma.customer.findUnique({
      where: { customer_id: customerId },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (!customer.deleted_at) {
      return {
        deleted_at: null,
        delete_scheduled_for: null,
        alreadyActive: true,
      };
    }

    const updated = await prisma.customer.update({
      where: { customer_id: customerId },
      data: {
        deleted_at: null,
        delete_scheduled_for: null,
        is_active: true,
      },
    });

    return {
      deleted_at: updated.deleted_at,
      delete_scheduled_for: updated.delete_scheduled_for,
      alreadyActive: false,
    };
  }
}

module.exports = new CustomerService();
