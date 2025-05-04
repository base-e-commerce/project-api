const prisma = require("../database/database");

class CommandeService {
  async createCommande(customerId, details) {
    const commande = await prisma.commande.create({
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

  async getAllCommandes(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const commandes = await prisma.commande.findMany({
      skip,
      take: pageSize,
      include: { details: true, admin: true },
    });
    return commandes;
  }

  async receiveCommande(commandeId, adminId) {
    const commande = await prisma.commande.update({
      where: { commande_id: commandeId },
      data: {
        status: "Reçu",
        admin_id: adminId,
      },
    });
    return commande;
  }

  async cancelCommande(commandeId) {
    const commande = await prisma.commande.update({
      where: { commande_id: commandeId },
      data: {
        status: "Annulé",
      },
    });
    return commande;
  }
}

module.exports = new CommandeService();
