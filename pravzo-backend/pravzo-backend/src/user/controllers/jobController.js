const logger = require("../../../src/utils/logger");
const JobRepository = require("../repositories/JobRepository");

exports.getAvailableJobs = async (req, res) => {
  try {
    const jobs = await JobRepository.findAvailable();

    return res.status(200).json({
      success: true,
      message: "Available jobs fetched successfully",
      data: jobs,
    });
  } catch (error) {
    logger.error("Get Available Jobs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available jobs",
    });
  }
};

exports.acceptJob = async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);
    const userId = Number(req.user.id);

    if (!Number.isInteger(jobId) || !Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid job id is required",
      });
    }

    const success = await JobRepository.acceptJob(jobId, userId);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Job not available or already assigned",
      });
    }

    const updatedJob = await JobRepository.findById(jobId);

    return res.status(200).json({
      success: true,
      message: "Job accepted successfully",
      data: updatedJob,
    });
  } catch (error) {
    logger.error("Accept Job Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept job",
    });
  }
};

exports.getUserJobs = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user id is required",
      });
    }

    const jobs = await JobRepository.findByUserId(userId);

    return res.status(200).json({
      success: true,
      message: "User jobs fetched successfully",
      data: jobs,
    });
  } catch (error) {
    logger.error("Get User Jobs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user jobs",
    });
  }
};

exports.completeJob = async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);
    const userId = Number(req.user.id);

    if (!Number.isInteger(jobId) || !Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid job id is required",
      });
    }

    const success = await JobRepository.completeJob(jobId, userId);

    if (!success) {
      return res.status(400).json({
        success: false,
        message:
          "Job not found, not assigned to this rider, or already completed",
      });
    }

    const updatedJob = await JobRepository.findById(jobId);

    return res.status(200).json({
      success: true,
      message: "Job completed successfully",
      data: updatedJob,
    });
  } catch (error) {
    logger.error("Complete Job Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete job",
    });
  }
};

// GET /api/jobs/:jobId — single job by ID
exports.getJobById = async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return res.status(400).json({ success: false, message: "Valid job id is required" });
    }

    const job = await JobRepository.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({ success: true, data: job });
  } catch (error) {
    logger.error("Get Job By Id Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch job" });
  }
};

// POST /api/jobs/:jobId/reject — rider rejects a job
exports.rejectJob = async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);
    const userId = Number(req.user.id);
    const { reason } = req.body;

    if (!Number.isInteger(jobId) || jobId <= 0) {
      return res.status(400).json({ success: false, message: "Valid job id is required" });
    }

    const job = await JobRepository.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (!["AVAILABLE", "PENDING", "ASSIGNED"].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a job with status: ${job.status}`,
      });
    }

    const db = require("../../../src/config/db");

    // Log the rejection in job_rejections if table exists
    await db.query(
      `INSERT INTO job_rejections (job_id, rider_id, reason, created_at)
       VALUES (?, ?, ?, NOW())`,
      [jobId, userId, reason || null]
    ).catch(() => {}); // table may not exist — silent

    // If this rider had the job assigned, release it back to AVAILABLE
    await db.query(
      `UPDATE jobs
       SET status = 'AVAILABLE', assigned_rider_id = NULL, updated_at = NOW()
       WHERE job_id = ? AND (assigned_rider_id = ? OR assigned_rider_id IS NULL)
         AND status NOT IN ('COMPLETED', 'CANCELLED')`,
      [jobId, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Job rejected successfully",
      data: { job_id: jobId },
    });
  } catch (error) {
    logger.error("Reject Job Error:", error);
    return res.status(500).json({ success: false, message: "Failed to reject job" });
  }
};
