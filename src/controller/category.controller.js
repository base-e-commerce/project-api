const createResponse = require("../utils/api.response");
const categoryService = require("../services/category.service");

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res
      .status(200)
      .json(createResponse("Categories fetched successfully", categories));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getAllCategoriesByService = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    const categories = await categoryService.getAllCategoriesByService(
      serviceId
    );
    res
      .status(200)
      .json(createResponse("Categories fetched successfully", categories));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const category = await categoryService.getCategoryById(categoryId);
    if (category) {
      res
        .status(200)
        .json(createResponse("Category fetched successfully", category));
    } else {
      res.status(404).json(createResponse("Category not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createCategory = async (req, res) => {
  try {
    const newCategory = await categoryService.createCategory(req.body);
    res
      .status(201)
      .json(createResponse("Category created successfully", newCategory));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const updatedCategory = await categoryService.updateCategory(
      categoryId,
      req.body
    );
    if (updatedCategory) {
      res
        .status(200)
        .json(createResponse("Category updated successfully", updatedCategory));
    } else {
      res.status(404).json(createResponse("Category not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const deletedCategory = await categoryService.deleteCategory(categoryId);
    if (deletedCategory) {
      res
        .status(200)
        .json(createResponse("Category deleted successfully", deletedCategory));
    } else {
      res.status(404).json(createResponse("Category not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
