const Joi = require("joi");

exports.createReviewSchema = Joi.object({
  product_id: Joi.number().integer().required().messages({
    "number.base": "Product ID must be a number",
    "number.integer": "Product ID must be an integer",
    "any.required": "Product ID is required",
  }),
  customer_id: Joi.number().integer().required().messages({
    "number.base": "Customer ID must be a number",
    "number.integer": "Customer ID must be an integer",
    "any.required": "Customer ID is required",
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Rating must be a number",
    "number.integer": "Rating must be an integer",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating must not exceed 5",
    "any.required": "Rating is required",
  }),
});

exports.updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    "number.base": "Rating must be a number",
    "number.integer": "Rating must be an integer",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating must not exceed 5",
  }),
});
