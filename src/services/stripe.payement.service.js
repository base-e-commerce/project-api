const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const prisma = require("../database/database");
const realtimeNotificationService = require("./realtime-notification.service");

const parseMetadataId = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

class StripeService {
  async createCheckoutSession({
    amount,
    currency = "eur",
    commande_id,
    command_box_id,
    itemName,
    metadata = {},
  }) {
    if (!amount) {
      throw new Error("Le montant est requis pour générer un paiement");
    }

    const metadataPayload = {
      ...metadata,
      ...(commande_id ? { commande_id: String(commande_id) } : {}),
      ...(command_box_id ? { command_box_id: String(command_box_id) } : {}),
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: itemName || "Paiement personnalisé",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: metadataPayload,
      success_url: `${process.env.STRIPE_REDIRECTION_URL_SUCCESS}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_REDIRECTION_URL_FAILED,
    });

    return session;
  }

  verifySignature(rawBody, signature, endpointSecret) {
    try {
      return stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (error) {
      console.error("Erreur de signature :", error.message);
      throw new Error(`Webhook Error: ${error.message}`);
    }
  }

  // async handleEvent(event) {
  //   switch (event.type) {
  //     case "checkout.session.completed":
  //       const session = event.data.object;
  //       const paymentIntentId = session.payment_intent;
  //       console.log("Paiement réussi pour session:", session.id);
  //       console.log("🧾 ID de transaction :", paymentIntentId);

  //       break;

  //     case "checkout.session.async_payment_failed":
  //     case "checkout.session.expired":
  //       console.log("Paiement échoué ou expiré");
  //       break;

  //     default:
  //       console.log(`Événement non géré : ${event.type}`);
  //   }
  // }
  async handleEvent(event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const paymentIntentId = session.payment_intent;
        const metadata = session.metadata || {};
        const parsedCommandeId = parseMetadataId(metadata.commande_id);
        const parsedCommandBoxId = parseMetadataId(metadata.command_box_id);
        const parsedDevisId = parseMetadataId(metadata.devis_id);

        try {
          let resolvedCommandeId = parsedCommandeId;
          let paymentUpdatedCount = 0;

          if (!resolvedCommandeId && parsedCommandBoxId) {
            const commandBox = await prisma.commandBox.findUnique({
              where: { command_box_id: parsedCommandBoxId },
              select: { commande_id: true },
            });

            if (commandBox?.commande_id) {
              resolvedCommandeId = commandBox.commande_id;
            }
          }

          if (resolvedCommandeId) {
            const paymentUpdateResult = await prisma.payment.updateMany({
              where: {
                commande_id: resolvedCommandeId,
                status: {
                  notIn: ["Payed", "paid", "PAID"],
                },
              },
              data: {
                status: "Payed",
                transaction_id: paymentIntentId,
                transaction_date: new Date(),
              },
            });
            paymentUpdatedCount = paymentUpdateResult.count || 0;
          }

          if (parsedCommandBoxId) {
            await prisma.commandBox.update({
              where: { command_box_id: parsedCommandBoxId },
              data: { status: "paid" },
            });
          }

          if (parsedDevisId) {
            await prisma.devis.update({
              where: { id: parsedDevisId },
              data: { status: "paid" },
            });
          }

          if (resolvedCommandeId && paymentUpdatedCount > 0) {
            const commande = await prisma.commande.findUnique({
              where: { commande_id: resolvedCommandeId },
              select: {
                commande_id: true,
                total_amount: true,
                payment_method: true,
                customer: {
                  select: {
                    customer_id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                  },
                },
              },
            });

            try {
              await realtimeNotificationService.notifyAdmins({
                type: "payment_validated",
                title: "Paiement client valide",
                message: `Paiement confirme pour la commande #${resolvedCommandeId}`,
                route: "/dashboard/finance/payments",
                entityType: "payment",
                entityId: resolvedCommandeId,
                customer: {
                  id: commande?.customer?.customer_id || null,
                  firstName: commande?.customer?.first_name || null,
                  lastName: commande?.customer?.last_name || null,
                  email: commande?.customer?.email || null,
                },
                meta: {
                  commandeId: resolvedCommandeId,
                  paymentIntentId,
                  amount: commande?.total_amount ?? null,
                  paymentMethod: commande?.payment_method ?? "card",
                  source: parsedDevisId
                    ? "devis"
                    : parsedCommandBoxId
                      ? "command_box"
                      : "commande",
                },
              });
            } catch (notificationError) {
              console.error(
                "[Realtime] Failed to persist/broadcast payment notification:",
                notificationError.message
              );
            }
          }
        } catch (err) {
          console.error(
            "Erreur lors de la mise à jour du paiement :",
            err.message
          );
        }

        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        console.log("Paiement échoué ou expiré");
        break;

      default:
        console.log(`Événement non géré : ${event.type}`);
    }
  }
}

module.exports = new StripeService();
