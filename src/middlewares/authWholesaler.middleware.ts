import { Request, Response, NextFunction } from "express"

export const isWholesaler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = req.user

  if (!user) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  if (user.wholesalerStatus !== "approved") {
    res
      .status(403)
      .json({ message: "Wholesaler access required" })
    return
  }

  next()
}