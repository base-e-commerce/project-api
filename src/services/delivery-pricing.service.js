const prisma = require("../database/database");

class DeliveryPricingService {
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
}

module.exports = new DeliveryPricingService();
