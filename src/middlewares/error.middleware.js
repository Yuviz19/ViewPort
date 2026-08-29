const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message,
    data: err.data,
    errors: err.errors,
    success: false,
  });
};

export { errorHandler };
