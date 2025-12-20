const recruitmentService = require("../services/recruitment.service");
const createResponse = require("../utils/api.response");

const handleControllerError = (res, error, fallbackMessage) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || fallbackMessage || "Erreur inattendue";
  return res.status(statusCode).json(createResponse(message, null, false));
};

const createRecruitmentApplication = async (req, res) => {
  try {
    const application = await recruitmentService.createApplication(req.body);
    return res
      .status(201)
      .json(
        createResponse(
          "Votre demande a bien été transmise. Merci pour votre intérêt !",
          application
        )
      );
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Impossible d'enregistrer cette candidature pour le moment."
    );
  }
};

const listRecruitmentApplications = async (req, res) => {
  try {
    const { page, limit, status, offerType, search } = req.query;
    const data = await recruitmentService.listApplications({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      offerType,
      search,
    });

    return res.json(
      createResponse("Liste des candidatures récupérée avec succès", data)
    );
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Impossible de récupérer les candidatures."
    );
  }
};

const getRecruitmentApplication = async (req, res) => {
  try {
    const applicationId = Number(req.params.id);
    const application = await recruitmentService.getApplicationById(
      applicationId
    );
    return res.json(createResponse("Candidature récupérée", application));
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Impossible de récupérer cette candidature."
    );
  }
};

const updateRecruitmentApplicationStatus = async (req, res) => {
  try {
    const applicationId = Number(req.params.id);
    const updated = await recruitmentService.updateStatus(
      applicationId,
      req.body.status
    );

    return res.json(
      createResponse("Statut de la candidature mis à jour", updated)
    );
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Impossible de mettre à jour cette candidature."
    );
  }
};

const getRecruitmentSummary = async (req, res) => {
  try {
    const summary = await recruitmentService.getSummary();
    return res.json(
      createResponse("Synthèse des candidatures générée", summary)
    );
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Impossible de récupérer les statistiques."
    );
  }
};

module.exports = {
  createRecruitmentApplication,
  listRecruitmentApplications,
  getRecruitmentApplication,
  updateRecruitmentApplicationStatus,
  getRecruitmentSummary,
};
