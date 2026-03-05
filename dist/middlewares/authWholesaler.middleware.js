export const isWholesaler = (req, res, next) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    if (user.wholesalerStatus !== "approved") {
        res
            .status(403)
            .json({ message: "Wholesaler access required" });
        return;
    }
    next();
};
