const Joi = require('joi');

const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(30).optional(),
  email: Joi.string().email().required(),
  password_hash: Joi.string().required(),
  role_id: Joi.number().integer().required(),
});

const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
  password_hash: Joi.string().optional(),
  role_id: Joi.number().integer().optional(),
  last_login: Joi.date().optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
