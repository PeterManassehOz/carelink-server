import {
  isObjectIdOrHexString,
} from "mongoose";

import { Appointment } from "../models/Appointment.js";
import { Provider } from "../models/Provider.js";

export interface CreateAppointmentInput {
  userId: string;
  providerId: string;
  date: string;
  time: string;
}

function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTimeFormat(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time);
}

function isTimeWithinAvailability(
  requestedTime: string,
  startTime: string,
  endTime: string,
): boolean {
  return (
    requestedTime >= startTime &&
    requestedTime < endTime
  );
}

function serializeAppointment(
  appointment: any,
) {
  const provider =
    appointment.provider &&
    typeof appointment.provider === "object"
      ? {
          id: appointment.provider._id.toString(),
          name: appointment.provider.name,
          specialty: appointment.provider.specialty,
          description: appointment.provider.description,
          location: appointment.provider.location,
          phone: appointment.provider.phone,
          email: appointment.provider.email,
          image: appointment.provider.image,
          availability:
            appointment.provider.availability,
        }
      : undefined;

  return {
    id: appointment._id.toString(),
    provider,
    date: appointment.date,
    time: appointment.time,
    status: appointment.status,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
}

export async function createAppointment(
  input: CreateAppointmentInput,
) {
  const {
    userId,
    providerId,
    date,
    time,
  } = input;

  if (!isObjectIdOrHexString(providerId)) {
    throw new Error("INVALID_PROVIDER_ID");
  }

  if (!isObjectIdOrHexString(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  if (!isValidDateFormat(date)) {
    throw new Error("INVALID_DATE");
  }

  if (!isValidTimeFormat(time)) {
    throw new Error("INVALID_TIME");
  }

  const provider = await Provider.findById(
    providerId,
  );

  if (!provider) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  const requestedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(requestedDate.getTime())) {
    throw new Error("INVALID_DATE");
  }

  const dayName = requestedDate.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    },
  );

  const availability = provider.availability.find(
    (slot) => slot.day === dayName,
  );

  if (!availability) {
    throw new Error(
      "PROVIDER_NOT_AVAILABLE_ON_DATE",
    );
  }

  const withinAvailability =
    isTimeWithinAvailability(
      time,
      availability.startTime,
      availability.endTime,
    );

  if (!withinAvailability) {
    throw new Error(
      "TIME_OUTSIDE_PROVIDER_AVAILABILITY",
    );
  }

  const existingAppointment =
    await Appointment.findOne({
      provider: providerId,
      date,
      time,
      status: "booked",
    });

  if (existingAppointment) {
    throw new Error("TIME_SLOT_ALREADY_BOOKED");
  }

  const appointment = await Appointment.create({
    user: userId,
    provider: providerId,
    date,
    time,
    status: "booked",
  });

  const createdAppointment =
    await Appointment.findById(appointment._id).populate(
      "provider",
    );

  if (!createdAppointment) {
    throw new Error("APPOINTMENT_NOT_FOUND");
  }

  return serializeAppointment(createdAppointment);
}

export async function getUserAppointments(
  userId: string,
) {
  if (!isObjectIdOrHexString(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const appointments =
    await Appointment.find({
      user: userId,
    })
      .populate("provider")
      .sort({
        date: 1,
        time: 1,
      });

  return appointments.map(serializeAppointment);
}

export async function getUserAppointmentById(
  userId: string,
  appointmentId: string,
) {
  if (!isObjectIdOrHexString(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  if (!isObjectIdOrHexString(appointmentId)) {
    throw new Error("INVALID_APPOINTMENT_ID");
  }

  const appointment =
    await Appointment.findOne({
      _id: appointmentId,
      user: userId,
    }).populate("provider");

  if (!appointment) {
    throw new Error("APPOINTMENT_NOT_FOUND");
  }

  return serializeAppointment(appointment);
}

export async function cancelAppointment(
  userId: string,
  appointmentId: string,
) {
  if (!isObjectIdOrHexString(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  if (!isObjectIdOrHexString(appointmentId)) {
    throw new Error("INVALID_APPOINTMENT_ID");
  }

  const appointment =
    await Appointment.findOne({
      _id: appointmentId,
      user: userId,
    });

  if (!appointment) {
    throw new Error("APPOINTMENT_NOT_FOUND");
  }

  if (appointment.status === "cancelled") {
    throw new Error("APPOINTMENT_ALREADY_CANCELLED");
  }

  appointment.status = "cancelled";

  await appointment.save();

  const updatedAppointment =
    await Appointment.findById(
      appointment._id,
    ).populate("provider");

  return serializeAppointment(
    updatedAppointment,
  );
}