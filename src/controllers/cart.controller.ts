import { Request, Response } from "express"
import mongoose from "mongoose"
import { Card } from "../models/card.model.js"
import { Cart } from "../models/cart.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiResponse from "../utils/apiResponse.js"
import ApiError from "../utils/apiError.js"
import {ICard} from "../types/models/card.types.js"


export const addToCart = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const userId = req.user._id
    const { cardId, quantity } = req.body

    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      throw new ApiError(400, "Invalid cardId")
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(
        400,
        "Quantity must be a positive integer"
      )
    }

    const card = await Card.findById(cardId)
    if (!card) throw new ApiError(404, "Card not found")

    let cart = await Cart.findOne({ userId })

    if (!cart) {
      cart = await Cart.create({
        userId,
        cards: [{ cardId, quantity }],
      })
    } else {
      const existingItem = cart.cards.find(
        (item) =>
          item.cardId.toString() === cardId
      )

      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        cart.cards.push({ cardId, quantity })
      }

      await cart.save()
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, cart, "Item added to cart")
      )
  }
)



export const getCartCards = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const cart = await Cart.findOne({
      userId: req.user._id,
    })
      .populate(
        "cards.cardId",
        "name price images discount isAvailableForWholesale wholesalePrice wholesaleDiscount quantityPerBundleCustomer quantityPerBundleWholesale"
      )
      .lean()

    if (!cart || cart.cards.length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, [], "Cart is empty")
        )
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, cart.cards, "Cart fetched")
      )
  }
)



export const removeCartCard = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const { cardId } = req.params

    if (!mongoose.Types.ObjectId.isValid(cardId as string)) {
      throw new ApiError(400, "Invalid cardId")
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { cards: { cardId } } },
      { new: true }
    ).populate("cards.cardId", "name price images")

    if (!updatedCart) {
      throw new ApiError(404, "Cart or item not found")
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedCart, "Item removed")
      )
  }
)


export const totalCartAmount = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const user = req.user

    const cart = await Cart.findOne({
      userId: user._id,
    })
      .populate("cards.cardId")
      .lean()

    if (!cart || !cart.cards.length) {
      throw new ApiError(404, "Cart is empty")
    }

    let total = 0
    let discount = 0

    for (const item of cart.cards) {
      const card = item.cardId as unknown as ICard
      if (!card) continue

      const quantity = Number(item.quantity) || 0

      const isWholesale =
        user.wholesalerStatus === "approved" &&
        card.isAvailableForWholesale

      const pricePerPack = isWholesale
        ? Number(card.wholesalePrice) || 0
        : Number(card.price) || 0

      const discountPerPack = isWholesale
        ? Number(card.wholesaleDiscount) || 0
        : Number(card.discount) || 0

      total += quantity * pricePerPack
      discount += quantity * discountPerPack
    }

    if (total <= 0) {
      throw new ApiError(
        400,
        "No valid items found in cart"
      )
    }

    const taxableAmount = Math.max(total - discount, 0)

    const GST_RATE = 0.18
    const gstAmount = Number(
      (taxableAmount * GST_RATE).toFixed(2)
    )

    const deliveryThreshold =
      user.wholesalerStatus === "approved"
        ? 2000
        : 200

    const deliveryCharge =
      taxableAmount >= deliveryThreshold ? 0 : 40

    const finalAmount = Number(
      (
        taxableAmount +
        gstAmount +
        deliveryCharge
      ).toFixed(2)
    )

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subtotal: total,
          discount,
          taxableAmount,
          gstRate: "18%",
          gstAmount,
          deliveryCharge,
          finalAmount,
        },
        "Total calculated successfully"
      )
    )
  }
)


export const updateCartCardQuantity =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ): Promise<Response> => {
      if (!req.user)
        throw new ApiError(401, "Unauthorized")

      const { cardId } = req.params
      const { quantity } = req.body

      if (!mongoose.Types.ObjectId.isValid(cardId as string)) {
        throw new ApiError(400, "Invalid cardId")
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new ApiError(
          400,
          "Quantity must be a positive integer"
        )
      }

      const cart = await Cart.findOneAndUpdate(
        {
          userId: req.user._id,
          "cards.cardId": cardId,
        },
        { $set: { "cards.$.quantity": quantity } },
        { new: true }
      ).populate("cards.cardId", "name price images")

      if (!cart) {
        throw new ApiError(
          404,
          "Cart or card not found"
        )
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            cart,
            "Quantity updated"
          )
        )
    }
  )



export const emptyCart = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user)
      throw new ApiError(401, "Unauthorized")

    await Cart.findOneAndDelete({
      userId: req.user._id,
    })

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Cart is empty"
        )
      )
  }
)