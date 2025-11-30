const createResponse = require("../utils/api.response");
const commandeService = require("../services/commande.service");
const customerService = require("../services/customer.service");
const productService = require("../services/product.service");
const brevoService = require("../services/brevo.service");
const invoiceService = require("../services/invoice.service");

const PRO_ACCOUNT_TYPE_ALIASES = new Set([
  "pro",
  "professionnel",
  "professionel",
  "professional",
]);

const isProCustomerAccount = (customer) => {
  const accounts = customer?.accounts || [];
  return accounts.some((account) => {
    const type = account?.type;
    if (!type) return false;
    const normalized = type.toString().trim().toLowerCase();
    return PRO_ACCOUNT_TYPE_ALIASES.has(normalized);
  });
};

const formatCommandeReference = (commande) => {
  if (!commande || !commande.commande_id) {
    return "";
  }

  const orderYear = new Date(
    commande.order_date || Date.now()
  ).getFullYear();

  const paddedId = String(commande.commande_id).padStart(3, "0");
  return `GDV-${orderYear}-${paddedId}`;
};

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
    const {
      customerId,
      details,
      paymentDetails,
      shippingAddressId,
      type,
    } = req.body;
    const normalizedType =
      typeof type === "string" ? type.trim().toLowerCase() : "";
    const commandeType = normalizedType === "pro" ? "pro" : "standard";
    const orderDetails = Array.isArray(details) ? details : [];

    const parsedCustomerId =
      customerId !== undefined && customerId !== null
        ? Number(customerId)
        : null;

    if (parsedCustomerId !== null && Number.isNaN(parsedCustomerId)) {
      return res
        .status(400)
        .json(createResponse("Customer ID must be a valid number", null, false));
    }

    const authenticatedCustomerId = req.customer?.customer_id;
    if (
      authenticatedCustomerId &&
      parsedCustomerId !== null &&
      authenticatedCustomerId !== parsedCustomerId
    ) {
      return res
        .status(403)
        .json(
          createResponse(
            "Customer ID does not match authenticated user",
            null,
            false
          )
        );
    }

    const targetCustomerId = authenticatedCustomerId ?? parsedCustomerId;
    if (!targetCustomerId) {
      return res
        .status(400)
        .json(createResponse("Customer ID is required", null, false));
    }

    const customerRecord = await customerService.getCustomerById(
      targetCustomerId
    );
    if (!customerRecord) {
      return res
        .status(404)
        .json(createResponse("Customer not found", null, false));
    }

    const isProAccount = isProCustomerAccount(customerRecord);

    const productIds = orderDetails.map((detail) => detail.product_id);
    const retrievedProducts = await productService.getProductsByIds(productIds);
    const productMap = new Map(
      retrievedProducts.map((product) => [product.product_id, product])
    );

    const missingProductIds = Array.from(
      new Set(
        productIds.filter((productId) => !productMap.has(productId))
      )
    );
    if (missingProductIds.length > 0) {
      return res
        .status(400)
        .json(
          createResponse(
            "Some products are not available",
            { missingProductIds },
            false
          )
        );
    }

    const quantityErrors = [];
    orderDetails.forEach((detail) => {
      const product = productMap.get(detail.product_id);
      if (!product) {
        return;
      }

      const rawMin = isProAccount
        ? product.min_co_pro
        : product.min_co_standard;
      const minValue =
        typeof rawMin === "number" && Number.isFinite(rawMin)
          ? rawMin
          : null;

      if (minValue && detail.quantity < minValue) {
        quantityErrors.push(
          `Minimum quantity for "${product.name}" is ${minValue} for ${
            isProAccount ? "professional" : "standard"
          } accounts`
        );
      }
    });

    if (quantityErrors.length > 0) {
      return res
        .status(400)
        .json(
          createResponse(
            "Minimum quantity requirements not met",
            { errors: quantityErrors },
            false
          )
        );
    }

    const { commande, payment } = await commandeService.createCommande(
      targetCustomerId,
      orderDetails,
      paymentDetails,
      shippingAddressId,
      commandeType
    );

    const customerForEmail = req.customer || {};
    if (customerForEmail.email) {
      const fallbackReference =
        commande && commande.commande_id
          ? `GDV-${String(commande.commande_id).padStart(3, "0")}`
          : "";
      const orderReference =
        formatCommandeReference(commande) || fallbackReference;

      if (orderReference) {
        try {
          await brevoService.sendCommandeCreatedEmail({
            email: customerForEmail.email,
            firstName: customerForEmail.first_name,
            orderId: orderReference,
          });
        } catch (brevoError) {
          console.error(
            "[Brevo] Failed to send commande confirmation email:",
            brevoError.message
          );
        }
      }
    }

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

exports.requestRefund = async (req, res) => {
  try {
    const customer = req.customer;
    if (!customer || !customer.customer_id) {
      return res
        .status(401)
        .json(createResponse("Client non authentifiǸ", null, true));
    }

    const { commandeId } = req.params;
    const commande = await commandeService.requestRefund(
      parseInt(commandeId),
      parseInt(customer.customer_id)
    );
    res.status(200).json(
      createResponse(
        "Demande de remboursement enregistrǸe avec succ��s",
        commande
      )
    );
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

exports.confirmDelivery = async (req, res) => {
  const idCommande = req.params.idCommande;
  const adminId = req.user.userId;

  try {
    const commande = await commandeService.confirmDelivery(
      parseInt(idCommande),
      parseInt(adminId)
    );
    res
      .status(200)
      .json(createResponse("Commande confirmée avec succès", commande));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getAllCommandesConfirmed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { commandes, totalCommandes } =
      await commandeService.getAllCommandesConfirmed(limit, offset);

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

exports.getAllCommandesLivred = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { commandes, totalCommandes } =
      await commandeService.getAllCommandesLivred(limit, offset);

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
    const { dateDelivery } = req.body;
    const adminId = req.user.userId;
    if (!adminId) {
      return res
        .status(400)
        .json(createResponse("L'ID de l'administrateur est requis"));
    }
    const commande = await commandeService.receiveCommande(
      parseInt(commandeId),
      parseInt(adminId),
      dateDelivery
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
    const adminId = req.user.userId;
    if (!adminId) {
      return res
        .status(400)
        .json(createResponse("L'ID de l'administrateur est requis"));
    }
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

exports.getLastUnpaidCommande = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId || isNaN(parseInt(customerId))) {
      return res
        .status(400)
        .json(createResponse("L'ID du client est invalide ou manquant"));
    }

    const result = await commandeService.getLastUnpaidCommandeIdByCustomer(
      parseInt(customerId)
    );

    if (!result) {
      return res
        .status(404)
        .json(createResponse("Aucune commande non payée trouvée"));
    }

    res.status(200).json(createResponse("Commande non payée trouvée", result));
  } catch (error) {
    console.error("Erreur dans getLastUnpaidCommande:", error);
    res
      .status(500)
      .json(createResponse(null, error.message || "Erreur serveur", true));
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const { commandeId } = req.params;
    const { sendEmail = false } = req.body || {};
    const customerId = req.customer?.customer_id;

    if (!customerId) {
      return res
        .status(401)
        .json(createResponse("Client non authentifié", null, true));
    }

    if (!commandeId) {
      return res
        .status(400)
        .json(createResponse("Identifiant commande manquant"));
    }

    const invoice = await invoiceService.generateInvoice({
      commandeId: parseInt(commandeId, 10),
      customerId: parseInt(customerId, 10),
      sendEmail: Boolean(sendEmail),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${invoice.fileName}\"`
    );
    return res.send(invoice.buffer);
  } catch (error) {
    return res.status(400).json(createResponse(null, error.message, true));
  }
};
