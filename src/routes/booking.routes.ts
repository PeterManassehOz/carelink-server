import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";

import {
  cancelBooking,
  createBooking,
  getBookingById,
  getBookings,
} from "../controllers/booking.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  getBookings,
);

router.get(
  "/:id",
  authenticate,
  getBookingById,
);

router.post(
  "/",
  authenticate,
  createBooking,
);

router.patch(
  "/:id/cancel",
  authenticate,
  cancelBooking,
);

export default router;