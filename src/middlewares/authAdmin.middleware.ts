import { Request, Response, NextFunction } from "express"

const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log("isAdmin middleware triggered")

  const user = req.user

  if (!user) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  if (user.roles.includes("admin")) {
    next()
    return
  }

  res.status(403).json({ message: "Admin access required" })
}

export default isAdmin