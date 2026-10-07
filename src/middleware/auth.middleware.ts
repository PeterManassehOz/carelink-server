import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

import { getAuthenticatedUser } from "../services/auth.service.js";

interface JwtPayload {
  userId: string;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication format",
      });

      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: "JWT configuration is missing",
      });

      return;
    }

    const decoded = jwt.verify(
      token,
      jwtSecret,
    ) as JwtPayload;

    const user = await getAuthenticatedUser(
      decoded.userId,
    );

    req.user = user;

    next();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "USER_NOT_FOUND"
    ) {
      res.status(401).json({
        success: false,
        message: "User no longer exists",
      });

      return;
    }

    console.error("Authentication error:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}