/**
 * Custom error classes for API
 */

export class ApiError extends Error {
  statusCode: number;
  errorCode: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode?: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || 'ERROR';
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
