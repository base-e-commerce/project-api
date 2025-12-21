const prisma = require("../database/database");

class SearchService {
  normalizeLimit(value, fallback = 6, max = 25) {
    if (value === undefined || value === null) {
      return fallback;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.min(parsed, max);
  }

  buildContainsFilter(query) {
    const normalized = (query || "").trim();
    if (!normalized) {
      return null;
    }

    return {
      contains: normalized,
      mode: "insensitive",
    };
  }

  buildProductWhereClause(query) {
    const contains = this.buildContainsFilter(query);
    const whereClause = { is_active: true };

    if (contains) {
      whereClause.OR = [
        { name: contains },
        { description: contains },
        { category: { name: contains } },
        { service: { name: contains } },
      ];
    }

    return whereClause;
  }

  buildSimpleWhereClause(query) {
    const contains = this.buildContainsFilter(query);
    const whereClause = { is_active: true };

    if (contains) {
      whereClause.OR = [{ name: contains }, { description: contains }];
    }

    return whereClause;
  }

  async fetchProducts(query, limit) {
    const where = this.buildProductWhereClause(query);

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { updated_at: "desc" },
        take: limit,
        include: {
          productImages: true,
          category: true,
          service: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: items.map((product) => ({
        ...product,
        price: Number(product.price ?? 0),
        price_pro: Number(product.price_pro ?? 0),
      })),
      total,
    };
  }

  async fetchCategories(query, limit) {
    const where = this.buildSimpleWhereClause(query);

    const [items, total] = await Promise.all([
      prisma.categorie.findMany({
        where,
        orderBy: { updated_at: "desc" },
        take: limit,
        select: {
          categorie_id: true,
          name: true,
          slug: true,
          service: {
            select: {
              service_id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              Product: true,
            },
          },
        },
      }),
      prisma.categorie.count({ where }),
    ]);

    const normalizedItems = items.map((category) => ({
      id: category.categorie_id,
      name: category.name,
      slug: category.slug,
      service: category.service
        ? {
            id: category.service.service_id,
            name: category.service.name,
            slug: category.service.slug,
          }
        : null,
      products: category._count.Product,
    }));

    return {
      items: normalizedItems,
      total,
    };
  }

  async fetchServices(query, limit) {
    const where = this.buildSimpleWhereClause(query);

    const [items, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { updated_at: "desc" },
        take: limit,
        select: {
          service_id: true,
          name: true,
          slug: true,
          image_url: true,
          categories: {
            select: {
              categorie_id: true,
              name: true,
              slug: true,
            },
            take: 4,
            where: { is_active: true },
          },
          _count: {
            select: {
              Product: true,
            },
          },
        },
      }),
      prisma.service.count({ where }),
    ]);

    const normalizedItems = items.map((service) => ({
      id: service.service_id,
      name: service.name,
      slug: service.slug,
      image: service.image_url,
      categories: service.categories || [],
      products: service._count.Product,
    }));

    return {
      items: normalizedItems,
      total,
    };
  }

  async fetchTrendingCategories(limit = 6) {
    const categories = await prisma.categorie.findMany({
      where: { is_active: true },
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        categorie_id: true,
        name: true,
        slug: true,
      },
    });

    return categories.map((category) => ({
      id: category.categorie_id,
      name: category.name,
      slug: category.slug,
    }));
  }

  async fetchTrendingServices(limit = 4) {
    const services = await prisma.service.findMany({
      where: { is_active: true },
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        service_id: true,
        name: true,
        slug: true,
      },
    });

    return services.map((service) => ({
      id: service.service_id,
      name: service.name,
      slug: service.slug,
    }));
  }

  getQuickShortcuts() {
    return [
      {
        label: "Tout voir",
        description: "Derniers produits ajoutés",
        href: "/product",
        icon: "sparkles",
      },
      {
        label: "Explorer les services",
        description: "Découvrir nos expertises",
        href: "/services",
        icon: "layers",
      },
      {
        label: "Packaging sur-mesure",
        description: "Accès direct aux projets carton",
        href: "/packaging",
        icon: "aperture",
      },
    ];
  }

  async getSpotlightSearch({
    query,
    limitProducts,
    limitCategories,
    limitServices,
  }) {
    const normalizedQuery = (query || "").trim();
    const [
      products,
      categories,
      services,
      trendingCategories,
      trendingServices,
    ] = await Promise.all([
      this.fetchProducts(normalizedQuery, limitProducts),
      this.fetchCategories(normalizedQuery, limitCategories),
      this.fetchServices(normalizedQuery, limitServices),
      this.fetchTrendingCategories(),
      this.fetchTrendingServices(),
    ]);

    return {
      query: normalizedQuery,
      filters: ["all", "products", "categories", "services"],
      results: {
        products,
        categories,
        services,
      },
      suggestions: {
        trendingCategories,
        trendingServices,
        quickShortcuts: this.getQuickShortcuts(),
      },
    };
  }
}

module.exports = new SearchService();
