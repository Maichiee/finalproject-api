import express from "express"
import {
  getJobApplicants,
  getApplicantDetail,
  updateApplicationStatus,
  getApplicationStatistics,
  downloadCV,
  bulkUpdateApplicationStatus,
} from "../controllers/applicant.controller"
import { authenticate, authorizeRecruiterOrAdmin } from "../middlewares/auth.middleware"
import { validateApplicationStatusUpdate, validateBulkStatusUpdate } from "../middlewares/validation.middleware"

const router = express.Router()

// All applicant routes require authentication
router.use(authenticate)

// Get applicants for a specific job with filtering
router.get("/job/:jobId", authorizeRecruiterOrAdmin, getJobApplicants)

// Get application statistics for a job
router.get("/job/:jobId/statistics", authorizeRecruiterOrAdmin, getApplicationStatistics)

// Get detailed information about a specific applicant
router.get("/:applicationId", authorizeRecruiterOrAdmin, getApplicantDetail)

// Update application status
router.put(
  "/:applicationId/status",
  authorizeRecruiterOrAdmin,
  validateApplicationStatusUpdate,
  updateApplicationStatus,
)

// Bulk update application statuses
router.put("/bulk/status", authorizeRecruiterOrAdmin, validateBulkStatusUpdate, bulkUpdateApplicationStatus)

// Download CV file
router.get("/:applicationId/cv/download", authorizeRecruiterOrAdmin, downloadCV)

export default router
