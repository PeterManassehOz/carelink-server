
import type {
  Request,
  Response,
} from "express";

import {
  deleteHealthRecordAttachment as deleteAttachment,
  getHealthRecordAttachments,
  getHealthRecordAttachmentAccess,
  uploadHealthRecordAttachment as uploadAttachment,
} from "../services/healthRecordAttachment.service.js";

import {
  AttachmentValidationError,
} from "../utils/attachmentValidation.js";

export async function uploadHealthRecordAttachment(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.user?._id.toString();
  const recordId = req.params.recordId;

  if (typeof recordId !== "string" || !recordId.trim()) {
    res.status(400).json({
      success: false,
      message: "A valid health record ID is required",
    });
    return;
  }

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication is required",
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'A file is required in the multipart field named "file"',
    });
    return;
  }

  let durationMs: number | undefined;

  if (req.body?.durationMs !== undefined) {
    durationMs = Number(req.body.durationMs);
  }

  try {
    const attachment = await uploadAttachment({
      userId,
      recordId,
      originalName: req.file.originalname,
      buffer: req.file.buffer,
      ...(durationMs !== undefined ? { durationMs } : {}),
    });

    res.status(201).json({
      success: true,
      message: "Attachment uploaded successfully",
      data: {
        id: attachment._id.toString(),
        healthRecord: attachment.healthRecord.toString(),
        type: attachment.type,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        format: attachment.format,
        size: attachment.size,
        ...(attachment.durationMs !== undefined
          ? { durationMs: attachment.durationMs }
          : {}),
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AttachmentValidationError) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    const errorCode =
      error instanceof Error ? error.message : "";

    const clientErrors: Record<string, { status: number; message: string }> = {
      INVALID_USER_ID: {
        status: 400,
        message: "Invalid user ID",
      },
      INVALID_RECORD_ID: {
        status: 400,
        message: "Invalid health record ID",
      },
      HEALTH_RECORD_NOT_FOUND: {
        status: 404,
        message: "Health record not found",
      },
      INVALID_ATTACHMENT_NAME: {
        status: 400,
        message: "The attachment filename is invalid",
      },
      INVALID_ATTACHMENT_DURATION: {
        status: 400,
        message: "The audio duration is invalid",
      },
      DURATION_ONLY_ALLOWED_FOR_AUDIO: {
        status: 400,
        message: "Duration can only be supplied for audio attachments",
      },
      CLOUDINARY_CONFIG_MISSING: {
        status: 500,
        message: "File storage is not configured correctly",
      },
    };

    const clientError = clientErrors[errorCode];

    if (clientError) {
      res.status(clientError.status).json({
        success: false,
        message: clientError.message,
      });
      return;
    }

    console.error("Health record attachment upload failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to upload the attachment",
    });
  }
}


export async function getHealthRecordAttachmentsController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.user?._id.toString();
  const recordId = req.params.recordId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication is required",
    });
    return;
  }

  if (typeof recordId !== "string" || !recordId.trim()) {
    res.status(400).json({
      success: false,
      message: "A valid health record ID is required",
    });
    return;
  }

  try {
    const attachments = await getHealthRecordAttachments(
      userId,
      recordId,
    );

    res.status(200).json({
      success: true,
      results: attachments.length,
      data: attachments.map((attachment) => ({
        id: attachment._id.toString(),
        healthRecord: attachment.healthRecord.toString(),
        type: attachment.type,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        format: attachment.format,
        size: attachment.size,
        ...(attachment.durationMs !== undefined
          ? { durationMs: attachment.durationMs }
          : {}),
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
      })),
    });
  } catch (error: unknown) {
    const errorCode =
      error instanceof Error ? error.message : "";

    if (errorCode === "INVALID_USER_ID" || errorCode === "INVALID_RECORD_ID") {
      res.status(400).json({
        success: false,
        message: "The supplied ID is invalid",
      });
      return;
    }

    if (errorCode === "HEALTH_RECORD_NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Health record not found",
      });
      return;
    }

    console.error("Failed to retrieve health record attachments:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve attachments",
    });
  }
}


export async function deleteHealthRecordAttachmentController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.user?._id.toString();
  const recordId = req.params.recordId;
  const attachmentId = req.params.attachmentId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication is required",
    });
    return;
  }

  if (typeof recordId !== "string" || !recordId.trim()) {
    res.status(400).json({
      success: false,
      message: "A valid health record ID is required",
    });
    return;
  }

  if (typeof attachmentId !== "string" || !attachmentId.trim()) {
    res.status(400).json({
      success: false,
      message: "A valid attachment ID is required",
    });
    return;
  }

  try {
    await deleteAttachment(userId, recordId, attachmentId);

    res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error: unknown) {
    const errorCode =
      error instanceof Error ? error.message : "";

    if (
      errorCode === "INVALID_USER_ID" ||
      errorCode === "INVALID_RECORD_ID" ||
      errorCode === "INVALID_ATTACHMENT_ID"
    ) {
      res.status(400).json({
        success: false,
        message: "One or more supplied IDs are invalid",
      });
      return;
    }

    if (
      errorCode === "HEALTH_RECORD_NOT_FOUND" ||
      errorCode === "HEALTH_RECORD_ATTACHMENT_NOT_FOUND"
    ) {
      res.status(404).json({
        success: false,
        message: "Health record or attachment not found",
      });
      return;
    }

    console.error("Failed to delete health record attachment:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete attachment",
    });
  }
}



export async function getHealthRecordAttachmentAccessController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.user?._id.toString();
  const recordId = req.params.recordId;
  const attachmentId = req.params.attachmentId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication is required",
    });
    return;
  }

  if (typeof recordId !== "string" || !recordId.trim()) {
    res.status(400).json({
      success: false,
      message: "A valid health record ID is required",
    });
    return;
  }

  if (
    typeof attachmentId !== "string" ||
    !attachmentId.trim()
  ) {
    res.status(400).json({
      success: false,
      message: "A valid attachment ID is required",
    });
    return;
  }

  try {
    const access = await getHealthRecordAttachmentAccess(
      userId,
      recordId,
      attachmentId,
    );

    res.status(200).json({
      success: true,
      message: "Temporary attachment access generated",
      data: access,
    });
  } catch (error: unknown) {
    const errorCode =
      error instanceof Error ? error.message : "";

    if (
      errorCode === "INVALID_USER_ID" ||
      errorCode === "INVALID_RECORD_ID" ||
      errorCode === "INVALID_ATTACHMENT_ID"
    ) {
      res.status(400).json({
        success: false,
        message: "One or more supplied IDs are invalid",
      });
      return;
    }

    if (
      errorCode === "HEALTH_RECORD_NOT_FOUND" ||
      errorCode === "HEALTH_RECORD_ATTACHMENT_NOT_FOUND"
    ) {
      res.status(404).json({
        success: false,
        message: "Health record or attachment not found",
      });
      return;
    }

    if (errorCode === "INVALID_ATTACHMENT_DELIVERY_TYPE") {
      res.status(409).json({
        success: false,
        message: "This attachment is not configured for private access",
      });
      return;
    }

    console.error(
      "Failed to generate attachment access:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Unable to generate attachment access",
    });
  }
}
