import {
  Schema,
  model,
  models,
  type Model,
  type Types,
} from "mongoose";

export const HEALTH_RECORD_CATEGORIES = [
  "Lab Results",
  "Prescriptions",
  "Reports",
  "Imaging",
] as const;

export type HealthRecordCategory =
  (typeof HEALTH_RECORD_CATEGORIES)[number];

export interface IHealthRecord {
  user: Types.ObjectId;
  clientRecordId?: string;
  title: string;
  subtitle: string;
  category: HealthRecordCategory;
  date: string;
  initials: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const healthRecordSchema = new Schema<IHealthRecord>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    clientRecordId: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    category: {
      type: String,
      required: true,
      enum: HEALTH_RECORD_CATEGORIES,
    },

    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    initials: {
      type: String,
      default: "",
      trim: true,
      maxlength: 10,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 10000,
    },
  },
  {
    timestamps: true,
  },
);

healthRecordSchema.index(
  { user: 1, clientRecordId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientRecordId: { $type: "string" },
    },
  },
);

export const HealthRecord =
  (models.HealthRecord as Model<IHealthRecord> | undefined) ??
  model<IHealthRecord>("HealthRecord", healthRecordSchema);
