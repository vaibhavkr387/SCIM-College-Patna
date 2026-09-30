function notFound(req, res) {
  res.status(404).json({ message: "Route not found." });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Uploaded file exceeds the configured size limit." });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(" ") });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "A record with that unique value already exists." });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error."
  });
}

module.exports = { notFound, errorHandler };
