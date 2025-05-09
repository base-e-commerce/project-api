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

  async createCommande(customerId, details, paymentDetails = null) {
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
            status: "Completed",
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
      include: { details: true },
    });
    return commandes;
  }

  async resendCommande(commandeId) {
    const commande = await prisma.commande.findUnique({
      where: { commande_id: commandeId },
    });

    if (commande.status === "Annulé") {
      const resendCommande = await prisma.commande.create({
        data: {
          customer_id: commande.customer_id,
          status: "Envoyer",
          order_date: new Date(),
          total_amount: commande.total_amount,
          details: {
            create: commande.details.map((detail) => ({
              product_id: detail.product_id,
              quantity: detail.quantity,
              unit_price: detail.unit_price,
            })),
          },
        },
      });
      return resendCommande;
    } else {
      throw new Error(
        "La commande n'est pas annulée et ne peut pas être renvoyée."
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
          customer: true,
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
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

  async receiveCommande(commandeId, adminId) {
    const commande = await prisma.commande.update({
      where: { commande_id: commandeId },
      data: {
        status: "Confirmé",
        admin_id: adminId,
      },
    });
    return commande;
  }

  async cancelCommande(commandeId, adminId) {
    const commande = await prisma.commande.update({
      where: { commande_id: commandeId },
      data: {
        status: "Annulé",
        admin_id: adminId,
      },
    });
    return commande;
  }
}

module.exports = new CommandeService();
