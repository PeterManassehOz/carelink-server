import {
  Types,
} from "mongoose";

import {
  HealthRecord,
  HEALTH_RECORD_CATEGORIES,
  type HealthRecordCategory,
} from "../models/HealthRecord.js";

export interface CreateHealthRecordInput {
  clientRecordId?: string;
  title: string;
  subtitle?: string;
  category: HealthRecordCategory;
  date: string;
  description?: string;
}

export interface UpdateHealthRecordInput {
  title?: string;
  subtitle?: string;
  category?: HealthRecordCategory;
  date?: string;
  description?: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateRecordFields(
  input: CreateHealthRecordInput | UpdateHealthRecordInput,
  requireAll: boolean,
): void {
  if (
    requireAll &&
    (!input.title || !input.category || !input.date)
  ) {
    throw new Error("REQUIRED_FIELDS_MISSING");
  }

  if (
    input.title !== undefined &&
    (
      typeof input.title !== "string" ||
      !input.title.trim() ||
      input.title.trim().length > 200
    )
  ) {
    throw new Error("INVALID_TITLE");
  }

  if (
    input.subtitle !== undefined &&
    (
      typeof input.subtitle !== "string" ||
      input.subtitle.length > 200
    )
  ) {
    throw new Error("INVALID_SUBTITLE");
  }

  if (
    input.description !== undefined &&
    (
      typeof input.description !== "string" ||
      input.description.length > 10000
    )
  ) {
    throw new Error("INVALID_DESCRIPTION");
  }

  if (
    input.category !== undefined &&
    !HEALTH_RECORD_CATEGORIES.includes(input.category)
  ) {
    throw new Error("INVALID_CATEGORY");
  }

  if (
    input.date !== undefined &&
    (
      typeof input.date !== "string" ||
      !isValidDate(input.date)
    )
  ) {
    throw new Error("INVALID_DATE");
  }
}

function assertValidUserId(userId: string): void {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }
}

function assertValidRecordId(recordId: string): void {
  if (!Types.ObjectId.isValid(recordId)) {
    throw new Error("INVALID_RECORD_ID");
  }
}

export async function createHealthRecord(
  userId: string,
  input: CreateHealthRecordInput,
) {
  assertValidUserId(userId);
  validateRecordFields(input, true);

  if (
    input.clientRecordId !== undefined &&
    (
      typeof input.clientRecordId !== "string" ||
      !input.clientRecordId.trim() ||
      input.clientRecordId.length > 150
    )
  ) {
    throw new Error("INVALID_CLIENT_RECORD_ID");
  }

  if (input.clientRecordId) {
    const existing = await HealthRecord.findOne({
      user: userId,
      clientRecordId: input.clientRecordId,
    });

    if (existing) {
      return {
        record: existing,
        created: false,
      };
    }
  }

  try {
    const record = await HealthRecord.create({
      user: userId,
      clientRecordId: input.clientRecordId?.trim(),
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() ?? "",
      category: input.category,
      date: input.date,
      initials: "",
      description: input.description?.trim() ?? "",
    });

    return {
      record,
      created: true,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === 11000 &&
      input.clientRecordId
    ) {
      const existing = await HealthRecord.findOne({
        user: userId,
        clientRecordId: input.clientRecordId,
      });

      if (existing) {
        return {
          record: existing,
          created: false,
        };
      }
    }

    throw error;
  }
}

export async function listHealthRecords(
  userId: string,
) {
  assertValidUserId(userId);

  return HealthRecord.find({
    user: userId,
  }).sort({
    date: -1,
    createdAt: -1,
  });
}

export async function getHealthRecord(
  userId: string,
  recordId: string,
) {
  assertValidUserId(userId);
  assertValidRecordId(recordId);

  const record = await HealthRecord.findOne({
    _id: recordId,
    user: userId,
  });

  if (!record) {
    throw new Error("HEALTH_RECORD_NOT_FOUND");
  }

  return record;
}

export async function updateHealthRecord(
  userId: string,
  recordId: string,
  input: UpdateHealthRecordInput,
) {
  assertValidUserId(userId);
  assertValidRecordId(recordId);

  if (Object.keys(input).length === 0) {
    throw new Error("NO_UPDATE_FIELDS");
  }

  validateRecordFields(input, false);

  const update: Record<string, unknown> = {};

  if (input.title !== undefined) {
    update.title = input.title.trim();
  }

  if (input.subtitle !== undefined) {
    update.subtitle = input.subtitle.trim();
  }

  if (input.category !== undefined) {
    update.category = input.category;
  }

  if (input.date !== undefined) {
    update.date = input.date;
  }

  if (input.description !== undefined) {
    update.description = input.description.trim();
  }

  const record = await HealthRecord.findOneAndUpdate(
    {
      _id: recordId,
      user: userId,
    },
    {
      $set: update,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!record) {
    throw new Error("HEALTH_RECORD_NOT_FOUND");
  }

  return record;
}

export async function deleteHealthRecord(
  userId: string,
  recordId: string,
): Promise<void> {
  assertValidUserId(userId);
  assertValidRecordId(recordId);

  const record = await HealthRecord.findOneAndDelete({
    _id: recordId,
    user: userId,
  });

  if (!record) {
    throw new Error("HEALTH_RECORD_NOT_FOUND");
  }
}
