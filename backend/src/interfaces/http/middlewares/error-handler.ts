import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../../shared/errors/app-error.js";

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {})
    });
  }

  if (error instanceof ZodError) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      message: "Request non valida",
      details: error.flatten()
    });
  }

  const isProd = process.env.NODE_ENV === "production";
  return res.status(500).json({
    error: "INTERNAL_ERROR",
    message: isProd ? "Errore interno" : (error as Error)?.message
  });
};
