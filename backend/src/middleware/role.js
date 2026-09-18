// Restricts a route to a specific role. Use AFTER requireAuth.
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.profile || req.profile.role !== role) {
      return res.status(403).json({ error: `Requires ${role} role` });
    }
    next();
  };
}
