import { Schema, model, type Document } from "mongoose";

export interface IProvider extends Document {
  name: string;
  specialty: string;
  description: string;
  location: string;
  phone?: string;
  email?: string;
  image?: string;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const providerSchema = new Schema<IProvider>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    specialty: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    image: {
      type: String,
      trim: true,
    },

    availability: [
      {
        day: {
          type: String,
          required: true,
          trim: true,
        },

        startTime: {
          type: String,
          required: true,
          trim: true,
        },

        endTime: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const Provider = model<IProvider>(
  "Provider",
  providerSchema,
);