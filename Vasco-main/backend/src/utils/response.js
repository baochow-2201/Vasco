module.exports = {
  success: (res, message, data = null) => {
    // Always return response with data wrapper for consistency
    const response = { success: true, message };
    if (data) {
      return res.json({ ...response, data });
    }
    return res.json(response);
  },

  error: (res, message, status = 500) => {
    return res.status(status).json({ success: false, message });
  },

  validationError: (res, errors) => {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors
    });
  }
};
