



const isAdmin = (req, res, next) => {
  console.log("IsAdmin has been hitted")
  console.log(req.user)
  if (req.user && req.user.roles[0] === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Admin access required' });
  }
};

export default isAdmin;
