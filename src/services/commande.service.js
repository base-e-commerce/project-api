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
    shippingAddressId = null,
    type = "standard",
    commandBoxes = []
  ) {
    const normalizedDetails = Array.isArray(details) ? details : [];
    const normalizedCommandBoxes = Array.isArray(commandBoxes)
      ? commandBoxes
      : [];

    const lineAmount = (line) => {
      const quantity = Number(line?.quantity ?? 0);
      const unitPrice = Number(line?.unit_price ?? 0);
      if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
        return 0;
      }
      return quantity * unitPrice;
    };

    const detailTotal = normalizedDetails.reduce(
      (total, detail) => total + lineAmount(detail),
      0
    );
    const boxTotal = normalizedCommandBoxes.reduce(
      (total, boxEntry) => total + lineAmount(boxEntry),
      0
    );

    const totalAmount = detailTotal + boxTotal;

    const commande = await prisma.$transaction(async (prisma) => {
      const newCommande = await prisma.commande.create({
        data: {
          customer_id: customerId,
          status: "Envoyer",
          order_date: new Date(),
          total_amount: totalAmount,
          shipping_address_id: shippingAddressId,
          type,
          details: {
            create: normalizedDetails.map((detail) => ({
              product_id: detail.product_id,
              quantity: detail.quantity,
              unit_price: detail.unit_price,
            })),
          },
        },
      });

      if (normalizedCommandBoxes.length > 0) {
        await prisma.commandBox.createMany({
          data: normalizedCommandBoxes.map((boxEntry) => ({
            commande_id: newCommande.commande_id,
            box_id: Number(boxEntry.box_id),
            quantity: Number(boxEntry.quantity),
            unit_price: Number(boxEntry.unit_price),
          })),
        });
      }

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
        payments: true,
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

  async requestRefund(commandeId, customerId) {
    const commande = await prisma.commande.findUnique({
      where: { commande_id: commandeId },
      include: {
        payments: true,
      },
    });

    if (!commande) {
      throw new Error("Commande introuvable");
    }

    if (commande.customer_id !== customerId) {
      throw new Error("Cette commande n'appartient pas au client courant");
    }

    const normalize = (value) =>
      (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const hasPaid =
      Array.isArray(commande.payments) &&
      commande.payments.some((payment) =>
        ["payed", "paid", "livre"].includes(normalize(payment.status))
      );

    if (!hasPaid) {
      throw new Error(
        "Le paiement doit Ǧtre effectuǸ avant de demander un remboursement"
      );
    }

    if (normalize(commande.status) === "demande remboursement") {
      return commande;
    }

    const updatedCommande = await prisma.commande.update({
      where: { commande_id: commandeId },
      data: {
        status: "Demande remboursement",
      },
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
        payments: true,
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
          payments: true,
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
          payments: true,
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

      const payment = await prisma.payment.updateMany({
        where: { commande_id: idCommande },
        data: {
          status: "Payed",
          transaction_date: new Date(),
        },
      })

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
          payments: true,
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
          payments: true,
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
        payments: true,
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
        payments: true,
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

  async getLastUnpaidCommandeIdByCustomer(customerId) {
    const lastUnpaidCommande = await prisma.commande.findFirst({
      where: {
        customer_id: customerId,
        OR: [
          {
            payments: {
              some: {
                status: "Pending",
              },
            },
          },
          {
            payments: {
              none: {},
            },
          },
        ],
      },
      orderBy: {
        order_date: "desc",
      },
      select: {
        commande_id: true,
        payment_method: true,
      },
    });

    return lastUnpaidCommande ?? null;
  }

  async getCommandeWithDetails(commandeId) {
    return prisma.commande.findUnique({
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
        customer: {
          include: {
            accounts: true,
          },
        },
        shipping_address_relation: true,
        payments: true,
      },
    });
  }
}

module.exports = new CommandeService();
