import { Router } from "express";

import authRoutes from "./auth.routes.js";
import providerRoutes from "./provider.routes.js";
import bookingRoutes from "./booking.routes.js";
import userRoutes from "./user.routes.js";
import healthRecordRoutes from "./healthRecord.routes.js";

const router = Router();

router.use(
  "/auth",
  authRoutes,
);

router.use(
  "/providers",
  providerRoutes,
);

router.use(
  "/appointments",
  bookingRoutes,
);

router.use(
  "/users",
  userRoutes,
);

router.use(
  "/health-records",
  healthRecordRoutes,
);

export default router;