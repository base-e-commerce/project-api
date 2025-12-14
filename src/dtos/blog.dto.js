const Joi = require("joi");

const nullableString = Joi.string().allow(null, "").optional();
const nullableUri = Joi.string().uri().allow(null, "").optional();
const schemaField = Joi.alternatives()
  .try(Joi.object(), Joi.string())
  .optional()
  .allow(null, "");

const baseFields = {
  title: Joi.string().min(3).max(200).messages({
    "string.base": "Title must be a string",
    "string.empty": "Title cannot be empty",
    "string.min": "Title must have at least 3 characters",
    "string.max": "Title must not exceed 200 characters",
  }),
  content: Joi.string().min(10).messages({
    "string.base": "Content must be a string",
    "string.empty": "Content cannot be empty",
    "string.min": "Content must have at least 10 characters",
  }),
  excerpt: Joi.string().max(500).allow(null, "").messages({
    "string.base": "Excerpt must be a string",
    "string.max": "Excerpt must not exceed 500 characters",
  }),
  image_url: nullableUri.messages({
    "string.base": "Image URL must be a string",
    "string.uri": "Image URL must be a valid URI",
  }),
  published_at: Joi.date().iso().allow(null).messages({
    "date.base": "Published date must be a valid date",
    "date.format": "Published date must be in ISO format",
  }),
  meta_title: nullableString.max(150),
  meta_description: nullableString.max(400),
  meta_keywords: nullableString.max(512),
  meta_image_url: nullableUri,
  schema_markup: schemaField,
};

exports.createBlogSchema = Joi.object({
  ...baseFields,
  slug: Joi.any().strip(),
  is_active: Joi.any().strip(),
}).fork(["title", "content"], (schema) => schema.required());

exports.updateBlogSchema = Joi.object({
  ...baseFields,
  slug: Joi.any().strip(),
  is_active: Joi.any().strip(),
});
