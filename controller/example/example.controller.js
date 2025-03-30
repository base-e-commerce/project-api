const createResponse = require("../../utils/api.response");

exports.examplefunction = async (req, res) => {
  try {
    res.status(200).json(createResponse("Data fetched successfully.", []));
  } catch (error) {
    console.error(error);
    res.status(500).json(createResponse("Internal server error."));
  }
};
