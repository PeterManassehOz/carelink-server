import {
  Schema,
  model,
  type Document,
  type Types,
} from "mongoose";

export type AppointmentStatus =
  | "booked"
  | "cancelled";

export interface IAppointment extends Document {
  user: Types.ObjectId;
  provider: Types.ObjectId;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema =
  new Schema<IAppointment>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      provider: {
        type: Schema.Types.ObjectId,
        ref: "Provider",
        required: true,
      },

      date: {
        type: String,
        required: true,
        trim: true,
      },

      time: {
        type: String,
        required: true,
        trim: true,
      },

      status: {
        type: String,
        enum: ["booked", "cancelled"],
        default: "booked",
        required: true,
      },
    },
    {
      timestamps: true,
    },
  );

export const Appointment = model<IAppointment>(
  "Appointment",
  appointmentSchema,
);