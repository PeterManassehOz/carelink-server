import bcrypt from "bcryptjs";

import { User } from "../models/User.js";

export interface UpdateUserProfileInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function getUserProfile(
  userId: string,
) {
  const user = await User.findById(userId).select(
    "-passwordHash",
  );

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
}

export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput,
) {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (input.name !== undefined) {
    const name = input.name.trim();

    if (!name) {
      throw new Error("INVALID_NAME");
    }

    if (name.length < 2) {
      throw new Error("INVALID_NAME");
    }

    if (name.length > 100) {
      throw new Error("INVALID_NAME");
    }

    user.name = name;
  }

  if (input.email !== undefined) {
    const email =
      input.email.trim().toLowerCase();

    if (!email) {
      throw new Error("INVALID_EMAIL");
    }

    if (email !== user.email) {
      const existingUser =
        await User.findOne({
          email,
          _id: { $ne: userId },
        });

      if (existingUser) {
        throw new Error(
          "EMAIL_ALREADY_EXISTS",
        );
      }

      user.email = email;
    }
  }

  if (input.phone !== undefined) {
    user.phone = input.phone.trim();
  }

  await user.save();

  return User.findById(userId).select(
    "-passwordHash",
  );
}

export async function changeUserPassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const currentPasswordMatches =
    await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );

  if (!currentPasswordMatches) {
    throw new Error(
      "INVALID_CURRENT_PASSWORD",
    );
  }

  if (input.newPassword.length < 8) {
    throw new Error(
      "PASSWORD_TOO_SHORT",
    );
  }

  const newPasswordHash =
    await bcrypt.hash(
      input.newPassword,
      12,
    );

  user.passwordHash =
    newPasswordHash;

  await user.save();
}