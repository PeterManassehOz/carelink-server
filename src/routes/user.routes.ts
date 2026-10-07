import { Router } from "express";

import {
  changePassword,
  getProfile,
  updateProfile,
} from "../controllers/user.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/me",
  getProfile,
);

router.patch(
  "/me",
  updateProfile,
);

router.patch(
  "/me/password",
  changePassword,
);

export default router;