const createResponse = require("../utils/api.response");
const productService = require("../services/product.service");
const categoryService = require("../services/category.service");
const serviceService = require("../services/service.pro.service.js");
const {
  calculateTotalPrice,
  validateTierConfig,
} = require("../helpers/product.helper");

exports.calculateProductPrice = async (req, res) => {
  try {
    const { product_id, quantity, is_pro } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: "product_id and quantity are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const product = await productService.getProductById(product_id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const priceDetails = calculateTotalPrice(
      product,
      quantity,
      is_pro || false
    );

    res.status(200).json({
      success: true,
      data: {
        product_id: product.product_id,
        product_name: product.name,
        ...priceDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getLatestProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    if (limit > 50) {
      return res.status(400).json({
        success: false,
        message: "Limit cannot exceed 50",
      });
    }

    if (limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Limit must be at least 1",
      });
    }

    const products = await productService.getLatestProducts(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { products, totalProducts } = await productService.getAllProducts(
      limit,
      offset
    );

    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json(
      createResponse("Products fetched successfully", {
        products,
        pagination: {
          page,
          limit,
          totalPages,
          totalProducts,
        },
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getAllCategoryProducts = async (req, res) => {
  try {
    const categoryIdentifier = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { products, totalProducts } =
      await productService.getAllCategoryProducts(
        categoryIdentifier,
        limit,
        offset
      );

    if (!products) {
      return res.status(404).json(createResponse("No products found", null));
    }

    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json(
      createResponse("Products fetched successfully", {
        products,
        pagination: {
          page,
          limit,
          totalPages,
          totalProducts,
        },
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getAllLastEachServiceProducts = async (req, res) => {
  try {
    const dataServices = await serviceService.getAllServices();
    if (!dataServices) {
      return res.status(404).json(createResponse("No services found", null));
    }
    const serviceData = await Promise.all(
      dataServices.map(async (service) => {
        const lastProducts = await productService.getLastProductByServiceId(
          service.service_id
        );
        return {
          ...service,
          lastProducts: lastProducts ? lastProducts : [],
        };
      })
    );
    res.status(200).json(
      createResponse("Last products by service fetched successfully", {
        serviceData,
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getAllServiceProducts = async (req, res) => {
  try {
    const serviceIdentifier = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { products, totalProducts } =
      await productService.getAllServiceProducts(
        serviceIdentifier,
        limit,
        offset
      );

    if (!products) {
      return res.status(404).json(createResponse("No products found", null));
    }

    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json(
      createResponse("Products fetched successfully", {
        products,
        pagination: {
          page,
          limit,
          totalPages,
          totalProducts,
        },
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getOtherProductsInService = async (req, res) => {
  const serviceId = parseInt(req.params.id);
  const idProduct = parseInt(req.params.idProduct);
  try {
    const products = await productService.getOtherProductsInService(
      serviceId,
      idProduct
    );
    if (!products) {
      return res.status(404).json(createResponse("No products found", null));
    }
    res
      .status(200)
      .json(createResponse("Products fetched successfully", products));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getProductsCategory = async (req, res) => {
  const idCategory = req.params.idCategory;
  const product = await productService.getProductsCategory(
    Number(idCategory),
    4
  );
  if (product) {
    res
      .status(200)
      .json(createResponse("Product fetched successfully", product));
  } else {
    res.status(404).json(createResponse("Product not found", null, false));
  }
};

exports.getLastTenProducts = async (req, res) => {
  try {
    const products = await productService.getLastTenProducts();
    if (products) {
      res
        .status(200)
        .json(
          createResponse("Last ten products fetched successfully", products)
        );
    } else {
      res.status(404).json(createResponse("Products not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getSearchProducts = async (req, res) => {
  try {
    const key = req.params.key;
    const product = await productService.getSearchProducts(key);
    if (product) {
      res
        .status(200)
        .json(createResponse("Product fetched successfully", product));
    } else {
      res.status(404).json(createResponse("Product not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getProductById = async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const product = await productService.getProductById(productId);
    if (product) {
      res
        .status(200)
        .json(createResponse("Product fetched successfully", product));
    } else {
      res.status(404).json(createResponse("Product not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.addImageToProduct = async (req, res) => {
  const { productId, imageUrl } = req.body;

  if (!productId || !imageUrl) {
    return res
      .status(400)
      .json(
        createResponse("Bad Request", "Product ID and Image URL are required")
      );
  }

  try {
    const productImage = await productService.addImageToProduct(
      productId,
      imageUrl
    );
    res
      .status(201)
      .json(createResponse("Image added successfully", productImage));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const id = parseInt(req.params.productIdImage, 10);
    const productImage = await productService.deleteImageProduct(id);
    if (!productImage) {
      return res
        .status(404)
        .json(createResponse("Product image not deleted", null, false));
    }
    res
      .status(200)
      .json(createResponse("Product image deleted successfully", productImage));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const id = parseInt(req.params.productIdImage, 10);
    const productImage = await productService.deleteImageProduct(id);
    if (!productImage) {
      return res
        .status(404)
        .json(createResponse("Product image not deleted", null));
    }
    res
      .status(200)
      .json(createResponse("Product image deleted successfully", productImage));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      currency,
      currency_name,
      price,
      price_pro,
      is_for_pro,
      category_id,
      service_id,
    } = req.body;
    if (
      !name ||
      !description ||
      price === undefined ||
      price === null ||
      price_pro === undefined ||
      price_pro === null ||
      !currency ||
      !currency_name ||
      !service_id ||
      !category_id
    ) {
      return res
        .status(400)
        .json(createResponse("Bad Request", "All fields are required", false));
    }

    const category = await categoryService.getCategoryById(category_id);
    if (!category) {
      return res
        .status(404)
        .json(createResponse("Category not found", null, false));
    }

    const newProduct = await productService.createProduct(req.body);
    res
      .status(201)
      .json(createResponse("Product created successfully", newProduct));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const updatedProduct = await productService.updateProduct(
      productId,
      req.body
    );
    if (updatedProduct) {
      res
        .status(200)
        .json(createResponse("Product updated successfully", updatedProduct));
    } else {
      res.status(404).json(createResponse("Product not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const deletedProduct = await productService.deleteProduct(productId);
    if (deletedProduct) {
      res
        .status(200)
        .json(createResponse("Product deleted successfully", deletedProduct));
    } else {
      res.status(404).json(createResponse("Product not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
exports.getSearchProductWithSelectedCategory = async (req, res) => {
  try {
    const idCategory = parseInt(req.params.idCategory);
    const key = req.query.key || "";

    const product = await productService.getSearchProductsWithCategorySelected(
      idCategory,
      key
    );

    if (product) {
      res
        .status(200)
        .json(createResponse("Product fetched successfully", product));
    } else {
      res.status(404).json(createResponse("No products found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
