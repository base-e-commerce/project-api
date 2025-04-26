const Joi = require("joi");

exports.createCustomerSchema = Joi.object({
  first_name: Joi.string().min(1).max(50).required().messages({
    "string.base": "First name must be a string",
    "string.empty": "First name cannot be empty",
    "string.min": "First name must have at least 1 character",
    "string.max": "First name must not exceed 50 characters",
    "any.required": "First name is required",
  }),
  last_name: Joi.string().min(1).max(50).required().messages({
    "string.base": "Last name must be a string",
    "string.empty": "Last name cannot be empty",
    "string.min": "Last name must have at least 1 character",
    "string.max": "Last name must not exceed 50 characters",
    "any.required": "Last name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string",
    "string.empty": "Email cannot be empty",
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  password_hash: Joi.string().optional().messages({
    "string.base": "Password hash must be a string",
  }),
  oauth_provider: Joi.string().optional().messages({
    "string.base": "OAuth provider must be a string",
  }),
  oauth_id: Joi.string().optional().messages({
    "string.base": "OAuth ID must be a string",
  }),
  phone: Joi.string().optional().messages({
    "string.base": "Phone must be a string",
  }),
  default_address_id: Joi.number().integer().optional().messages({
    "number.base": "Default address ID must be a number",
    "number.integer": "Default address ID must be an integer",
  }),
});

exports.updateCustomerSchema = Joi.object({
  first_name: Joi.string().min(1).max(50).optional().messages({
    "string.base": "First name must be a string",
    "string.empty": "First name cannot be empty",
    "string.min": "First name must have at least 1 character",
    "string.max": "First name must not exceed 50 characters",
  }),
  last_name: Joi.string().min(1).max(50).optional().messages({
    "string.base": "Last name must be a string",
    "string.empty": "Last name cannot be empty",
    "string.min": "Last name must have at least 1 character",
    "string.max": "Last name must not exceed 50 characters",
  }),
  email: Joi.string().email().optional().messages({
    "string.base": "Email must be a string",
    "string.empty": "Email cannot be empty",
    "string.email": "Email must be a valid email address",
  }),
  password_hash: Joi.string().optional().messages({
    "string.base": "Password hash must be a string",
  }),
  oauth_provider: Joi.string().optional().messages({
    "string.base": "OAuth provider must be a string",
  }),
  oauth_id: Joi.string().optional().messages({
    "string.base": "OAuth ID must be a string",
  }),
  phone: Joi.string().optional().messages({
    "string.base": "Phone must be a string",
  }),
  default_address_id: Joi.number().integer().optional().messages({
    "number.base": "Default address ID must be a number",
    "number.integer": "Default address ID must be an integer",
  }),
});

exports.createAddressSchema = Joi.object({
  line1: Joi.string().min(1).max(100).required().messages({
    "string.base": "Line 1 must be a string",
    "string.empty": "Line 1 cannot be empty",
    "string.min": "Line 1 must have at least 1 character",
    "string.max": "Line 1 must not exceed 100 characters",
    "any.required": "Line 1 is required",
  }),
  line2: Joi.string().max(100).optional().messages({
    "string.base": "Line 2 must be a string",
    "string.max": "Line 2 must not exceed 100 characters",
  }),
  city: Joi.string().min(1).max(50).required().messages({
    "string.base": "City must be a string",
    "string.empty": "City cannot be empty",
    "string.min": "City must have at least 1 character",
    "string.max": "City must not exceed 50 characters",
    "any.required": "City is required",
  }),
  postal_code: Joi.string().min(1).max(20).required().messages({
    "string.base": "Postal code must be a string",
    "string.empty": "Postal code cannot be empty",
    "string.min": "Postal code must have at least 1 character",
    "string.max": "Postal code must not exceed 20 characters",
    "any.required": "Postal code is required",
  }),
  country: Joi.string().min(1).max(50).required().messages({
    "string.base": "Country must be a string",
    "string.empty": "Country cannot be empty",
    "string.min": "Country must have at least 1 character",
    "string.max": "Country must not exceed 50 characters",
    "any.required": "Country is required",
  }),
});

exports.updateAddressSchema = Joi.object({
  line1: Joi.string().min(1).max(100).optional().messages({
    "string.base": "Line 1 must be a string",
    "string.empty": "Line 1 cannot be empty",
    "string.min": "Line 1 must have at least 1 character",
    "string.max": "Line 1 must not exceed 100 characters",
  }),
  line2: Joi.string().max(100).optional().messages({
    "string.base": "Line 2 must be a string",
    "string.max": "Line 2 must not exceed 100 characters",
  }),
  city: Joi.string().min(1).max(50).optional().messages({
    "string.base": "City must be a string",
    "string.empty": "City cannot be empty",
    "string.min": "City must have at least 1 character",
    "string.max": "City must not exceed 50 characters",
  }),
  postal_code: Joi.string().min(1).max(20).optional().messages({
    "string.base": "Postal code must be a string",
    "string.empty": "Postal code cannot be empty",
    "string.min": "Postal code must have at least 1 character",
    "string.max": "Postal code must not exceed 20 characters",
  }),
  country: Joi.string().min(1).max(50).optional().messages({
    "string.base": "Country must be a string",
    "string.empty": "Country cannot be empty",
    "string.min": "Country must have at least 1 character",
    "string.max": "Country must not exceed 50 characters",
  }),
});
