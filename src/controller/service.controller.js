const createResponse = require("../utils/api.response");
const serviceService = require("../services/service.pro.service");

exports.getAllServices = async (req, res) => {
  try {
    const services = await serviceService.getAllServices();
    res
      .status(200)
      .json(createResponse("Services fetched successfully", services));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    const service = await serviceService.getServiceById(serviceId);
    if (service) {
      res
        .status(200)
        .json(createResponse("Service fetched successfully", service));
    } else {
      res.status(404).json(createResponse("Service not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createService = async (req, res) => {
  try {
    const newService = await serviceService.createService(req.body);
    res
      .status(201)
      .json(createResponse("Service created successfully", newService));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateService = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    const updatedService = await serviceService.updateService(
      serviceId,
      req.body
    );
    if (updatedService) {
      res
        .status(200)
        .json(createResponse("Service updated successfully", updatedService));
    } else {
      res.status(404).json(createResponse("Service not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteService = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    const deletedService = await serviceService.deleteService(serviceId);
    if (deletedService) {
      res
        .status(200)
        .json(createResponse("Service deleted successfully", deletedService));
    } else {
      res.status(404).json(createResponse("Service not found", null, false));
    }
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
