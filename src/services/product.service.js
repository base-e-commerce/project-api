const prisma = require("../database/database");
const { slugify } = require("../utils/slug.util");

class ProductService {
  constructor() {
    this.defaultCatalogSort = "newest";
    this.catalogSorts = {
      newest: {
        label: "Nouveautés",
        description: "Derniers produits ajoutés",
        orderBy: [{ created_at: "desc" }],
      },
      "price-asc": {
        label: "Prix croissant",
        description: "Du moins cher au plus cher",
        orderBy: [{ price: "asc" }],
      },
      "price-desc": {
        label: "Prix décroissant",
        description: "Du plus cher au moins cher",
        orderBy: [{ price: "desc" }],
      },
      alpha: {
        label: "Ordre alphabétique",
        description: "De A à Z",
        orderBy: [{ name: "asc" }],
      },
      stock: {
        label: "Stock disponible",
        description: "Priorise les références prêtes à livrer",
        orderBy: [
          { stock_quantity: "desc" },
          { updated_at: "desc" },
        ],
      },
    };

    this.catalogProductInclude = {
      productImages: true,
      productVideos: true,
      category: true,
      service: true,
      reviews: {
        include: {
          customer: true,
        },
      },
    };
  }

  buildServiceFilter(identifier) {
    if (identifier === undefined || identifier === null) {
      return null;
    }

    if (typeof identifier === "number" && !Number.isNaN(identifier)) {
      return { service_id: identifier };
    }

    if (typeof identifier === "string") {
      const trimmed = identifier.trim();
      if (!trimmed) {
        return null;
      }

      if (/^\d+$/.test(trimmed)) {
        return { service_id: Number(trimmed) };
      }

      return { service: { slug: slugify(trimmed) } };
    }

    return null;
  }

  buildCategoryFilter(identifier) {
    if (identifier === undefined || identifier === null) {
      return null;
    }

    if (typeof identifier === "number" && !Number.isNaN(identifier)) {
      return { category_id: identifier };
    }

    if (typeof identifier === "string") {
      const trimmed = identifier.trim();
      if (!trimmed) {
        return null;
      }

      if (/^\d+$/.test(trimmed)) {
        return { category_id: Number(trimmed) };
      }

      return { category: { slug: slugify(trimmed) } };
    }

    return null;
  }

  normalizeIdentifier(value) {
    if (value === undefined || value === null) {
      return null;
    }
    const normalized = String(value).trim();
    return normalized === "" ? null : normalized;
  }

  normalizeAvailabilityValue(value) {
    if (typeof value !== "string") {
      return null;
    }
    const normalized = value.trim().toLowerCase();
    if (["in", "instock", "available", "yes"].includes(normalized)) {
      return "in";
    }
    if (["out", "outofstock", "unavailable", "no"].includes(normalized)) {
      return "out";
    }
    return null;
  }

  normalizePriceBound(value) {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      return null;
    }
    return parsed;
  }

  normalizeCatalogFilters(filters = {}) {
    const normalized = {
      search: typeof filters.search === "string" ? filters.search.trim() : "",
      service: this.normalizeIdentifier(filters.service),
      category: this.normalizeIdentifier(filters.category),
      availability: this.normalizeAvailabilityValue(filters.availability),
      priceMin: this.normalizePriceBound(filters.priceMin),
      priceMax: this.normalizePriceBound(filters.priceMax),
    };

    if (
      typeof normalized.priceMin === "number" &&
      typeof normalized.priceMax === "number" &&
      normalized.priceMin > normalized.priceMax
    ) {
      [normalized.priceMin, normalized.priceMax] = [
        normalized.priceMax,
        normalized.priceMin,
      ];
    }

    return normalized;
  }

  buildContainsFilter(value) {
    const normalized = (value || "").trim();
    if (!normalized) {
      return null;
    }

    return {
      contains: normalized,
    };
  }

  buildProductTextFiltersFromContains(contains) {
    if (!contains) {
      return null;
    }

    return [
      { name: contains },
      { description: contains },
      { descriptionRich: contains },
    ];
  }

  buildCatalogSearchFilter(search) {
    const contains = this.buildContainsFilter(search);
    if (!contains) {
      return null;
    }
    const productFilters =
      this.buildProductTextFiltersFromContains(contains) ?? [];

    return [
      ...productFilters,
      { category: { name: contains } },
      { service: { name: contains } },
    ];
  }

  buildCatalogWhereClause(filters = {}) {
    const whereClause = { is_active: true };
    const searchFilters = this.buildCatalogSearchFilter(filters.search);
    if (searchFilters) {
      whereClause.OR = searchFilters;
    }

    if (filters.service) {
      const serviceFilter = this.buildServiceFilter(filters.service);
      if (serviceFilter) {
        Object.assign(whereClause, serviceFilter);
      }
    }

    if (filters.category) {
      const categoryFilter = this.buildCategoryFilter(filters.category);
      if (categoryFilter) {
        Object.assign(whereClause, categoryFilter);
      }
    }

    const availability = this.normalizeAvailabilityValue(filters.availability);
    if (availability === "in") {
      whereClause.stock_quantity = { gt: 0 };
    } else if (availability === "out") {
      whereClause.stock_quantity = 0;
    }

    const priceFilter = {};
    if (typeof filters.priceMin === "number") {
      priceFilter.gte = filters.priceMin;
    }
    if (typeof filters.priceMax === "number") {
      priceFilter.lte = filters.priceMax;
    }
    if (Object.keys(priceFilter).length > 0) {
      whereClause.price = priceFilter;
    }

    return whereClause;
  }

  resolveCatalogSort(sortKey) {
    const key =
      typeof sortKey === "string" && this.catalogSorts[sortKey]
        ? sortKey
        : this.defaultCatalogSort;
    return {
      key,
      orderBy: this.catalogSorts[key].orderBy,
    };
  }

  getCatalogSortOptions(activeKey) {
    return Object.entries(this.catalogSorts).map(([id, meta]) => ({
      id,
      label: meta.label,
      description: meta.description,
      active: id === activeKey,
    }));
  }

  normalizeProductPayload(product) {
    if (!product) {
      return product;
    }

    return {
      ...product,
      price: Number(product.price ?? 0),
      price_pro: Number(product.price_pro ?? 0),
      weight_kg:
        product.weight_kg === null || product.weight_kg === undefined
          ? null
          : Number(product.weight_kg),
    };
  }

  normalizeProducts(products = []) {
    return (products || []).map((product) => this.normalizeProductPayload(product));
  }

  normalizePriceRange(aggregateResult) {
    if (!aggregateResult) {
      return { min: null, max: null };
    }

    const minValue =
      aggregateResult._min?.price !== null &&
      aggregateResult._min?.price !== undefined
        ? Number(aggregateResult._min.price)
        : null;
    const maxValue =
      aggregateResult._max?.price !== null &&
      aggregateResult._max?.price !== undefined
        ? Number(aggregateResult._max.price)
        : null;

    return {
      min: minValue,
      max: maxValue,
    };
  }

  deriveTopCategories(categories = []) {
    return [...(categories || [])]
      .filter((category) => category.products > 0)
      .sort((a, b) => b.products - a.products)
      .slice(0, 6);
  }

  async fetchCatalogCategories() {
    const categories = await prisma.categorie.findMany({
      where: { is_active: true },
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
      orderBy: { name: "asc" },
    });

    return categories.map((category) => ({
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
  }

  async fetchCatalogServices() {
    const services = await prisma.service.findMany({
      where: { is_active: true },
      select: {
        service_id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            Product: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return services.map((service) => ({
      id: service.service_id,
      name: service.name,
      slug: service.slug,
      products: service._count.Product,
    }));
  }

  async fetchPriceInsights(whereClause) {
    const [globalAggregate, filteredAggregate] = await Promise.all([
      prisma.product.aggregate({
        where: { is_active: true },
        _min: { price: true },
        _max: { price: true },
      }),
      prisma.product.aggregate({
        where: whereClause,
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    return {
      global: this.normalizePriceRange(globalAggregate),
      filtered: this.normalizePriceRange(filteredAggregate),
    };
  }

  async fetchAvailabilityStats(whereClause) {
    const baseWhere = { ...whereClause };
    delete baseWhere.stock_quantity;

    const inStockWhere = { ...baseWhere, stock_quantity: { gt: 0 } };
    const outOfStockWhere = { ...baseWhere, stock_quantity: 0 };

    const [inStock, outOfStock] = await Promise.all([
      prisma.product.count({ where: inStockWhere }),
      prisma.product.count({ where: outOfStockWhere }),
    ]);

    return { inStock, outOfStock };
  }

  async fetchHeroMetrics() {
    const [
      totalProducts,
      totalServices,
      totalCategories,
      inStock,
      outOfStock,
      lastProduct,
    ] = await Promise.all([
      prisma.product.count({ where: { is_active: true } }),
      prisma.service.count({ where: { is_active: true } }),
      prisma.categorie.count({ where: { is_active: true } }),
      prisma.product.count({
        where: { is_active: true, stock_quantity: { gt: 0 } },
      }),
      prisma.product.count({
        where: { is_active: true, stock_quantity: 0 },
      }),
      prisma.product.findFirst({
        where: { is_active: true },
        select: { updated_at: true },
        orderBy: { updated_at: "desc" },
      }),
    ]);

    return {
      totalProducts,
      totalServices,
      totalCategories,
      inStock,
      outOfStock,
      lastUpdated: lastProduct?.updated_at
        ? lastProduct.updated_at.toISOString()
        : null,
    };
  }

  async fetchFeaturedProducts(limit = 4) {
    const featured = await prisma.product.findMany({
      where: { is_active: true, suggest: true },
      include: this.catalogProductInclude,
      orderBy: { updated_at: "desc" },
      take: limit,
    });

    if (featured.length > 0) {
      return featured;
    }

    return prisma.product.findMany({
      where: { is_active: true },
      include: this.catalogProductInclude,
      orderBy: { created_at: "desc" },
      take: limit,
    });
  }

  async fetchSpotlightProducts(limit = 3) {
    return prisma.product.findMany({
      where: { is_active: true },
      include: this.catalogProductInclude,
      take: limit,
      orderBy: [
        { reviews: { _count: "desc" } },
        { updated_at: "desc" },
      ],
    });
  }


  async createProduct(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        let price_final_pro = 0;
        if (data.price_pro == 0) {
          price_final_pro = parseFloat(data.price) / 5;
        } else {
          price_final_pro = data.price_pro;
        }
        const newProduct = await prisma.product.create({
          data: {
            name: data.name,
            description: data.description,
            descriptionRich: data.descriptionRich,
            currency: data.currency,
            currency_name: data.currency_name,
            price: data.price,
            price_pro: price_final_pro,
            weight_kg:
              data.weight_kg === null || data.weight_kg === undefined
                ? null
                : Number(data.weight_kg),
            stock_quantity: data.stock_quantity,
            image_url: data.image_url,
            category_id: data.category_id,
            service_id: data.service_id,
            is_active: data.is_active,
            is_for_pro: data.is_for_pro,
            suggest: data.suggest ?? false,
            min_commande_standard: data.min_commande_standard || { tiers: [] },
            min_commande_prof: data.min_commande_prof || { tiers: [] },
            min_co_standard: data.min_co_standard ?? null,
            min_co_pro: data.min_co_pro ?? null,
          },
        });
        return newProduct;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the product: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getSearchProducts(key) {
    try {
      const contains = this.buildContainsFilter(key);
      const keywordFilters = this.buildProductTextFiltersFromContains(contains);

      const whereClause = { is_active: true };
      if (keywordFilters) {
        whereClause.OR = keywordFilters;
      }

      const product = await prisma.product.findMany({
        where: whereClause,
        include: {
          productImages: true,
          category: true,
          service: true,
        },
        orderBy: { created_at: "desc" },
      });
      return product;
    } catch (error) {
      throw new Error(
        `Error occurred while searching for product: ${error.message}`
      );
    }
  }
  async getSearchProductsWithCategorySelected(idCategory, key) {
    try {
      const whereClause = { is_active: true };

      if (idCategory !== 0) {
        whereClause.category_id = idCategory;
      }

      const contains = this.buildContainsFilter(key);
      const keywordFilters = this.buildProductTextFiltersFromContains(contains);

      if (keywordFilters) {
        const keywordClause = { OR: keywordFilters };

        if (idCategory !== 0) {
          whereClause.AND = [keywordClause];
        } else {
          Object.assign(whereClause, keywordClause);
        }
      }

      const product = await prisma.product.findMany({
        where: whereClause,
        include: {
          productImages: true,
          category: true,
          service: true,
        },
        orderBy: { created_at: "desc" },
      });

      return product;
    } catch (error) {
      throw new Error(
        `Error occurred while searching for product: ${error.message}`
      );
    }
  }

  async getProductCatalogView({
    page = 1,
    limit = 12,
    sort = "newest",
    filters = {},
  } = {}) {
    const parsedPage = Number.parseInt(page, 10);
    const sanitizedPage =
      Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const parsedLimit = Number.parseInt(limit, 10);
    const sanitizedLimitRaw =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 12;
    const sanitizedLimit = Math.min(sanitizedLimitRaw, 50);
    const normalizedFilters = this.normalizeCatalogFilters(filters);
    const whereClause = this.buildCatalogWhereClause(normalizedFilters);
    const availabilityBaseFilters = {
      ...normalizedFilters,
      availability: null,
    };
    const availabilityWhere =
      this.buildCatalogWhereClause(availabilityBaseFilters);

    const { key: activeSortKey, orderBy } = this.resolveCatalogSort(sort);
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    const products = await prisma.product.findMany({
      where: whereClause,
      include: this.catalogProductInclude,
      skip: offset,
      take: sanitizedLimit,
      orderBy,
    });

    const totalProducts = await prisma.product.count({
      where: whereClause,
    });

    const categories = await this.fetchCatalogCategories();
    const services = await this.fetchCatalogServices();
    const priceInsights = await this.fetchPriceInsights(whereClause);
    const availabilityStats = await this.fetchAvailabilityStats(availabilityWhere);
    const heroMetrics = await this.fetchHeroMetrics();
    const featuredProducts = await this.fetchFeaturedProducts();
    const spotlightProducts = await this.fetchSpotlightProducts();

    const totalPages = Math.max(1, Math.ceil(totalProducts / sanitizedLimit));

    return {
      products: this.normalizeProducts(products),
      pagination: {
        page: sanitizedPage,
        limit: sanitizedLimit,
        totalPages,
        totalProducts,
      },
      filters: {
        categories,
        services,
        priceRange: priceInsights.global,
        filteredPriceRange: priceInsights.filtered,
        availability: availabilityStats,
      },
      hero: heroMetrics,
      highlights: {
        featured: this.normalizeProducts(featuredProducts),
        spotlight: this.normalizeProducts(spotlightProducts),
        topCategories: this.deriveTopCategories(categories),
      },
      appliedFilters: {
        ...normalizedFilters,
        sort: activeSortKey,
      },
      sortOptions: this.getCatalogSortOptions(activeSortKey),
    };
  }

  async getAllProducts(limit, offset, search = "") {
    try {
      const parsedLimit = Number.parseInt(limit, 10);
      const parsedOffset = Number.parseInt(offset, 10);
      const sanitizedLimit = Number.isFinite(parsedLimit)
        ? Math.max(parsedLimit, 1)
        : 10;
      const sanitizedOffset = Number.isFinite(parsedOffset)
        ? Math.max(parsedOffset, 0)
        : 0;

      const whereClause = { is_active: true };
      const searchFilters = this.buildCatalogSearchFilter(search);
      if (searchFilters) {
        whereClause.OR = searchFilters;
      }

      const [products, totalProducts] = await Promise.all([
        prisma.product.findMany({
          include: {
            productImages: true,
            category: true,
            service: true,
            reviews: {
              include: {
                customer: true,
              },
            },
          },
          skip: sanitizedOffset,
          take: sanitizedLimit,
          orderBy: { created_at: "desc" },
          where: whereClause,
        }),
        prisma.product.count({
          where: whereClause,
        }),
      ]);

      return {
        products: this.normalizeProducts(products),
        totalProducts,
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving products: ${error.message}`
      );
    }
  }

  async getLastProductByServiceId(serviceId) {
    try {
      const products = await prisma.product.findMany({
        where: { service_id: serviceId, is_active: true },
        include: {
          productImages: true,
          category: true,
          service: true,
          reviews: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 4,
      });
      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the last products by service ID: ${error.message}`
      );
    }
  }

  async getOtherProductsInService(serviceId, productId) {
    try {
      const products = await prisma.product.findMany({
        where: {
          service_id: serviceId,
          product_id: { not: productId },
          is_active: true,
        },
        include: {
          productImages: true,
          category: true,
          service: true,
          reviews: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving other products in service: ${error.message}`
      );
    }
  }

  async getAllCategoryProducts(identifier, limit, offset) {
    try {
      const categoryFilter = this.buildCategoryFilter(identifier);
      if (!categoryFilter) {
        return { products: [], totalProducts: 0 };
      }

      const whereClause = { ...categoryFilter, is_active: true };

      const [products, totalProducts] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          include: {
            productImages: true,
            category: true,
            service: true,
            reviews: {
              include: {
                customer: true,
              },
            },
          },
          skip: offset,
          take: limit,
          orderBy: { created_at: "desc" },
        }),
        prisma.product.count({
          where: whereClause,
        }),
      ]);

      return {
        products,
        totalProducts,
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving products: ${error.message}`
      );
    }
  }

  async getAllServiceProducts(identifier, limit, offset) {
    try {
      const serviceFilter = this.buildServiceFilter(identifier);
      if (!serviceFilter) {
        return { products: [], totalProducts: 0 };
      }

      const whereClause = { ...serviceFilter, is_active: true };

      const [products, totalProducts] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          include: {
            productImages: true,
            category: true,
            service: true,
            reviews: {
              include: {
                customer: true,
              },
            },
          },
          skip: offset,
          take: limit,
          orderBy: { created_at: "desc" },
        }),
        prisma.product.count({
          where: whereClause,
        }),
      ]);

      return {
        products,
        totalProducts,
      };
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving products: ${error.message}`
      );
    }
  }

  async getLastTenProducts() {
    try {
      const products = await prisma.product.findMany({
        orderBy: { created_at: "desc" },
        include: {
          productImages: true,
          category: {
            include: {
              service: true,
            },
          },
        },
        take: 10,
        where: { is_active: true },
      });
      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the last ten products: ${error.message}`
      );
    }
  }

  // async getProductsCategory(idCategory, limit) {
  //   try {
  //     const products = await prisma.product.findMany({
  //       where: { category_id: idCategory },
  //       include: { productImages: true, category: true, service: true, reviews: true, }, },
  //       take: limit,
  //     });
  //     return products;
  //   } catch (error) {
  //     throw new Error(
  //       `Error occurred while retrieving products by category: ${error.message}`
  //     );
  //   }
  // }
  async getProductsCategory(idCategory, limit) {
    try {
      const whereClause =
        idCategory === 0
          ? { is_active: true }
          : { category_id: idCategory, is_active: true };

      const products = await prisma.product.findMany({
        where: whereClause,
        include: {
          productImages: true,
          category: true,
          service: true,
        },
        take: limit,
      });

      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving products by category: ${error.message}`
      );
    }
  }

  async getLatestProducts(limit = 10) {
    try {
      const products = await prisma.product.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          created_at: "desc",
        },
        take: limit,
        include: {
          service: {
            select: {
              service_id: true,
              name: true,
            },
          },
          category: {
            select: {
              categorie_id: true,
              name: true,
            },
          },
          productImages: {
            select: {
              product_image_id: true,
              image_url: true,
            },
          },
        },
      });
      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving latest products: ${error.message}`
      );
    }
  }

  async getSuggestedProducts(limit = 12) {
    try {
      const products = await prisma.product.findMany({
        where: {
          is_active: true,
          suggest: true,
        },
        orderBy: {
          updated_at: "desc",
        },
        take: limit,
        include: {
          service: {
            select: {
              service_id: true,
              name: true,
            },
          },
          category: {
            select: {
              categorie_id: true,
              name: true,
            },
          },
          productImages: {
            select: {
              product_image_id: true,
              image_url: true,
            },
          },
        },
      });
      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving suggested products: ${error.message}`
      );
    }
  }

  async addImageToProduct(productId, imageUrl) {
    try {
      const productExists = await prisma.product.findUnique({
        where: { product_id: productId },
      });

      if (!productExists) {
        throw new Error(`Product with ID ${productId} does not exist`);
      }

      const productImage = await prisma.productImage.create({
        data: {
          product_id: productId,
          image_url: imageUrl,
        },
      });

      return productImage;
    } catch (error) {
      throw new Error(
        `Error occurred while adding image to product: ${error.message}`
      );
    }
  }

  normalizeVideoUrls(videoUrls) {
    if (!Array.isArray(videoUrls)) {
      return [];
    }

    const cleaned = videoUrls
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0);

    return Array.from(new Set(cleaned));
  }

  async addVideosToProduct(productId, videoUrls) {
    try {
      const productExists = await prisma.product.findUnique({
        where: { product_id: productId },
        select: { product_id: true },
      });

      if (!productExists) {
        throw new Error(`Product with ID ${productId} does not exist`);
      }

      const normalizedUrls = this.normalizeVideoUrls(videoUrls);
      if (!normalizedUrls.length) {
        throw new Error("At least one valid video URL is required");
      }

      const createdItems = await prisma.$transaction(
        normalizedUrls.map((url) =>
          prisma.productVideo.create({
            data: {
              product_id: productId,
              video_url: url,
            },
          })
        )
      );

      return createdItems;
    } catch (error) {
      throw new Error(
        `Error occurred while adding videos to product: ${error.message}`
      );
    }
  }

  async deleteVideoProduct(productVideoId) {
    try {
      const videoExists = await prisma.productVideo.findUnique({
        where: { product_video_id: productVideoId },
      });

      if (!videoExists) {
        throw new Error(
          `Product video with ID ${productVideoId} does not exist`
        );
      }

      await prisma.productVideo.delete({
        where: { product_video_id: productVideoId },
      });

      return videoExists;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting product video: ${error.message}`
      );
    }
  }

  async deleteImageProduct(productImageId) {
    try {
      const productImageExists = await prisma.productImage.findUnique({
        where: { product_image_id: productImageId },
      });
      if (!productImageExists) {
        throw new Error(
          `Product image with ID ${productImageId} does not exist`
        );
      }
      await prisma.productImage.delete({
        where: { product_image_id: productImageId },
      });
      return productImageExists;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting product image: ${error.message}`
      );
    }
  }

  async getProductById(productId) {
    try {
      const product = await prisma.product.findUnique({
        where: { product_id: productId },
        include: {
          productImages: true,
          productVideos: true,
          category: true,
          service: true,
          reviews: {
            include: {
              customer: true,
            },
          },
        },
      });
      return product;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the product: ${error.message}`
      );
    }
  }

  async getProductsByIds(productIds) {
    try {
      const uniqueIds = Array.from(
        new Set(
          (productIds || [])
            .map((id) => Number(id))
            .filter((id) => !Number.isNaN(id))
        )
      );

      if (uniqueIds.length === 0) {
        return [];
      }

      const products = await prisma.product.findMany({
        where: {
          product_id: { in: uniqueIds },
        },
        select: {
          product_id: true,
          name: true,
          min_co_standard: true,
          min_co_pro: true,
          weight_kg: true,
        },
      });

      return products;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving products by ids: ${error.message}`
      );
    }
  }

  async updateProduct(productId, data) {
    try {
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );
      if (Object.prototype.hasOwnProperty.call(updateData, "weight_kg")) {
        if (updateData.weight_kg === "" || updateData.weight_kg === null) {
          updateData.weight_kg = null;
        } else {
          const parsedWeight = Number(updateData.weight_kg);
          updateData.weight_kg = Number.isFinite(parsedWeight)
            ? parsedWeight
            : null;
        }
      }

      const updatedProduct = await prisma.product.update({
        where: { product_id: productId },
        data: updateData,
      });
      return updatedProduct;
    } catch (error) {
      throw new Error(
        `Error occurred while updating product: ${error.message}`
      );
    }
  }

  async deleteProduct(productId) {
    try {
      const deletedProduct = await prisma.product.delete({
        where: { product_id: productId },
      });
      return deletedProduct;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the product: ${error.message}`
      );
    }
  }
}

module.exports = new ProductService();
