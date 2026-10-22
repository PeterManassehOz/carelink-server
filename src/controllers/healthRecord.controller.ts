import type {
  Request,
  Response,
} from "express";

import {
  createHealthRecord,
  deleteHealthRecord,
  getHealthRecord,
  listHealthRecords,
  updateHealthRecord,
} from "../services/healthRecord.service.js";

function getUserId(req: Request): string | null {
  return req.user?._id.toString() ?? null;
}

function getRecordId(req: Request): string {
  const id = req.params.id;

  return typeof id === "string" ? id : "";
}

function handleError(
  error: unknown,
  res: Response,
  operation: string,
): void {
  if (error instanceof Error) {
    const clientErrors: Record<string, {
      status: number;
      message: string;
    }> = {
      INVALID_USER_ID: {
        status: 401,
        message: "Invalid authenticated user",
      },
      INVALID_RECORD_ID: {
        status: 400,
        message: "Invalid health record ID",
      },
      HEALTH_RECORD_NOT_FOUND: {
        status: 404,
        message: "Health record not found",
      },
      REQUIRED_FIELDS_MISSING: {
        status: 400,
        message: "Title, category, and date are required",
      },
      INVALID_CLIENT_RECORD_ID: {
        status: 400,
        message: "Invalid client record ID",
      },
      INVALID_TITLE: {
        status: 400,
        message: "Title must be between 1 and 200 characters",
      },
      INVALID_SUBTITLE: {
        status: 400,
        message: "Subtitle cannot exceed 200 characters",
      },
      INVALID_DESCRIPTION: {
        status: 400,
        message: "Description cannot exceed 10000 characters",
      },
      INVALID_CATEGORY: {
        status: 400,
        message: "Invalid health record category",
      },
      INVALID_DATE: {
        status: 400,
        message: "Date must be a valid YYYY-MM-DD date",
      },
      NO_UPDATE_FIELDS: {
        status: 400,
        message: "At least one field must be provided",
      },
    };

    const knownError = clientErrors[error.message];

    if (knownError) {
      res.status(knownError.status).json({
        success: false,
        message: knownError.message,
      });

      return;
    }
  }

  console.error(`${operation}:`, error);

  res.status(500).json({
    success: false,
    message: "Something went wrong while processing the health record",
  });
}

export async function createRecord(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return;
  }

  try {
    const result = await createHealthRecord(
      userId,
      req.body,
    );

    res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created
        ? "Health record created successfully"
        : "Health record already exists",
      data: {
        record: result.record,
      },
    });
  } catch (error) {
    handleError(error, res, "Create health record error");
  }
}

export async function getRecords(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return;
  }

  try {
    const records = await listHealthRecords(userId);

    res.status(200).json({
      success: true,
      results: records.length,
      data: {
        records,
      },
    });
  } catch (error) {
    handleError(error, res, "List health records error");
  }
}

export async function getRecord(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return;
  }

  try {
    const record = await getHealthRecord(
      userId,
      getRecordId(req),
    );

    res.status(200).json({
      success: true,
      data: {
        record,
      },
    });
  } catch (error) {
    handleError(error, res, "Get health record error");
  }
}

export async function updateRecord(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return;
  }

  try {
    const record = await updateHealthRecord(
      userId,
      getRecordId(req),
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Health record updated successfully",
      data: {
        record,
      },
    });
  } catch (error) {
    handleError(error, res, "Update health record error");
  }
}

export async function deleteRecord(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return;
  }

  try {
    await deleteHealthRecord(
      userId,
      getRecordId(req),
    );

    res.status(200).json({
      success: true,
      message: "Health record deleted successfully",
    });
  } catch (error) {
    handleError(error, res, "Delete health record error");
  }
}
