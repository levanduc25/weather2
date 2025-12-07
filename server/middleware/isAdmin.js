// Admin check middleware
// Uses user.role === 'admin' (preferred) or ADMIN_EMAILS env var (fallback)

module.exports = function isAdmin(req, res, next) {
  try {
    // Check 1: role-based (preferred)
    if (req.user && req.user.role === 'admin') return next();

    // Check 2: email-based (fallback for legacy/env-configured admins)
    const adminEnv = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL;
    if (adminEnv) {
      const allowed = adminEnv.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const userEmail = req.user && req.user.email ? req.user.email.toLowerCase() : null;
      if (userEmail && allowed.includes(userEmail)) return next();
    }

    return res.status(403).json({ message: 'Forbidden: admin only' });
  } catch (err) {
    console.error('isAdmin middleware error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

