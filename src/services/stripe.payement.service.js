const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  async createCheckoutSession({ amount, currency = 'eur' }) {
  if (!amount) throw new Error("Le montant est requis");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency,
          product_data: {
            name: 'Paiement personnalisé',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.STRIPE_REDIRECTION_URL_SUCCESS}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:process.env.STRIPE_REDIRECTION_URL_FAILED,
  });

  return session;
}

 
}

module.exports = new StripeService();
