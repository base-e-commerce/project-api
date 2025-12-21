const createResponse = require("../utils/api.response");
const searchService = require("../services/search.service");

exports.getSpotlightSearch = async (req, res) => {
  try {
    const limitProducts = searchService.normalizeLimit(
      req.query.products,
      6,
      20
    );
    const limitCategories = searchService.normalizeLimit(
      req.query.categories,
      6,
      20
    );
    const limitServices = searchService.normalizeLimit(
      req.query.services,
      6,
      20
    );

    const payload = await searchService.getSpotlightSearch({
      query: req.query.q || "",
      limitProducts,
      limitCategories,
      limitServices,
    });

    res
      .status(200)
      .json(createResponse("Spotlight search ready", payload));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
