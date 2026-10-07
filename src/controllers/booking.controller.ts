import type {
  Request,
  Response,
} from "express";

import {
  cancelAppointment,
  createAppointment,
  getUserAppointmentById,
  getUserAppointments,
} from "../services/booking.service.js";

export async function createBooking(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const {
      providerId,
      date,
      time,
    } = req.body;

    if (
      typeof providerId !== "string" ||
      typeof date !== "string" ||
      typeof time !== "string"
    ) {
      res.status(400).json({
        success: false,
        message:
          "providerId, date and time are required",
      });

      return;
    }

    const appointment =
      await createAppointment({
        userId: req.user._id.toString(),
        providerId,
        date,
        time,
      });

    res.status(201).json({
      success: true,
      data: {
        appointment,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_PROVIDER_ID"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_USER_ID"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_DATE"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid date. Expected YYYY-MM-DD",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_TIME"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid time. Expected HH:MM",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message === "PROVIDER_NOT_FOUND"
    ) {
      res.status(404).json({
        success: false,
        message: "Provider not found",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "PROVIDER_NOT_AVAILABLE_ON_DATE"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Provider is not available on this date",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "TIME_OUTSIDE_PROVIDER_AVAILABILITY"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Selected time is outside provider availability",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "TIME_SLOT_ALREADY_BOOKED"
    ) {
      res.status(409).json({
        success: false,
        message:
          "This time slot is already booked",
      });

      return;
    }

    console.error(
      "Create appointment error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the appointment",
    });
  }
}

export async function getBookings(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const appointments =
      await getUserAppointments(
        req.user._id.toString(),
      );

    res.status(200).json({
      success: true,
      data: {
        appointments,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_USER_ID"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });

      return;
    }

    console.error(
      "Get appointments error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while retrieving appointments",
    });
  }
}

export async function getBookingById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });

      return;
    }

    const appointment =
      await getUserAppointmentById(
        req.user._id.toString(),
        id,
      );

    res.status(200).json({
      success: true,
      data: {
        appointment,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_USER_ID"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_APPOINTMENT_ID"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message === "APPOINTMENT_NOT_FOUND"
    ) {
      res.status(404).json({
        success: false,
        message: "Appointment not found",
      });

      return;
    }

    console.error(
      "Get appointment error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while retrieving the appointment",
    });
  }
}

export async function cancelBooking(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });

      return;
    }

    const appointment =
      await cancelAppointment(
        req.user._id.toString(),
        id,
      );

    res.status(200).json({
      success: true,
      data: {
        appointment,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_USER_ID"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_APPOINTMENT_ID"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message === "APPOINTMENT_NOT_FOUND"
    ) {
      res.status(404).json({
        success: false,
        message: "Appointment not found",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "APPOINTMENT_ALREADY_CANCELLED"
    ) {
      res.status(409).json({
        success: false,
        message:
          "Appointment has already been cancelled",
      });

      return;
    }

    console.error(
      "Cancel appointment error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while cancelling the appointment",
    });
  }
}