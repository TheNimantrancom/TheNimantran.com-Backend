import {Document} from "mongoose"

export interface ICard extends Document {
  name: string
  categories: string[]
  price: number
  discount: number
  wholesalePrice: number
  wholesaleDiscount: number
  isAvailableForWholesale: boolean
  quantityAvailable: number
  rating: number
  description: string
  reviewsCount: number
  isPopular: boolean
  isTrending: boolean
  quantityPerBundleWholesale: number
  quantityPerBundleCustomer: number
  images: {
    primaryImage?: string
    primaryImageKey?: string
    primaryUrlExpiresAt?: Date
    secondaryImage?: string
    secondaryImageKey?: string
    secondaryUrlExpiresAt?: Date
  }
  specifications: {
    material?: string
    dimensions?: string
    printing?: string
    weight?: string
    color?: string
    customizable?: boolean
  }
}