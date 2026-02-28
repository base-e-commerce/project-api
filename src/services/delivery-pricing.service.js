const prisma = require("../database/database");

class DeliveryPricingService {
  normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  resolveDestinationFromCountry(country) {
    const normalized = this.normalizeText(country);
    if (normalized.includes("madagascar")) {
      return "MADAGASCAR";
    }
    return "EUROPE";
  }

  parsePositiveWeight(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }

  mapRate(record) {
    return {
      kg: record.weight_kg,
      priceEuro: Number(record.price_eur),
      priceAr:
        record.price_ariary === null || record.price_ariary === undefined
          ? null
          : Number(record.price_ariary),
    };
  }

  buildZonePayload(code, records) {
    return {
      code,
      rates: records.map((record) => this.mapRate(record)),
    };
  }

  async getPublicPricing(carrier = "GDV") {
    const rows = await prisma.deliveryPricing.findMany({
      where: {
        carrier,
        is_active: true,
      },
      orderBy: [{ destination: "asc" }, { weight_kg: "asc" }],
    });

    const europeRows = rows.filter((row) => row.destination === "EUROPE");
    const madagascarRows = rows.filter(
      (row) => row.destination === "MADAGASCAR"
    );

    return {
      carrier,
      zones: [
        this.buildZonePayload("EUROPE", europeRows),
        this.buildZonePayload("MADAGASCAR", madagascarRows),
      ],
      updatedAt:
        rows.length > 0
          ? rows.reduce(
              (latest, row) =>
                row.updated_at > latest ? row.updated_at : latest,
              rows[0].updated_at
            )
          : null,
    };
  }

  async findRateByWeight({
    carrier = "GDV",
    destination,
    billedWeightKg,
  }) {
    const rate = await prisma.deliveryPricing.findFirst({
      where: {
        carrier,
        destination,
        weight_kg: billedWeightKg,
        is_active: true,
      },
      orderBy: {
        weight_kg: "asc",
      },
    });

    return rate;
  }

  async getRatesByDestination({ carrier = "GDV", destination }) {
    return prisma.deliveryPricing.findMany({
      where: {
        carrier,
        destination,
        is_active: true,
      },
      orderBy: {
        weight_kg: "asc",
      },
    });
  }

  async quoteByCountryAndWeight({
    country,
    totalWeightKg,
    carrier = "GDV",
  }) {
    const normalizedWeight = this.parsePositiveWeight(totalWeightKg);
    if (normalizedWeight === null) {
      throw new Error("Total weight must be greater than 0");
    }

    const destination = this.resolveDestinationFromCountry(country);
    const billedWeightKg = Math.max(1, Math.ceil(normalizedWeight));
    const rates = await this.getRatesByDestination({
      carrier,
      destination,
    });

    if (!rates || rates.length === 0) {
      throw new Error(`No delivery pricing configured for ${destination}`);
    }

    let rate = rates.find((entry) => Number(entry.weight_kg) === billedWeightKg);
    let computedPriceEuro = null;
    let computedPriceAr = null;
    let extrapolated = false;

    if (!rate) {
      const higherOrEqual = rates.find(
        (entry) => Number(entry.weight_kg) >= billedWeightKg
      );
      if (higherOrEqual) {
        rate = higherOrEqual;
      } else {
        if (rates.length < 2) {
          throw new Error(
            `No delivery pricing found for ${destination} and ${billedWeightKg} KG`
          );
        }

        const last = rates[rates.length - 1];
        const prev = rates[rates.length - 2];
        const lastWeight = Number(last.weight_kg);
        const prevWeight = Number(prev.weight_kg);
        const weightDelta = lastWeight - prevWeight;
        if (!Number.isFinite(weightDelta) || weightDelta <= 0) {
          throw new Error(
            `No delivery pricing found for ${destination} and ${billedWeightKg} KG`
          );
        }

        const lastPriceEuro = Number(last.price_eur);
        const prevPriceEuro = Number(prev.price_eur);
        const euroDeltaPerKg = (lastPriceEuro - prevPriceEuro) / weightDelta;
        const extraKg = billedWeightKg - lastWeight;
        computedPriceEuro = lastPriceEuro + euroDeltaPerKg * extraKg;

        const hasAr =
          last.price_ariary !== null &&
          last.price_ariary !== undefined &&
          prev.price_ariary !== null &&
          prev.price_ariary !== undefined;
        if (hasAr) {
          const lastPriceAr = Number(last.price_ariary);
          const prevPriceAr = Number(prev.price_ariary);
          const arDeltaPerKg = (lastPriceAr - prevPriceAr) / weightDelta;
          computedPriceAr = lastPriceAr + arDeltaPerKg * extraKg;
        }

        rate = last;
        extrapolated = true;
      }
    }

    return {
      carrier,
      destination,
      country: country || null,
      totalWeightKg: normalizedWeight,
      billedWeightKg,
      priceEuro:
        computedPriceEuro === null
          ? Number(rate.price_eur)
          : Number(computedPriceEuro),
      priceAr:
        computedPriceAr !== null
          ? Number(computedPriceAr)
          : rate.price_ariary === null || rate.price_ariary === undefined
            ? null
            : Number(rate.price_ariary),
      rateId: rate.delivery_pricing_id,
      extrapolated,
    };
  }
}

module.exports = new DeliveryPricingService();
