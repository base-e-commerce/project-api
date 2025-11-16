/**
 * Calcule le prix unitaire selon la quantité commandée
 * @param {Object} tierConfig - Configuration des paliers de prix
 * @param {number} quantity - Quantité commandée
 * @returns {number|null} - Prix unitaire ou null si aucun palier ne correspond
 */
exports.calculatePriceByQuantity = (tierConfig, quantity) => {
  if (!tierConfig || !tierConfig.tiers || !Array.isArray(tierConfig.tiers)) {
    return null;
  }

  if (tierConfig.tiers.length === 0) {
    return null;
  }

  const sortedTiers = tierConfig.tiers.sort(
    (a, b) => a.min_quantity - b.min_quantity
  );

  for (const tier of sortedTiers) {
    const { min_quantity, max_quantity, unit_price } = tier;

    if (max_quantity === null) {
      if (quantity >= min_quantity) {
        return unit_price;
      }
    } else {
      if (quantity >= min_quantity && quantity <= max_quantity) {
        return unit_price;
      }
    }
  }
};

/**
 * Calcule le prix total selon la quantité et le type de client
 * @param {Object} product - Produit complet
 * @param {number} quantity - Quantité commandée
 * @param {boolean} isPro - Client professionnel ou non
 * @returns {Object} - Détails du calcul
 */
exports.calculateTotalPrice = (product, quantity, isPro = false) => {
  const tierConfig = isPro
    ? product.min_commande_prof
    : product.min_commande_standard;

  const unitPrice = this.calculatePriceByQuantity(tierConfig, quantity);

  if (unitPrice === null) {
    const defaultPrice = isPro ? product.price_pro : product.price;
    return {
      unit_price: parseFloat(defaultPrice),
      quantity,
      total_price: parseFloat(defaultPrice) * quantity,
      tier_applied: false,
      message: "Prix standard appliqué",
    };
  }

  return {
    unit_price: unitPrice,
    quantity,
    total_price: unitPrice * quantity,
    tier_applied: true,
    message: "Prix par palier appliqué",
  };
};

/**
 * Valide la cohérence des paliers de prix
 * @param {Object} tierConfig - Configuration des paliers
 * @returns {Object} - {isValid: boolean, errors: string[]}
 */
exports.validateTierConfig = (tierConfig) => {
  const errors = [];

  if (!tierConfig || !tierConfig.tiers || !Array.isArray(tierConfig.tiers)) {
    return { isValid: false, errors: ["Invalid tier configuration"] };
  }

  if (tierConfig.tiers.length === 0) {
  }

  const sortedTiers = tierConfig.tiers.sort(
    (a, b) => a.min_quantity - b.min_quantity
  );

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];

    if (tier.max_quantity !== null && tier.min_quantity >= tier.max_quantity) {
      errors.push(`Tier ${i + 1}: min_quantity must be less than max_quantity`);
    }

    if (i < sortedTiers.length - 1) {
      const nextTier = sortedTiers[i + 1];
      if (
        tier.max_quantity !== null &&
        tier.max_quantity >= nextTier.min_quantity
      ) {
        errors.push(`Tier ${i + 1} and ${i + 2}: overlapping quantity ranges`);
      }
    }

    if (tier.max_quantity === null && i < sortedTiers.length - 1) {
      errors.push(
        `Tier ${
          i + 1
        }: only the last tier can have unlimited max_quantity (null)`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
