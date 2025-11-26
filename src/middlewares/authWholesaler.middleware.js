export const isWholesaler = (req, res, next) => {
  if (req.user.wholesalerStatus !== "approved") {
    return res.status(403).json({ message: "Wholesaler access required" });
  }
  next();
};
