class KGLError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // If it starts with 4, it's a fail (404, 400); if 5, it's an error.
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // This property marks errors we create ourselves as "operational"
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = KGLError;
