/* eslint-disable no-unused-vars */
const errorHandler = (err, _req, res, _next) => {
  console.error(err);
  const status = err.statusCode || err.status || (err.name === "ZodError" ? 400 : 500);
  res.status(status).json({
    error: err.name || "Error",
    message: err.message || "Internal Server Error",
  });
};

module.exports = { errorHandler };

