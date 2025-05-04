const createResponse = require("../utils/api.response");
const commandeService = require("../services/commande.service");

exports.createCommande = async (req, res) => {
  try {
    const { customerId, details } = req.body;
    const commande = await commandeService.createCommande(customerId, details);
    res
      .status(201)
      .json(createResponse(commande, "Commande créée avec succès"));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getCommandesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const commandes = await commandeService.getCommandesByCustomer(
      parseInt(customerId)
    );
    res
      .status(200)
      .json(createResponse(commandes, "Commandes récupérées avec succès"));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.resendCommande = async (req, res) => {
  try {
    const { commandeId } = req.params;
    const commande = await commandeService.resendCommande(parseInt(commandeId));
    res
      .status(200)
      .json(createResponse(commande, "Commande renvoyée avec succès"));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getAllCommandes = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const commandes = await commandeService.getAllCommandes(
      parseInt(page),
      parseInt(pageSize)
    );
    res
      .status(200)
      .json(createResponse(commandes, "Commandes récupérées avec succès"));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.receiveCommande = async (req, res) => {
  try {
    const { commandeId } = req.params;
    const { adminId } = req.body;
    const commande = await commandeService.receiveCommande(
      parseInt(commandeId),
      parseInt(adminId)
    );
    res
      .status(200)
      .json(createResponse(commande, "Commande reçue avec succès"));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.cancelCommande = async (req, res) => {
  try {
    const { commandeId } = req.params;
    const commande = await commandeService.cancelCommande(parseInt(commandeId));
    res
      .status(200)
      .json(createResponse(commande, "Commande annulée avec succès"));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};
