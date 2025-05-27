const stripeService = require('../services/stripe.payement.service');

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
