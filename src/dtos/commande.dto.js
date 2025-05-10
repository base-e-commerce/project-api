const Joi = require("joi");

// exports.createCommandeSchema = Joi.object({
//   customerId: Joi.number().integer().required().messages({
//     "number.base": "Customer ID must be a number",
//     "number.integer": "Customer ID must be an integer",
//     "any.required": "Customer ID is required",
//   }),
//   details: Joi.array()
//     .items(
//       Joi.object({
//         product_id: Joi.number().integer().required().messages({
//           "number.base": "Product ID must be a number",
//           "number.integer": "Product ID must be an integer",
//           "any.required": "Product ID is required",
//         }),
//         quantity: Joi.number().integer().min(1).required().messages({
//           "number.base": "Quantity must be a number",
//           "number.integer": "Quantity must be an integer",
//           "number.min": "Quantity must be at least 1",
//           "any.required": "Quantity is required",
//         }),
//         unit_price: Joi.number().positive().required().messages({
//           "number.base": "Unit price must be a number",
//           "number.positive": "Unit price must be a positive number",
//           "any.required": "Unit price is required",
//         }),
//       })
//     )
//     .required()
//     .messages({
//       "array.base": "Details must be an array",
//       "any.required": "Details are required",
//     }),
// });

exports.createCommandeSchema = Joi.object({
  customerId: Joi.number().integer().required().messages({
    "number.base": "Customer ID must be a number",
    "number.integer": "Customer ID must be an integer",
    "any.required": "Customer ID is required",
  }),
  shippingAddressId: Joi.number().integer().optional().messages({
    "number.base": "Shipping Address ID must be a number",
    "number.integer": "Shipping Address ID must be an integer",
  }),
  details: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().required().messages({
          "number.base": "Product ID must be a number",
          "number.integer": "Product ID must be an integer",
          "any.required": "Product ID is required",
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          "number.base": "Quantity must be a number",
          "number.integer": "Quantity must be an integer",
          "number.min": "Quantity must be at least 1",
          "any.required": "Quantity is required",
        }),
        unit_price: Joi.number().positive().required().messages({
          "number.base": "Unit price must be a number",
          "number.positive": "Unit price must be a positive number",
          "any.required": "Unit price is required",
        }),
      })
    )
    .required()
    .messages({
      "array.base": "Details must be an array",
      "any.required": "Details are required",
    }),
  paymentDetails: Joi.object({
    payment_method: Joi.string().messages({
      "string.base": "Payment method must be a string",
    }),
  })
    .optional()
    .messages({
      "object.base": "Payment details must be an object",
    }),
});

exports.resendCommandeSchema = Joi.object({
  commandeId: Joi.number().integer().required().messages({
    "number.base": "Commande ID must be a number",
    "number.integer": "Commande ID must be an integer",
    "any.required": "Commande ID is required",
  }),
});

exports.receiveCommandeSchema = Joi.object({
  adminId: Joi.number().integer().required().messages({
    "number.base": "Admin ID must be a number",
    "number.integer": "Admin ID must be an integer",
    "any.required": "Admin ID is required",
  }),
});
