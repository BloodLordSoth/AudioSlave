export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "What you're looking for can't be found") {
    super(message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Halt! None shall pass without credentials") {
    super(message, 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "There seems to be an error on your end") {
    super(message, 401);
  }
}

export class ConstraintError extends AppError {
  constructor(message = "The username already exists") {
    super(message, 409);
  }
}

export class InvalidCredentialError extends AppError {
  constructor(message = "The password you\'ve entered is incorrect") {
    super(message, 410);
  }
}
