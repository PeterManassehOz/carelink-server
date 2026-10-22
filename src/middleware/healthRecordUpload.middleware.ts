
import multer from "multer";
import type {
  NextFunction,
  Request,
  Response,
} from "express";

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
    files: 1,
    fields: 5,
    parts: 6,
    fieldSize: 16 * 1024,
  },
});

export function uploadHealthRecordAttachment(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  upload.single("file")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      console.error("[Attachment Upload] Multer error:", {
        code: error.code,
        message: error.message,
        field: error.field,
      });

      const isTooLarge = error.code === "LIMIT_FILE_SIZE";

      res.status(isTooLarge ? 413 : 400).json({
        success: false,
        code: error.code,
        message: isTooLarge
          ? "The file exceeds the maximum upload size of 25 MB"
          : error.code === "LIMIT_UNEXPECTED_FILE"
            ? 'Upload exactly one file using the field name "file"'
            : "The upload request exceeds the permitted limits",
      });

      return;
    }

    if (error) {
      next(error);
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'A file is required in the multipart field named "file"',
      });

      return;
    }

    next();
  });
}
