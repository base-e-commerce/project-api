const createResponse = require("../utils/api.response");
const productService = require("../services/product.service");
const categoryService = require("../services/category.service");

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

exports.getAllServiceProducts = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { products, totalProducts } =
      await productService.getAllServiceProducts(serviceId, limit, offset);

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
}

exports.getProductsCategory = async (req, res) => {
  const idCategory = req.params.idCategory;
  const product = await productService.getProductsCategory(Number(idCategory), 4);
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
        .json(createResponse("Last ten products fetched successfully", products));
    } else {
      res.status(404).json(createResponse("Products not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
}

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
    const { name, description, currency, currency_name, price, category_id } =
      req.body;
    if (
      !name ||
      !description ||
      !price ||
      !currency ||
      !currency_name ||
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
