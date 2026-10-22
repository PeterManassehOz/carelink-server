import path from "node:path";
import { fileTypeFromBuffer } from "file-type";

import type {
  AttachmentType,
  CloudinaryResourceType,
} from "../models/HealthRecordAttachment.js";

export const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024;
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",

  // Documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  rtf: "application/rtf",

  // Audio
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  opus: "audio/opus",
  webm: "audio/webm",
};

const EXTENSIONS_BY_TYPE: Record<AttachmentType, string[]> = {
  image: [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "heic",
    "heif",
  ],
  document: [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "csv",
    "rtf",
  ],
  audio: [
    "mp3",
    "m4a",
    "aac",
    "wav",
    "ogg",
    "opus",
    "webm",
  ],
};

export interface ValidatedAttachment {
  type: AttachmentType;
  mimeType: string;
  format: string;
  resourceType: CloudinaryResourceType;
  size: number;
}

export class AttachmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentValidationError";
  }
}

function getExtension(filename: string): string {
  return path.extname(filename).slice(1).toLowerCase();
}

function getAttachmentType(
  extension: string,
): AttachmentType | null {
  for (const [type, extensions] of Object.entries(
    EXTENSIONS_BY_TYPE,
  ) as [AttachmentType, string[]][]) {
    if (extensions.includes(extension)) {
      return type;
    }
  }

  return null;
}

function hasPrefix(
  buffer: Buffer,
  prefix: number[],
): boolean {
  return (
    buffer.length >= prefix.length &&
    prefix.every((byte, index) => buffer[index] === byte)
  );
}

function isZipContainer(buffer: Buffer): boolean {
  return (
    hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    hasPrefix(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    hasPrefix(buffer, [0x50, 0x4b, 0x07, 0x08])
  );
}

function isLegacyOfficeContainer(buffer: Buffer): boolean {
  return hasPrefix(buffer, [
    0xd0, 0xcf, 0x11, 0xe0,
    0xa1, 0xb1, 0x1a, 0xe1,
  ]);
}

function isPlausibleText(buffer: Buffer): boolean {
  if (buffer.length === 0) {
    return false;
  }

  // Text formats must not contain a NUL byte.
  if (buffer.includes(0)) {
    return false;
  }

  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  const text = sample.toString("utf8");

  // Reject binary-looking content with excessive control characters.
  let controlCharacters = 0;

  for (const character of text) {
    const code = character.charCodeAt(0);

    if (
      (code < 32 && code !== 9 && code !== 10 && code !== 13) ||
      code === 127
    ) {
      controlCharacters++;
    }
  }

  return controlCharacters <= Math.max(1, text.length * 0.01);
}

function hasValidContainer(
  extension: string,
  buffer: Buffer,
  detectedMime: string | undefined,
): boolean {
  if (extension === "pdf") {
    return buffer.subarray(0, 1024).includes(
      Buffer.from("%PDF-"),
    );
  }

  if (["doc", "xls", "ppt"].includes(extension)) {
    return isLegacyOfficeContainer(buffer);
  }

  if (["docx", "xlsx", "pptx"].includes(extension)) {
    // Office Open XML documents are ZIP containers.
    // A ZIP signature alone does not prove that the expected
    // Office document structure is present.
    return isZipContainer(buffer);
  }

  if (extension === "rtf") {
    return buffer
      .subarray(0, 16)
      .toString("ascii")
      .startsWith("{\\rtf");
  }

  if (["txt", "csv"].includes(extension)) {
    return isPlausibleText(buffer);
  }

  const expectedMime = MIME_BY_EXTENSION[extension];

  return Boolean(
    expectedMime &&
    detectedMime &&
    detectedMime === expectedMime,
  );
}

export async function validateAttachment(
  filename: string,
  buffer: Buffer,
): Promise<ValidatedAttachment> {
  if (!filename.trim() || buffer.length === 0) {
    throw new AttachmentValidationError(
      "A non-empty file is required.",
    );
  }

  const extension = getExtension(filename);
  const type = getAttachmentType(extension);

  if (!type) {
    throw new AttachmentValidationError(
      "This file extension is not supported.",
    );
  }

  const maxSize =
    type === "image"
      ? MAX_IMAGE_SIZE
      : type === "document"
        ? MAX_DOCUMENT_SIZE
        : MAX_AUDIO_SIZE;

  if (buffer.length > maxSize) {
    throw new AttachmentValidationError(
      `The ${type} exceeds the maximum permitted size of ${
        maxSize / (1024 * 1024)
      } MB.`,
    );
  }

  const detected = await fileTypeFromBuffer(buffer);

  if (
    !hasValidContainer(
      extension,
      buffer,
      detected?.mime,
    )
  ) {
    throw new AttachmentValidationError(
      "The file content does not match a supported file format.",
    );
  }

  const mimeType = MIME_BY_EXTENSION[extension];

  return {
    type,
    mimeType,
    format: extension,
    resourceType: type === "image" ? "image" : type === "audio" ? "video" : "raw",
    size: buffer.length,
  };
}
