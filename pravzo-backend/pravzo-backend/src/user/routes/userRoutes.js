const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const cacheProfile = require("../middleware/cacheProfile");
const authMiddleware = require("../middleware/authMiddleware");
const ownerMiddleware = require("../middleware/ownerMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  updateMobileValidator,
  verifyMobileValidator,
  updateEmailValidator,
  verifyEmailValidator,
} = require("../validators/userValidator");

const { upload, processCloudUploads } = require("../../../src/middleware/uploadMiddleware");

// ── STATIC ROUTES (no /:id param — MUST be before /:id) ───────────────────

router.post(
  "/kyc",
  authMiddleware,
  upload.any(),
  processCloudUploads(),
  userController.submitKyc
);

router.get("/kyc", authMiddleware, userController.getMyKyc);

// ── PROFILE ────────────────────────────────────────────────────────────────

router.get(
  "/:id",
  authMiddleware,
  ownerMiddleware("id"),
  cacheProfile,
  userController.getMyProfile
);

router.put(
  "/:id",
  authMiddleware,
  ownerMiddleware("id"),
  upload.any(),
  processCloudUploads(),
  userController.updateMyProfile
);

router.delete(
  "/:id",
  authMiddleware,
  ownerMiddleware("id", { allowAdmin: false }),
  userController.deleteMyProfile
);

// ── MOBILE UPDATE (2-step OTP) ─────────────────────────────────────────────

router.post(
  "/:id/mobile",
  authMiddleware,
  ownerMiddleware("id"),
  updateMobileValidator,
  validateRequest,
  userController.updateMyMobile
);

router.put(
  "/:id/mobile/verify",
  authMiddleware,
  ownerMiddleware("id"),
  verifyMobileValidator,
  validateRequest,
  userController.verifyAndUpdateMobile
);

// ── EMAIL UPDATE (2-step OTP) ──────────────────────────────────────────────

router.post(
  "/:id/email",
  authMiddleware,
  ownerMiddleware("id"),
  updateEmailValidator,
  validateRequest,
  userController.updateMyEmail
);

router.put(
  "/:id/email/verify",
  authMiddleware,
  ownerMiddleware("id"),
  verifyEmailValidator,
  validateRequest,
  userController.verifyAndUpdateEmail
);

// ── BANK DETAILS ───────────────────────────────────────────────────────────

router.get(
  "/:id/bank-details",
  authMiddleware,
  ownerMiddleware("id"),
  userController.getMyBankDetails
);

router.put(
  "/:id/bank-details",
  authMiddleware,
  ownerMiddleware("id"),
  userController.updateMyBankDetails
);

// ── KYC ───────────────────────────────────────────────────────────────────

router.post(
  "/:id/kyc",
  authMiddleware,
  ownerMiddleware("id"),
  upload.any(),
  processCloudUploads(),
  userController.submitKyc
);

router.get(
  "/:id/kyc",
  authMiddleware,
  ownerMiddleware("id"),
  userController.getMyKyc
);

// ── DOCUMENTS ─────────────────────────────────────────────────────────────

router.get(
  "/:id/documents",
  authMiddleware,
  ownerMiddleware("id"),
  userController.getUserDocuments
);

router.post(
  "/:id/documents",
  authMiddleware,
  ownerMiddleware("id"),
  upload.any(),
  processCloudUploads(),
  userController.uploadUserDocument
);

// ── PREFERENCES ───────────────────────────────────────────────────────────

router.get(
  "/:id/preferences",
  authMiddleware,
  ownerMiddleware("id"),
  userController.getPreferences
);

router.put(
  "/:id/preferences",
  authMiddleware,
  ownerMiddleware("id"),
  userController.updatePreferences
);

// ── EMERGENCY CONTACTS ────────────────────────────────────────────────────

router.get(
  "/:id/emergency-contacts",
  authMiddleware,
  ownerMiddleware("id"),
  userController.getEmergencyContacts
);

router.post(
  "/:id/emergency-contacts",
  authMiddleware,
  ownerMiddleware("id"),
  userController.addEmergencyContact
);

router.put(
  "/:id/emergency-contacts/:contactId",
  authMiddleware,
  ownerMiddleware("id"),
  userController.updateEmergencyContact
);

router.delete(
  "/:id/emergency-contacts/:contactId",
  authMiddleware,
  ownerMiddleware("id"),
  userController.deleteEmergencyContact
);

// ── WALLET (shortcut under /users/:id/wallet) ─────────────────────────────

router.get(
  "/:id/wallet",
  authMiddleware,
  ownerMiddleware("id"),
  userController.getUserWallet
);

module.exports = router;
