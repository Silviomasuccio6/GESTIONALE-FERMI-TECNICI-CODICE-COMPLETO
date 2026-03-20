import { Request, Response } from "express";

export const notFoundHandler = (_req: Request, res: Response) => {
  return res.status(404).json({
    error: "NOT_FOUND",
    message: "Risorsa non trovata"
  });
};
