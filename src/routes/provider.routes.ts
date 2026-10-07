import { Router } from "express";

import {
  getAllProviders,
  getSingleProvider,
} from "../controllers/provider.controller.js";

const router = Router();

router.get("/", getAllProviders);

router.get("/:id", getSingleProvider);

export default router;