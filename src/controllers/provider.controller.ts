import type { Request, Response } from "express";

import {
  getProviderById,
  getProviders,
} from "../services/provider.service.js";

export async function getAllProviders(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      search,
      specialty,
      location,
    } = req.query;

    const providers = await getProviders({
      search:
        typeof search === "string"
          ? search
          : undefined,

      specialty:
        typeof specialty === "string"
          ? specialty
          : undefined,

      location:
        typeof location === "string"
          ? location
          : undefined,
    });

    res.status(200).json({
      success: true,
      data: {
        providers,
      },
    });
  } catch (error) {
    console.error("Get providers error:", error);

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while retrieving providers",
    });
  }
}

export async function getSingleProvider(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        success: false,
        message: "Provider ID is required",
      });

      return;
    }

    const provider = await getProviderById(id);

    res.status(200).json({
      success: true,
      data: {
        provider,
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
      error.message === "PROVIDER_NOT_FOUND"
    ) {
      res.status(404).json({
        success: false,
        message: "Provider not found",
      });

      return;
    }

    console.error("Get provider error:", error);

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while retrieving the provider",
    });
  }
}