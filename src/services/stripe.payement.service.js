const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const prisma = require("../database/database");

class StripeService {
  async createCheckoutSession({
    amount,
    currency = "eur",
    commande_id,
    command_box_id,
    itemName,
  }) {
    const hasReference = commande_id || command_box_id;
    if (!amount || !hasReference) {
      throw new Error("Le montant et une référence de commande sont requis");
    }

    const metadata = {};
    if (commande_id) metadata.commande_id = String(commande_id);
    if (command_box_id) metadata.command_box_id = String(command_box_id);

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
      metadata,
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
        const parsedCommandeId = Number.isFinite(
          Number(session.metadata?.commande_id)
        )
          ? Number(session.metadata.commande_id)
          : null;
        const parsedCommandBoxId = Number.isFinite(
          Number(session.metadata?.command_box_id)
        )
          ? Number(session.metadata.command_box_id)
          : null;

        try {
          if (parsedCommandeId) {
            await prisma.payment.updateMany({
              where: { commande_id: parsedCommandeId },
              data: {
                status: "Payed",
                transaction_id: paymentIntentId,
                transaction_date: new Date(),
              },
            });
          }

          if (parsedCommandBoxId) {
            await prisma.commandBox.update({
              where: { command_box_id: parsedCommandBoxId },
              data: { status: "paid" },
            });
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
