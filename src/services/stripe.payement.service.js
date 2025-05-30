const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

class StripeService {
  async createCheckoutSession({ amount, currency = "eur" }) {
    if (!amount) throw new Error("Le montant est requis");

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

  async handleEvent(event) {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const paymentIntentId = session.payment_intent;
        console.log("Paiement réussi pour session:", session.id);
        console.log("🧾 ID de transaction :", paymentIntentId);

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
