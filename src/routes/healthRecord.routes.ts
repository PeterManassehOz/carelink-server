
import { Router } from "express";

import {
  createRecord,
  deleteRecord,
  getRecord,
  getRecords,
  updateRecord,
} from "../controllers/healthRecord.controller.js";

import {
  deleteHealthRecordAttachmentController,
  getHealthRecordAttachmentsController,
  uploadHealthRecordAttachment,
  getHealthRecordAttachmentAccessController,
} from "../controllers/healthRecordAttachment.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  uploadHealthRecordAttachment as uploadAttachmentMiddleware,
} from "../middleware/healthRecordUpload.middleware.js";

const router = Router();

router.use(authenticate);

// Health record CRUD
router.post("/", createRecord);
router.get("/", getRecords);

// Health record attachments
router.post(
  "/:recordId/attachments",
  uploadAttachmentMiddleware,
  uploadHealthRecordAttachment,
);

router.get(
  "/:recordId/attachments",
  getHealthRecordAttachmentsController,
);

router.delete(
  "/:recordId/attachments/:attachmentId",
  deleteHealthRecordAttachmentController,
);

router.get(
  "/:recordId/attachments/:attachmentId/access",
  getHealthRecordAttachmentAccessController,
);

// Keep general record routes after the attachment routes.
router.get("/:id", getRecord);
router.patch("/:id", updateRecord);
router.delete("/:id", deleteRecord);

export default router;
