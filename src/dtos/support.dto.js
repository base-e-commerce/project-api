const Joi = require("joi");

const createTicketSchema = Joi.object({
  subject: Joi.string().allow("", null).max(190).optional(),
  content: Joi.string().allow("", null).max(2000).optional(),
});

const supportMessageSchema = Joi.object({
  content: Joi.string().allow("", null).max(2000).optional(),
});

const updateTicketStatusSchema = Joi.object({
  status: Joi.string()
    .valid("open", "waiting-admin", "answered", "closed")
    .required(),
});

module.exports = {
  createTicketSchema,
  supportMessageSchema,
  updateTicketStatusSchema,
};
