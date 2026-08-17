export class AppError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, errorCode?: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}
