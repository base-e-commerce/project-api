const createResponse = require("../utils/api.response");
const validateDto = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res
      .status(400)
      .json(createResponse("Validation failed", errorMessages));
  }

  next();
};

module.exports = { validateDto };
