import { ZodError } from "zod";
import { firstValidationMessage } from "./validation";

export class PublicError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "PublicError";
    this.statusCode = statusCode;
  }
}

export function toPublicMessage(error: unknown): string {
  if (error instanceof ZodError) return firstValidationMessage(error);
  if (error instanceof PublicError) return error.message;
  return "Terjadi kendala sementara. Silakan coba lagi.";
}

export function publicErrorResponse(error: unknown): Response {
  const status = error instanceof PublicError ? error.statusCode : error instanceof ZodError ? 400 : 500;
  if (status === 500) console.error(error);
  return Response.json({ error: toPublicMessage(error) }, { status });
}
