import { Request, Response, NextFunction } from "express"
import {IUser} from "../types/models/user.types.js"
export const isWholesaler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  const user:IUser | any = req.user

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