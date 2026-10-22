
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { Types } from "mongoose";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";

import { getCloudinary } from "../config/cloudinary.js";
import { HealthRecord } from "../models/HealthRecord.js";
import {
  HealthRecordAttachment,
  type AttachmentType,
  type CloudinaryResourceType,
} from "../models/HealthRecordAttachment.js";
import {
  AttachmentValidationError,
  validateAttachment,
} from "../utils/attachmentValidation.js";

interface UploadInput {
  userId: string;
  recordId: string;
  originalName: string;
  buffer: Buffer;
  durationMs?: number;
}

function assertValidIds(userId: string, recordId: string): void {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  if (!Types.ObjectId.isValid(recordId)) {
    throw new Error("INVALID_RECORD_ID");
  }
}

function sanitizeOriginalName(filename: string): string {
  const basename = filename.replace(/\\/g, "/").split("/").pop() ?? "";
  const sanitized = basename
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();

  if (!sanitized || sanitized.length > 255) {
    throw new Error("INVALID_ATTACHMENT_NAME");
  }

  return sanitized;
}

function uploadToCloudinary(
  buffer: Buffer,
  options: UploadApiOptions,
): Promise<UploadApiResponse> {
  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("CLOUDINARY_UPLOAD_EMPTY_RESULT"));
          return;
        }

        resolve(result);
      },
    );

    Readable.from(buffer).pipe(stream);
  });
}

async function destroyCloudinaryAsset(
  publicId: string,
  resourceType: CloudinaryResourceType,
): Promise<void> {
  const cloudinary = getCloudinary();

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    invalidate: true,
  });

  if (
    result.result !== "ok" &&
    result.result !== "not found"
  ) {
    throw new Error("CLOUDINARY_ASSET_CLEANUP_FAILED");
  }
}

export async function uploadHealthRecordAttachment(
  input: UploadInput,
) {
  const {
    userId,
    recordId,
    buffer,
    durationMs,
  } = input;

  assertValidIds(userId, recordId);

  // Check ownership before uploading anything to Cloudinary.
  const record = await HealthRecord.findOne({
    _id: recordId,
    user: userId,
  }).select("_id");

  if (!record) {
    throw new Error("HEALTH_RECORD_NOT_FOUND");
  }

  const originalName = sanitizeOriginalName(input.originalName);

  if (
    durationMs !== undefined &&
    (
      !Number.isFinite(durationMs) ||
      durationMs < 0 ||
      durationMs > 24 * 60 * 60 * 1000
    )
  ) {
    throw new Error("INVALID_ATTACHMENT_DURATION");
  }

  const validated = await validateAttachment(originalName, buffer);

  // Avoid storing an arbitrary client-provided duration for non-audio files.
  if (durationMs !== undefined && validated.type !== "audio") {
    throw new Error("DURATION_ONLY_ALLOWED_FOR_AUDIO");
  }

  const publicId = [
    "medivault",
    "users",
    userId,
    "records",
    recordId,
    randomUUID(),
  ].join("/");

  const options: UploadApiOptions = {
    public_id: publicId,
    resource_type: validated.resourceType,
    type: "authenticated",
    overwrite: false,
    invalidate: true,
    use_filename: false,
    unique_filename: false,
    tags: ["medivault", `attachment-${validated.type}`],
    context: {
      original_name: originalName,
      record_id: recordId,
    },
  };

  let uploaded: UploadApiResponse | undefined;

  try {
    uploaded = await uploadToCloudinary(buffer, options);

    const attachment = await HealthRecordAttachment.create({
      user: userId,
      healthRecord: recordId,
      type: validated.type satisfies AttachmentType,
      originalName,
      mimeType: validated.mimeType,
      format: validated.format,
      size: validated.size,
      publicId: uploaded.public_id,
      resourceType: validated.resourceType satisfies CloudinaryResourceType,
      deliveryType: "authenticated",
      ...(durationMs !== undefined ? { durationMs } : {}),
    });

    // Do not return Cloudinary URLs or credentials to the client.
    return attachment;
  } catch (error) {
    if (uploaded?.public_id) {
      try {
        await destroyCloudinaryAsset(
          uploaded.public_id,
          validated.resourceType,
        );
      } catch (cleanupError) {
        // Keep the original error, but log enough to investigate an orphaned asset.
        console.error("Failed to clean up Cloudinary asset:", {
          publicId: uploaded.public_id,
          cleanupError,
        });
      }
    }

    if (error instanceof AttachmentValidationError) {
      throw error;
    }

    throw error;
  }
}


export async function getHealthRecordAttachments(
  userId: string,
  recordId: string,
) {
  assertValidIds(userId, recordId);

  // Confirm that this health record belongs to the authenticated user.
  const record = await HealthRecord.findOne({
    _id: recordId,
    user: userId,
  }).select("_id");

  if (!record) {
    throw new Error("HEALTH_RECORD_NOT_FOUND");
  }

  const attachments = await HealthRecordAttachment.find({
    user: userId,
    healthRecord: recordId,
  })
    .sort({ createdAt: -1 })
    .select(
      "_id healthRecord type originalName mimeType format size durationMs createdAt updatedAt",
    )
    .lean();

  return attachments;
}

export async function deleteHealthRecordAttachment(
  userId: string,
  recordId: string,
  attachmentId: string,
): Promise<void> {
  assertValidIds(userId, recordId);

  if (!Types.ObjectId.isValid(attachmentId)) {
    throw new Error("INVALID_ATTACHMENT_ID");
  }

  // Confirm ownership of the parent health record.
  const record = await HealthRecord.findOne({
    _id: recordId,
    user: userId,
  }).select("_id");

  if (!record) {
    throw new Error("HEALTH_RECORD_NOT_FOUND");
  }

  // Find the attachment only within this user's health record.
  const attachment = await HealthRecordAttachment.findOne({
    _id: attachmentId,
    user: userId,
    healthRecord: recordId,
  });

  if (!attachment) {
    throw new Error("HEALTH_RECORD_ATTACHMENT_NOT_FOUND");
  }

  // Remove the stored asset before removing its database metadata.
  await destroyCloudinaryAsset(
    attachment.publicId,
    attachment.resourceType,
  );

  await HealthRecordAttachment.deleteOne({
    _id: attachment._id,
    user: userId,
    healthRecord: recordId,
  });
}


export async function getHealthRecordAttachmentAccess(
  userId: string,
  recordId: string,
  attachmentId: string,
): Promise<{
  url: string;
  expiresAt: string;
}> {
  assertValidIds(userId, recordId);

  if (!Types.ObjectId.isValid(attachmentId)) {
    throw new Error("INVALID_ATTACHMENT_ID");
  }

  // Verify ownership of the parent record.
  const record = await HealthRecord.findOne({
    _id: recordId,
    user: userId,
  }).select("_id");

  if (!record) {
    throw new Error("HEALTH_RECORD_NOT_FOUND");
  }

  // Verify the attachment belongs to this user and record.
  const attachment = await HealthRecordAttachment.findOne({
    _id: attachmentId,
    user: userId,
    healthRecord: recordId,
  }).select(
    "publicId resourceType deliveryType format",
  );

  if (!attachment) {
    throw new Error("HEALTH_RECORD_ATTACHMENT_NOT_FOUND");
  }

  if (attachment.deliveryType !== "authenticated") {
    throw new Error("INVALID_ATTACHMENT_DELIVERY_TYPE");
  }

  const expiresAtSeconds =
    Math.floor(Date.now() / 1000) + 5 * 60;

  const cloudinary = getCloudinary();

  const url = cloudinary.utils.private_download_url(
    attachment.publicId,
    attachment.format,
    {
      resource_type: attachment.resourceType,
      type: "authenticated",
      expires_at: expiresAtSeconds,
    },
  );

  return {
    url,
    expiresAt: new Date(
      expiresAtSeconds * 1000,
    ).toISOString(),
  };
}
