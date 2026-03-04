import { IUser } from "./models/user.types.js"
import { IReview } from "./models/review.types.js"
import { ICard } from "./models/card.types.js"

declare global {
  namespace Express {
    interface Request {
      user?: IUser
      review?: IReview
      product?: ICard
    }
  }
}

export {}