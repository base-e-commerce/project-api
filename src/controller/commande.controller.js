const createResponse = require("../utils/api.response");
const commandeService = require("../services/commande.service");

// exports.createCommande = async (req, res) => {
//   try {
//     const { customerId, details } = req.body;
//     const commande = await commandeService.createCommande(customerId, details);
//     res
//       .status(201)
//       .json(createResponse(commande, "Commande créée avec succès"));
//   } catch (error) {
//     res.status(400).json(createResponse(null, error.message, true));
//   }
// };

exports.createCommande = async (req, res) => {
  try {
    const { customerId, details, paymentDetails, shippingAddressId } = req.body;
    const { commande, payment } = await commandeService.createCommande(
      customerId,
      details,
      paymentDetails,
      shippingAddressId
    );

    if (payment) {
      res
        .status(201)
        .json(
          createResponse(
            { commande, payment },
            "Commande et paiement créés avec succès"
          )
        );
    } else {
      res
        .status(201)
        .json(createResponse("Commande créée avec succès", commande));
    }
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
      .json(createResponse("Commandes récupérées avec succès", commandes));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.resendCommande = async (req, res) => {
  try {
    const customer = req.customer;
    const { commandeId } = req.params;
    const checkCommande = await commandeService.checkCommandeByCustomer(
      customer.customer_id
    );
    if (checkCommande.length === 0) {
      return res
        .status(404)
        .json(createResponse("Aucune commande trouvée pour ce client"));
    }
    const commande = await commandeService.resendCommande(parseInt(commandeId));
    res
      .status(200)
      .json(createResponse("Commande renvoyée avec succès", commande));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.cancelThisCommande = async (req, res) => {
  try {
    const customer = req.customer;
    const { commandeId } = req.params;
    const checkCommande = await commandeService.checkCommandeByCustomer(
      customer.customer_id
    );
    if (checkCommande.length === 0) {
      return res
        .status(404)
        .json(createResponse("Aucune commande trouvée pour ce client"));
    }
    const commande = await commandeService.cancelThisCommande(
      parseInt(commandeId)
    );
    res
      .status(200)
      .json(createResponse("Commande renvoyée avec succès", commande));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getAllCommandes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { commandes, totalCommandes } = await commandeService.getAllCommandes(
      limit,
      offset
    );

    const totalPages = Math.ceil(totalCommandes / limit);

    res.status(200).json(
      createResponse("Commands fetched successfully", {
        commandes,
        pagination: {
          page,
          limit,
          totalPages,
          totalCommand: totalCommandes,
        },
      })
    );
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getAllCommandeByState = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { commandes, totalCommandes } =
      await commandeService.getAllCommandeByState(
        req.params.status,
        limit,
        offset
      );

    const totalPages = Math.ceil(totalCommandes / limit);

    res.status(200).json(
      createResponse("Commands fetched successfully", {
        commandes,
        pagination: {
          page,
          limit,
          totalPages,
          totalCommand: totalCommandes,
        },
      })
    );
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.searchCommandes = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    const commandes = await commandeService.searchCommandes(searchTerm);
    res
      .status(200)
      .json(createResponse("Commandes trouvées avec succès", commandes));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getLastTenCommandes = async (req, res) => {
  try {
    const commandes = await commandeService.getLastTenCommandes();
    res
      .status(200)
      .json(
        createResponse("Dernières commandes récupérées avec succès", commandes)
      );
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.receiveCommande = async (req, res) => {
  try {
    const { commandeId } = req.params;
    const adminId = req.user.user_id;
    const commande = await commandeService.receiveCommande(
      parseInt(commandeId),
      parseInt(adminId)
    );
    res
      .status(200)
      .json(createResponse("Commande reçue avec succès", commande));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.cancelCommande = async (req, res) => {
  try {
    const { commandeId } = req.params;
    const adminId = req.user.user_id;
    const commande = await commandeService.cancelCommande(
      parseInt(commandeId),
      parseInt(adminId)
    );
    res
      .status(200)
      .json(createResponse("Commande annulée avec succès", commande));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};
