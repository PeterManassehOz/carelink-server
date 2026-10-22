import {
  Schema,
  model,
  models,
  type Model,
  type Types,
} from "mongoose";

export const ATTACHMENT_TYPES = [
  "image",
  "document",
  "audio",
] as const;

export type AttachmentType =
  (typeof ATTACHMENT_TYPES)[number];

export const CLOUDINARY_RESOURCE_TYPES = [
  "image",
  "video",
  "raw",
] as const;

export type CloudinaryResourceType =
  (typeof CLOUDINARY_RESOURCE_TYPES)[number];

export interface IHealthRecordAttachment {
  user: Types.ObjectId;
  healthRecord: Types.ObjectId;

  type: AttachmentType;

  originalName: string;
  mimeType: string;
  format: string;
  size: number;

  publicId: string;
  resourceType: CloudinaryResourceType;
  deliveryType: "authenticated";

  durationMs?: number;

  createdAt: Date;
  updatedAt: Date;
}

const healthRecordAttachmentSchema =
  new Schema<IHealthRecordAttachment>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      healthRecord: {
        type: Schema.Types.ObjectId,
        ref: "HealthRecord",
        required: true,
        index: true,
      },

      type: {
        type: String,
        enum: ATTACHMENT_TYPES,
        required: true,
      },

      originalName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255,
      },

      mimeType: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 150,
      },

      format: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 30,
      },

      size: {
        type: Number,
        required: true,
        min: 1,
      },

      publicId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },

      resourceType: {
        type: String,
        enum: CLOUDINARY_RESOURCE_TYPES,
        required: true,
      },

      deliveryType: {
        type: String,
        enum: ["authenticated"],
        default: "authenticated",
        required: true,
      },

      durationMs: {
        type: Number,
        min: 0,
      },
    },
    {
      timestamps: true,
    },
  );

healthRecordAttachmentSchema.index({
  user: 1,
  healthRecord: 1,
  createdAt: -1,
});

export const HealthRecordAttachment =
  (models.HealthRecordAttachment as
    | Model<IHealthRecordAttachment>
    | undefined) ??
  model<IHealthRecordAttachment>(
    "HealthRecordAttachment",
    healthRecordAttachmentSchema,
  );
