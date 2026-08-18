module.exports = function ownerMiddleware(paramKey = "id", options = {}) {
  const { allowAdmin = true } = options;

  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const rawParam = req.params[paramKey];
    const targetId = Number(rawParam);
    const loggedInUserId = Number(req.user.id);
    const role = req.user.role;

    if (!rawParam || !Number.isInteger(targetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource id",
      });
    }

    const isOwner = loggedInUserId === targetId;
    const isAdmin = allowAdmin && Boolean(req.admin && (req.admin.role === "ADMIN" || req.admin.role === "SUPER_ADMIN"));

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this resource",
      });
    }

    next();
  };
};