import bcrypt from "bcryptjs";

import { User } from "../models/User.js";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export async function registerUser(
  input: RegisterUserInput,
) {
  const {
    name,
    email,
    password,
    phone,
  } = input;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    phone: phone?.trim(),
  });

  return user;
}

export async function authenticateUser(
  input: LoginUserInput,
) {
  const {
    email,
    password,
  } = input;

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return user;
}

export async function getAuthenticatedUser(
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