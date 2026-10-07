import type {
  Request,
  Response,
} from "express";

import {
  changeUserPassword,
  getUserProfile,
  updateUserProfile,
} from "../services/user.service.js";

export async function getProfile(
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

    const user =
      await getUserProfile(
        req.user._id.toString(),
      );

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "USER_NOT_FOUND"
    ) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    console.error(
      "Get profile error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while retrieving your profile",
    });
  }
}

export async function updateProfile(
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
      name,
      email,
      phone,
    } = req.body;

    if (
      name === undefined &&
      email === undefined &&
      phone === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "At least one profile field is required",
      });

      return;
    }

    const user =
      await updateUserProfile(
        req.user._id.toString(),
        {
          name,
          email,
          phone,
        },
      );

    res.status(200).json({
      success: true,
      message:
        "Profile updated successfully",
      data: {
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          createdAt: user?.createdAt,
          updatedAt: user?.updatedAt,
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "USER_NOT_FOUND"
    ) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "EMAIL_ALREADY_EXISTS"
    ) {
      res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVALID_NAME"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Name must be between 2 and 100 characters",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVALID_EMAIL"
    ) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });

      return;
    }

    console.error(
      "Update profile error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating your profile",
    });
  }
}

export async function changePassword(
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
      currentPassword,
      newPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      res.status(400).json({
        success: false,
        message:
          "Current password and new password are required",
      });

      return;
    }

    await changeUserPassword(
      req.user._id.toString(),
      {
        currentPassword,
        newPassword,
      },
    );

    res.status(200).json({
      success: true,
      message:
        "Password changed successfully",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "USER_NOT_FOUND"
    ) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVALID_CURRENT_PASSWORD"
    ) {
      res.status(401).json({
        success: false,
        message:
          "Current password is incorrect",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "PASSWORD_TOO_SHORT"
    ) {
      res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters",
      });

      return;
    }

    console.error(
      "Change password error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while changing your password",
    });
  }
}