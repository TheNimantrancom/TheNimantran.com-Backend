import { Request, Response, NextFunction } from "express"
import {IUser} from "../types/models/user.types.js"
const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log("isAdmin middleware triggered")

  const user:IUser| any = req.user

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