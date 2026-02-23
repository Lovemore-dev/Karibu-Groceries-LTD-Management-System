// eslint-disable-next-line no-unused-vars
module.exports = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production: Don't leak error details to the client
    res.status(statusCode).json({
      status,
      message: err.isOperational ? err.message : 'Something went very wrong!',
    });
  }
};
