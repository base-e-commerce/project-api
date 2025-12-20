const express = require("express");
const {
  createRecruitmentApplication,
  listRecruitmentApplications,
  getRecruitmentApplication,
  updateRecruitmentApplicationStatus,
  getRecruitmentSummary,
} = require("../controller/recruitment.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");
const { validateDto } = require("../middleware/dto.validation.middleware");
const {
  createRecruitmentApplicationSchema,
  updateRecruitmentStatusSchema,
} = require("../dtos/recruitment.dto");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RecruitmentApplication:
 *       type: object
 *       properties:
 *         recruitment_id:
 *           type: integer
 *         offer_type:
 *           type: string
 *           enum: [prestation, embauche]
 *         status:
 *           type: string
 *           enum: [pending, reviewed, contacted, qualified, hired, archived]
 *         full_name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         company:
 *           type: string
 *         offer_title:
 *           type: string
 *         speciality:
 *           type: string
 *         experience_years:
 *           type: integer
 *         availability:
 *           type: string
 *         work_mode:
 *           type: string
 *         country:
 *           type: string
 *         city:
 *           type: string
 *         budget_range:
 *           type: string
 *         skills:
 *           type: string
 *         message:
 *           type: string
 *         linkedin_url:
 *           type: string
 *         website_url:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *   requestBodies:
 *     RecruitmentApplicationRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecruitmentApplication'
 *     RecruitmentStatusRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, contacted, qualified, hired, archived]
 *             required:
 *               - status
 */

/**
 * @swagger
 * /recruitment:
 *   post:
 *     summary: Soumettre une candidature ou une proposition de prestation
 *     tags:
 *       - Recruitment
 *     requestBody:
 *       $ref: '#/components/requestBodies/RecruitmentApplicationRequest'
 *     responses:
 *       201:
 *         description: Demande enregistrée
 *       400:
 *         description: Données invalides
 */
router.post(
  "/",
  validateDto(createRecruitmentApplicationSchema),
  createRecruitmentApplication
);

/**
 * @swagger
 * /recruitment:
 *   get:
 *     summary: Lister les candidatures (admin)
 *     tags:
 *       - Recruitment (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: offerType
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste paginée des demandes
 */
router.get(
  "/",
  authenticateToken,
  authenticateAdmin,
  listRecruitmentApplications
);

/**
 * @swagger
 * /recruitment/stats:
 *   get:
 *     summary: Statistiques globales (admin)
 *     tags:
 *       - Recruitment (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques agrégées
 */
router.get(
  "/stats",
  authenticateToken,
  authenticateAdmin,
  getRecruitmentSummary
);

/**
 * @swagger
 * /recruitment/{id}:
 *   get:
 *     summary: Récupérer une candidature (admin)
 *     tags:
 *       - Recruitment (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de la candidature
 *       404:
 *         description: Candidature introuvable
 */
router.get(
  "/:id",
  authenticateToken,
  authenticateAdmin,
  getRecruitmentApplication
);

/**
 * @swagger
 * /recruitment/{id}/status:
 *   patch:
 *     summary: Mettre à jour le statut d'une candidature (admin)
 *     tags:
 *       - Recruitment (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       $ref: '#/components/requestBodies/RecruitmentStatusRequest'
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *       404:
 *         description: Candidature introuvable
 */
router.patch(
  "/:id/status",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateRecruitmentStatusSchema),
  updateRecruitmentApplicationStatus
);

module.exports = router;
