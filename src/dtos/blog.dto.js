const Joi = require("joi");

exports.createBlogSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    "string.base": "Title must be a string",
    "string.empty": "Title cannot be empty",
    "string.min": "Title must have at least 3 characters",
    "string.max": "Title must not exceed 200 characters",
    "any.required": "Title is required",
  }),
  content: Joi.string().min(10).required().messages({
    "string.base": "Content must be a string",
    "string.empty": "Content cannot be empty",
    "string.min": "Content must have at least 10 characters",
    "any.required": "Content is required",
  }),
  excerpt: Joi.string().max(500).optional().allow(null, "").messages({
    "string.base": "Excerpt must be a string",
    "string.max": "Excerpt must not exceed 500 characters",
  }),
  image_url: Joi.string().uri().optional().allow(null, "").messages({
    "string.base": "Image URL must be a string",
    "string.uri": "Image URL must be a valid URI",
  }),
  published_at: Joi.date().iso().optional().allow(null).messages({
    "date.base": "Published date must be a valid date",
    "date.format": "Published date must be in ISO format",
  }),
});

exports.updateBlogSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional().messages({
    "string.base": "Title must be a string",
    "string.empty": "Title cannot be empty",
    "string.min": "Title must have at least 3 characters",
    "string.max": "Title must not exceed 200 characters",
  }),
  content: Joi.string().min(10).optional().messages({
    "string.base": "Content must be a string",
    "string.empty": "Content cannot be empty",
    "string.min": "Content must have at least 10 characters",
  }),
  excerpt: Joi.string().max(500).optional().allow(null, "").messages({
    "string.base": "Excerpt must be a string",
    "string.max": "Excerpt must not exceed 500 characters",
  }),
  image_url: Joi.string().uri().optional().allow(null, "").messages({
    "string.base": "Image URL must be a string",
    "string.uri": "Image URL must be a valid URI",
  }),
  published_at: Joi.date().iso().optional().allow(null).messages({
    "date.base": "Published date must be a valid date",
    "date.format": "Published date must be in ISO format",
  }),
  is_active: Joi.boolean().optional().messages({
    "boolean.base": "is_active must be a boolean value",
  }),
});
