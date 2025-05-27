const prisma = require("../database/database");

class CommandeService {
  //   async createCommande(customerId, details) {
  //     const commande = await prisma.commande.create({
  //       data: {
  //         customer_id: customerId,
  //         status: "Envoyer",
  //         order_date: new Date(),
  //         total_amount: details.reduce(
  //           (total, detail) => total + detail.quantity * detail.unit_price,
  //           0
  //         ),
  //         details: {
  //           create: details.map((detail) => ({
  //             product_id: detail.product_id,
  //             quantity: detail.quantity,
  //             unit_price: detail.unit_price,
  //           })),
  //         },
  //       },
  //     });
  //     return commande;
  //   }

  async createCommande(
    customerId,
    details,
    paymentDetails = null,
    shippingAddressId = null
  ) {
    const commande = await prisma.$transaction(async (prisma) => {
      const newCommande = await prisma.commande.create({
        data: {
          customer_id: customerId,
          status: "Envoyer",
          order_date: new Date(),
          total_amount: details.reduce(
            (total, detail) => total + detail.quantity * detail.unit_price,
            0
          ),
          shipping_address_id: shippingAddressId,
          details: {
            create: details.map((detail) => ({
              product_id: detail.product_id,
              quantity: detail.quantity,
              unit_price: detail.unit_price,
            })),
          },
        },
      });

      let payment = null;
      if (paymentDetails) {
        payment = await prisma.payment.create({
          data: {
            commande_id: newCommande.commande_id,
            amount: newCommande.total_amount,
            payment_method: paymentDetails.payment_method,
            status: "Pending",
            transaction_date: new Date(),
          },
        });
      }

      return { commande: newCommande, payment: payment };
    });

    return commande;
  }

  async getCommandesByCustomer(customerId) {
    const commandes = await prisma.commande.findMany({
      where: { customer_id: customerId },
      include: {
        details: {
          include: {
            product: {
              include: {
                productImages: true,
                category: true,
                service: true,
              },
            },
          },
        },
        shipping_address_relation: true,
        customer: {
          include: {
            accounts: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return commandes;
  }

  async checkCommandeByCustomer(customerId) {
    const commandes = await prisma.commande.findMany({
      where: { customer_id: customerId },
    });
    return commandes;
  }

  async resendCommande(commandeId) {
    const commande = await prisma.commande.findUnique({
      where: { commande_id: commandeId },
    });

    if (commande.status === "Annulé") {
      const updatedCommande = await prisma.commande.update({
        where: { commande_id: commandeId },
        include: {
          details: {
            include: {
              product: {
                include: {
                  productImages: true,
                  category: true,
                  service: true,
                },
              },
            },
          },
        },
        data: {
          status: "Envoyer",
        },
      });
      return updatedCommande;
    } else {
      throw new Error(
        "La commande n'est pas annulée et ne peut pas être renvoyée."
      );
    }
  }
  async cancelThisCommande(commandeId) {
    const commande = await prisma.commande.findUnique({
      where: { commande_id: commandeId },
    });

    const updatedCommande = await prisma.commande.update({
      where: { commande_id: commandeId },
      include: {
        details: {
          include: {
            product: {
              include: {
                productImages: true,
                category: true,
                service: true,
              },
            },
          },
        },
      },
      data: {
        status: "Annulé",
      },
    });
    return updatedCommande;
  }

  async getAllCommandesLivred(limit, offset) {
    try {
      const commandes = await prisma.commande.findMany({
        include: {
          details: {
            include: {
              product: {
                include: {
                  productImages: true,
                  category: true,
                  service: true,
                },
              },
            },
          },
          admin: true,
          customer: {
            include: {
              accounts: true,
            },
          },
          shipping_address_relation: true,
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
        where: { status: "Livré" },
      });

      const totalCommandes = await prisma.commande.count({
        where: { status: "Livré" },
      });

      return {
        commandes,
        totalCommandes,
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving commandes: ${error.message}`
      );
    }
  }

  async getAllCommandesConfirmed(limit, offset) {
    try {
      const commandes = await prisma.commande.findMany({
        include: {
          details: {
            include: {
              product: {
                include: {
                  productImages: true,
                  category: true,
                  service: true,
                },
              },
            },
          },
          admin: true,
          customer: {
            include: {
              accounts: true,
            },
          },
          shipping_address_relation: true,
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
        where: { status: "Confirmé" },
      });

      const totalCommandes = await prisma.commande.count({
        where: { status: "Confirmé" },
      });

      return {
        commandes,
        totalCommandes,
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving commandes: ${error.message}`
      );
    }
  }

  async confirmDelivery(idCommande, idAdmin) {
    try {
      const commande = await prisma.commande.update({
        where: { commande_id: idCommande },
        data: {
          status: "Livré",
          admin_id: idAdmin,
        },
      });
      return commande;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving commandes: ${error.message}`
      );
    }
  }

  async getAllCommandes(limit, offset) {
    try {
      const commandes = await prisma.commande.findMany({
        include: {
          details: {
            include: {
              product: {
                include: {
                  productImages: true,
                  category: true,
                  service: true,
                },
              },
            },
          },
          admin: true,
          customer: {
            include: {
              accounts: true,
            },
          },
          shipping_address_relation: true,
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
        where: {
          status: {
            not: "Livré",
          },
        },
      });

      const totalCommandes = await prisma.commande.count();

      return {
        commandes,
        totalCommandes,
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving commandes: ${error.message}`
      );
    }
  }

  async getAllCommandeByState(status, limit, offset) {
    try {
      const commandes = await prisma.commande.findMany({
        include: {
          details: {
            include: {
              product: {
                include: {
                  productImages: true,
                  category: true,
                  service: true,
                },
              },
            },
          },
          admin: true,
          customer: {
            include: {
              accounts: true,
            },
          },
          shipping_address_relation: true,
        },
        where: { status },
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
      });

      const totalCommandes = await prisma.commande.count({
        where: { status },
      });

      return {
        commandes,
        totalCommandes,
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving commandes: ${error.message}`
      );
    }
  }

  async searchCommandes(searchTerm) {
    const commandes = await prisma.commande.findMany({
      where: {
        customer: {
          is: {
            OR: [
              { first_name: { contains: searchTerm } },
              { last_name: { contains: searchTerm } },
              { email: { contains: searchTerm } },
            ],
          },
        },
      },
      include: {
        details: true,
        customer: {
          include: {
            accounts: true,
          },
        },
        admin: true,
        shipping_address_relation: true,
      },
    });
    return commandes;
  }

  async getLastTenCommandes() {
    const commandes = await prisma.commande.findMany({
      include: {
        details: {
          include: {
            product: {
              include: {
                productImages: true,
                category: true,
                service: true,
              },
            },
          },
        },
        admin: true,
        customer: {
          include: {
            accounts: true,
          },
        },
        shipping_address_relation: true,
      },
      where: {
        status: "Envoyer",
      },
      orderBy: { created_at: "desc" },
      take: 10,
    });
    return commandes;
  }

  async receiveCommande(commandeId, adminId, dateDelivery) {
    const commande = await prisma.commande.update({
      where: { commande_id: commandeId },
      data: {
        status: "Confirmé",
        delivery_date: dateDelivery,
        admin: {
          connect: { user_id: parseInt(adminId) },
        },
      },
    });
    return commande;
  }

  async cancelCommande(commandeId, adminId) {
    const commande = await prisma.commande.update({
      where: { commande_id: commandeId },
      data: {
        status: "Annulé",
        admin: {
          connect: { user_id: parseInt(adminId) },
        },
      },
    });
    return commande;
  }
}

module.exports = new CommandeService();
