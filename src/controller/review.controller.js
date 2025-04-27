const createResponse = require("../utils/api.response");
const reviewService = require("../services/review.service");

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getAllReviews();
    res.status(200).json(createResponse("Reviews fetched successfully", reviews));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getReviewById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid review ID", null, false));
  }

  try {
    const review = await reviewService.getReviewById(Number(id));
    if (!review) {
      return res.status(404).json(createResponse("Review not found", null, false));
    }
    res.status(200).json(createResponse("Review fetched successfully", review));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getReviewsByProductId = async (req, res) => {
  const { productId } = req.params;

  if (isNaN(productId)) {
    return res.status(400).json(createResponse("Invalid product ID", null, false));
  }

  try {
    const reviews = await reviewService.getReviewsByProductId(Number(productId));
    res.status(200).json(createResponse("Reviews fetched successfully", reviews));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getReviewsByCustomerId = async (req, res) => {
  const { customerId } = req.params;

  if (isNaN(customerId)) {
    return res.status(400).json(createResponse("Invalid customer ID", null, false));
  }

  try {
    const reviews = await reviewService.getReviewsByCustomerId(Number(customerId));
    res.status(200).json(createResponse("Reviews fetched successfully", reviews));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createReview = async (req, res) => {
  const { product_id, customer_id, rating } = req.body;

  try {
    const newReview = await reviewService.createReview({ product_id, customer_id, rating });
    res.status(201).json(createResponse("Review created successfully", newReview));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateReview = async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid review ID", null, false));
  }

  try {
    const updatedReview = await reviewService.updateReview(Number(id), { rating });
    res.status(200).json(createResponse("Review updated successfully", updatedReview));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteReview = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid review ID", null, false));
  }

  try {
    const deletedReview = await reviewService.deleteReview(Number(id));
    res.status(200).json(createResponse("Review deleted successfully", deletedReview));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
