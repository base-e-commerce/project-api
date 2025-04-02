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
      .json(createResponse("Internal server error", error.message));
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
      res.status(404).json(createResponse("Product not found", null));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
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
      .json(createResponse("Internal server error", error.message));
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
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
    const { name, description, price, category_id } = req.body;
    if (!name || !description || !price || !category_id) {
      return res
        .status(400)
        .json(createResponse("Bad Request", "All fields are required"));
    }

    const category = await categoryService.getCategoryById(category_id);
    if (!category) {
      return res.status(404).json(createResponse("Category not found", null));
    }

    const newProduct = await productService.createProduct(req.body);
    res
      .status(201)
      .json(createResponse("Product created successfully", newProduct));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
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
      res.status(404).json(createResponse("Product not found", null));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
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
      res.status(404).json(createResponse("Product not found", null));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message));
  }
};
