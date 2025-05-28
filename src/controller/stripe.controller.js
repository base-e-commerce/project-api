const stripeService = require('../services/stripe.payement.service');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


exports.handlePayment = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const session = await stripeService.createCheckoutSession({ amount, currency });
    res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Erreur paiement:', error.message);
    res.status(500).json({ error: error.message });
  }
};
exports.webhookHandler = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    const event = stripeService.verifySignature(req.body, signature, endpointSecret);
    await stripeService.handleEvent(event);
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

exports.getSessionInfo = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json({ paymentIntentId: session.payment_intent });
  } catch (err) {
    console.error('Erreur Stripe session:', err.message);
    res.status(500).json({ error: err.message });
  }
};