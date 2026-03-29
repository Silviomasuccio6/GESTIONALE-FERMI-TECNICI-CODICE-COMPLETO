export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode = 400,
    public readonly code = "APP_ERROR",
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}
