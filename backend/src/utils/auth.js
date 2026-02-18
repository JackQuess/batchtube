function getRequestUser(req) {
  const id = req.header('x-user-id') || null;
  const email = req.header('x-user-email') || null;

  if (!id) {
    return null;
  }

  return {
    id,
    email
  };
}

function requireUser(req, res, next) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  req.user = user;
  return next();
}

module.exports = {
  getRequestUser,
  requireUser
};
