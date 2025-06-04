const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const prisma = require("../database/database");

class StripeService {
  async createCheckoutSession({ amount, currency = "eur", commande_id }) {
    if (!amount || !commande_id)
      throw new Error("Le montant et commande_id  requis");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: "Paiement personnalisé",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        commande_id: String(commande_id),
      },
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
      case "checkout.session.completed":
        const session = event.data.object;
        const paymentIntentId = session.payment_intent;
        const commande_id = parseInt(session.metadata.commande_id);

        console.log(" Paiement réussi pour la commande:", commande_id);
        console.log(" ID de transaction :", paymentIntentId);

        try {
          await prisma.payment.updateMany({
            where: { commande_id },
            data: {
              status: "payé",
              transaction_id: paymentIntentId,
              transaction_date: new Date(),
            },
          });

          console.log("Paiement mis à jour dans la base de données");
        } catch (err) {
          console.error(
            "Erreur lors de la mise à jour du paiement :",
            err.message
          );
        }

        break;

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
