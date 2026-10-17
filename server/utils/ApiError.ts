export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: ApiErrorDetail[];

  constructor(statusCode: number, message: string, errors: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", errors: ApiErrorDetail[] = []) { return new ApiError(400, message, errors); }
  static unauthorized(message = "Please log in to continue") { return new ApiError(401, message); }
  static forbidden(message = "You do not have permission to do this") { return new ApiError(403, message); }
  static notFound(message = "Resource not found") { return new ApiError(404, message); }
  static conflict(message = "Resource already exists") { return new ApiError(409, message); }
}
