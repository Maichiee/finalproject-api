import type { Response } from "express"
import path from "path"
import fs from "fs"
import prisma from "../lib/prisma"
import type { AuthRequest } from "../types/express"

/**
 * Get applicants for a specific job
 */
export const getJobApplicants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const { jobId } = req.params
    const { name, minAge, maxAge, minSalary, maxSalary, education, status, page = "1", limit = "10" } = req.query

    if (!jobId) {
      res.status(400).json({ message: "Job ID is required" })
      return
    }

    // Check if job exists and user has permission to view applicants
    const job = await prisma.job.findUnique({
      where: { job_id: jobId },
      include: {
        company: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!job) {
      res.status(404).json({ message: "Job not found" })
      return
    }

    // Check if user is admin or the recruiter who posted the job
    if (req.user.role !== "admin" && job.company.user.user_id !== req.user.user_id) {
      res.status(403).json({ message: "Access denied. You can only view applicants for your own job posts." })
      return
    }

    // Build filter conditions
    const whereConditions: any = {
      jobId: jobId,
    }

    // Add status filter
    if (status && typeof status === "string") {
      whereConditions.status = status
    }

    // Build user filter conditions for nested filtering
    const userWhereConditions: any = {}

    // Name filter
    if (name && typeof name === "string") {
      userWhereConditions.name = {
        contains: name,
        mode: "insensitive",
      }
    }

    // Education filter
    if (education && typeof education === "string") {
      userWhereConditions.education = {
        contains: education,
        mode: "insensitive",
      }
    }

    // Age filter (calculated from birthdate)
    if (minAge || maxAge) {
      const today = new Date()
      const ageConditions: any = {}

      if (maxAge && typeof maxAge === "string") {
        const minBirthDate = new Date(
          today.getFullYear() - Number.parseInt(maxAge) - 1,
          today.getMonth(),
          today.getDate(),
        )
        ageConditions.gte = minBirthDate
      }

      if (minAge && typeof minAge === "string") {
        const maxBirthDate = new Date(today.getFullYear() - Number.parseInt(minAge), today.getMonth(), today.getDate())
        ageConditions.lte = maxBirthDate
      }

      if (Object.keys(ageConditions).length > 0) {
        userWhereConditions.birthdate = ageConditions
      }
    }

    // Salary expectation filter
    if (minSalary || maxSalary) {
      const salaryConditions: any = {}

      if (minSalary && typeof minSalary === "string") {
        salaryConditions.gte = Number.parseInt(minSalary)
      }

      if (maxSalary && typeof maxSalary === "string") {
        salaryConditions.lte = Number.parseInt(maxSalary)
      }

      if (Object.keys(salaryConditions).length > 0) {
        whereConditions.salary_expectation = salaryConditions
      }
    }

    // Add user conditions to main where clause
    if (Object.keys(userWhereConditions).length > 0) {
      whereConditions.user = userWhereConditions
    }

    // Pagination
    const pageNumber = Number.parseInt(page as string)
    const limitNumber = Number.parseInt(limit as string)
    const skip = (pageNumber - 1) * limitNumber

    // Get applications with user details
    const applications = await prisma.application.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            user_id: true,
            name: true,
            email: true,
            phone: true,
            gender: true,
            birthdate: true,
            education: true,
            address: true,
            profile_picture: true,
            created_at: true,
          },
        },
      },
      orderBy: {
        applied_at: "asc", // Earliest applications first
      },
      skip: skip,
      take: limitNumber,
    })

    // Get total count for pagination
    const totalApplications = await prisma.application.count({
      where: whereConditions,
    })

    // Calculate age for each applicant
    const applicantsWithAge = applications.map((application) => {
      let age = null
      if (application.user.birthdate) {
        const today = new Date()
        const birthDate = new Date(application.user.birthdate)
        age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
      }

      return {
        ...application,
        user: {
          ...application.user,
          age,
          profile_picture_url: application.user.profile_picture
            ? `/uploads/profiles/${application.user.profile_picture}`
            : null,
        },
      }
    })

    // Calculate pagination info
    const totalPages = Math.ceil(totalApplications / limitNumber)
    const hasNextPage = pageNumber < totalPages
    const hasPrevPage = pageNumber > 1

    res.status(200).json({
      message: "Applicants retrieved successfully",
      data: {
        applications: applicantsWithAge,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalItems: totalApplications,
          itemsPerPage: limitNumber,
          hasNextPage,
          hasPrevPage,
        },
        job: {
          job_id: job.job_id,
          title: job.title,
          company: job.company.name,
        },
      },
    })
  } catch (error) {
    console.error("Get job applicants error:", error)
    res.status(500).json({ message: "Server error while retrieving applicants" })
  }
}

/**
 * Get detailed information about a specific applicant
 */
export const getApplicantDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const { applicationId } = req.params

    if (!applicationId) {
      res.status(400).json({ message: "Application ID is required" })
      return
    }

    // Get application with full user details
    const application = await prisma.application.findUnique({
      where: { application_id: applicationId },
      include: {
        user: {
          select: {
            user_id: true,
            name: true,
            email: true,
            phone: true,
            gender: true,
            birthdate: true,
            education: true,
            address: true,
            profile_picture: true,
            longitude: true,
            latitude: true,
            created_at: true,
            updated_at: true,
          },
        },
        job: {
          include: {
            company: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!application) {
      res.status(404).json({ message: "Application not found" })
      return
    }

    // Check if user has permission to view this applicant
    if (req.user.role !== "admin" && application.job.company.user.user_id !== req.user.user_id) {
      res.status(403).json({ message: "Access denied. You can only view applicants for your own job posts." })
      return
    }

    // Calculate age
    let age = null
    if (application.user.birthdate) {
      const today = new Date()
      const birthDate = new Date(application.user.birthdate)
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }

    // Check if CV file exists
    const cvPath = path.join(process.cwd(), "uploads", "cvs", application.cv_file)
    const cvExists = fs.existsSync(cvPath)

    const applicantDetail = {
      application_id: application.application_id,
      salary_expectation: application.salary_expectation,
      status: application.status,
      applied_at: application.applied_at,
      cv_file: application.cv_file,
      cv_file_url: cvExists ? `/uploads/cvs/${application.cv_file}` : null,
      cv_exists: cvExists,
      user: {
        ...application.user,
        age,
        profile_picture_url: application.user.profile_picture
          ? `/uploads/profiles/${application.user.profile_picture}`
          : null,
      },
      job: {
        job_id: application.job.job_id,
        title: application.job.title,
        salary: application.job.salary,
        company: {
          company_id: application.job.company.company_id,
          name: application.job.company.name,
        },
      },
    }

    res.status(200).json({
      message: "Applicant detail retrieved successfully",
      data: applicantDetail,
    })
  } catch (error) {
    console.error("Get applicant detail error:", error)
    res.status(500).json({ message: "Server error while retrieving applicant detail" })
  }
}

/**
 * Update application status
 */
export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const { applicationId } = req.params
    const { status, notes } = req.body

    if (!applicationId) {
      res.status(400).json({ message: "Application ID is required" })
      return
    }

    if (!status) {
      res.status(400).json({ message: "Status is required" })
      return
    }

    // Validate status
    const validStatuses = ["pending", "reviewed", "interview", "accepted", "rejected"]
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        message: "Invalid status. Valid statuses are: pending, reviewed, interview, accepted, rejected",
      })
      return
    }

    // Get application with job details
    const application = await prisma.application.findUnique({
      where: { application_id: applicationId },
      include: {
        job: {
          include: {
            company: {
              include: {
                user: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!application) {
      res.status(404).json({ message: "Application not found" })
      return
    }

    // Check if user has permission to update this application
    if (req.user.role !== "admin" && application.job.company.user.user_id !== req.user.user_id) {
      res.status(403).json({ message: "Access denied. You can only update applications for your own job posts." })
      return
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { application_id: applicationId },
      data: {
        status: status,
        // You can add a notes field to the Application model if needed
      },
      include: {
        user: {
          select: {
            user_id: true,
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            job_id: true,
            title: true,
          },
        },
      },
    })

    // Log the status change (you can implement this later)
    console.log(`Application ${applicationId} status changed to ${status} by user ${req.user.user_id}`)

    res.status(200).json({
      message: "Application status updated successfully",
      data: {
        application_id: updatedApplication.application_id,
        status: updatedApplication.status,
        applicant: updatedApplication.user,
        job: updatedApplication.job,
      },
    })
  } catch (error) {
    console.error("Update application status error:", error)
    res.status(500).json({ message: "Server error while updating application status" })
  }
}

/**
 * Get application statistics for a job
 */
export const getApplicationStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const { jobId } = req.params

    if (!jobId) {
      res.status(400).json({ message: "Job ID is required" })
      return
    }

    // Check if job exists and user has permission
    const job = await prisma.job.findUnique({
      where: { job_id: jobId },
      include: {
        company: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!job) {
      res.status(404).json({ message: "Job not found" })
      return
    }

    if (req.user.role !== "admin" && job.company.user.user_id !== req.user.user_id) {
      res.status(403).json({ message: "Access denied" })
      return
    }

    // Get statistics
    const statistics = await prisma.application.groupBy({
      by: ["status"],
      where: {
        jobId: jobId,
      },
      _count: {
        status: true,
      },
    })

    // Get total applications
    const totalApplications = await prisma.application.count({
      where: { jobId: jobId },
    })

    // Format statistics
    const statusCounts = {
      pending: 0,
      reviewed: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
      total: totalApplications,
    }

    statistics.forEach((stat) => {
      if (stat.status in statusCounts) {
        statusCounts[stat.status as keyof typeof statusCounts] = stat._count.status
      }
    })

    res.status(200).json({
      message: "Application statistics retrieved successfully",
      data: {
        job: {
          job_id: job.job_id,
          title: job.title,
          company: job.company.name,
        },
        statistics: statusCounts,
      },
    })
  } catch (error) {
    console.error("Get application statistics error:", error)
    res.status(500).json({ message: "Server error while retrieving statistics" })
  }
}

/**
 * Download CV file
 */
export const downloadCV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const { applicationId } = req.params

    if (!applicationId) {
      res.status(400).json({ message: "Application ID is required" })
      return
    }

    // Get application with job details
    const application = await prisma.application.findUnique({
      where: { application_id: applicationId },
      include: {
        job: {
          include: {
            company: {
              include: {
                user: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!application) {
      res.status(404).json({ message: "Application not found" })
      return
    }

    // Check permission
    if (req.user.role !== "admin" && application.job.company.user.user_id !== req.user.user_id) {
      res.status(403).json({ message: "Access denied" })
      return
    }

    // Check if CV file exists
    const cvPath = path.join(process.cwd(), "uploads", "cvs", application.cv_file)

    if (!fs.existsSync(cvPath)) {
      res.status(404).json({ message: "CV file not found" })
      return
    }

    // Set appropriate headers for file download
    const fileName = `CV_${application.user.name}_${application.application_id}${path.extname(application.cv_file)}`

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
    res.setHeader("Content-Type", "application/octet-stream")

    // Stream the file
    const fileStream = fs.createReadStream(cvPath)
    fileStream.pipe(res)
  } catch (error) {
    console.error("Download CV error:", error)
    res.status(500).json({ message: "Server error while downloading CV" })
  }
}

/**
 * Bulk update application statuses
 */
export const bulkUpdateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" })
      return
    }

    const { applicationIds, status } = req.body

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      res.status(400).json({ message: "Application IDs array is required" })
      return
    }

    if (!status) {
      res.status(400).json({ message: "Status is required" })
      return
    }

    // Validate status
    const validStatuses = ["pending", "reviewed", "interview", "accepted", "rejected"]
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        message: "Invalid status. Valid statuses are: pending, reviewed, interview, accepted, rejected",
      })
      return
    }

    // Get applications to verify permissions
    const applications = await prisma.application.findMany({
      where: {
        application_id: {
          in: applicationIds,
        },
      },
      include: {
        job: {
          include: {
            company: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (applications.length === 0) {
      res.status(404).json({ message: "No applications found" })
      return
    }

    // Check permissions for all applications
    const unauthorizedApplications = applications.filter(
      (app) => req.user!.role !== "admin" && app.job.company.user.user_id !== req.user!.user_id,
    )

    if (unauthorizedApplications.length > 0) {
      res.status(403).json({ message: "Access denied for some applications" })
      return
    }

    // Update all applications
    const updateResult = await prisma.application.updateMany({
      where: {
        application_id: {
          in: applicationIds,
        },
      },
      data: {
        status: status,
      },
    })

    res.status(200).json({
      message: "Application statuses updated successfully",
      data: {
        updatedCount: updateResult.count,
        status: status,
      },
    })
  } catch (error) {
    console.error("Bulk update application status error:", error)
    res.status(500).json({ message: "Server error while updating application statuses" })
  }
}
