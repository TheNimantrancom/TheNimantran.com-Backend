import { Request, Response } from "express"
import mongoose from "mongoose"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import { Cart, type ICartItem } from "../models/cart.model.js"
import { Card } from "../models/card.model.js"
import Design from "../models/design.model.js"



interface AddProductInput {
  itemType: "product"
  productId: string
  quantity: number
  specifications?: Record<string, unknown>
}

interface AddDesignInput {
  itemType: "design"
  designId: string
  quantity: number
  specifications?: Record<string, unknown>
}

type AddToCartInput = AddProductInput | AddDesignInput



const buildProductItem = async (
  input: AddProductInput,
  isWholesale: boolean
): Promise<Omit<ICartItem, "addedAt">> => {
  const card = await Card.findById(input.productId)
  if (!card) throw new ApiError(404, `Product ${input.productId} not found`)

  const eligible = isWholesale && card.isAvailableForWholesale
  const unitPrice = eligible ? card.wholesalePrice : card.price
  const discountPerUnit = eligible
    ? card.wholesaleDiscount ?? 0
    : card.discount ?? 0
  const totalPrice = (unitPrice - discountPerUnit) * input.quantity

  return {
    itemType: "product",
    productId: card._id as mongoose.Types.ObjectId,
    name: card.name,
    category: Array.isArray(card.categories) ? card.categories[0] : "product",
    previewImage: card.images?.primaryImage ?? "",
    quantity: input.quantity,
    unitPrice,
    discountPerUnit,
    totalPrice,
    specifications: input.specifications ?? undefined,
    isWholesale: eligible,
  }
}



const buildDesignItem = async (
  input: AddDesignInput,
  userId: string
): Promise<Omit<ICartItem, "addedAt">> => {
  const design = await Design.findById(input.designId).populate("templateId")
  if (!design) throw new ApiError(404, `Design ${input.designId} not found`)

  // Security: users can only add their own designs
  if (String(design.userId) !== String(userId)) {
    throw new ApiError(403, "You do not own this design")
  }

  const template = design.templateId as any

  // Designs use a fixed per-unit price defined on the template
  // (fall back to 0 if not yet configured — admin sets this)
  const unitPrice = template?.unitPrice ?? 0
  const discountPerUnit = 0
  const totalPrice = unitPrice * input.quantity

  return {
    itemType: "design",
    designId: design._id as mongoose.Types.ObjectId,
    templateId: template?._id ?? null,
    name: design.name,
    category: template?.category ?? "custom",
    previewImage: design.previewImage ?? "",
    quantity: input.quantity,
    unitPrice,
    discountPerUnit,
    totalPrice,
    specifications: input.specifications ?? undefined,
    isWholesale: false,
  }
}


export const getCart = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.productId", "name price images.primaryImage categories")
      .populate("items.designId", "name previewImage status")
      .populate("items.templateId", "name category backgroundImage")

    if (!cart) {
      // Return an empty cart shape — never 404
      return res.status(200).json(
        new ApiResponse(200, { items: [], itemCount: 0, subtotal: 0 }, "Cart is empty")
      )
    }

    return res.status(200).json(
      new ApiResponse(200, cart, "Cart fetched successfully")
    )
  }
)


export const addToCart = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const input = req.body as AddToCartInput

    if (!input.itemType || !["product", "design"].includes(input.itemType)) {
      throw new ApiError(400, "itemType must be 'product' or 'design'")
    }

    if (!input.quantity || input.quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1")
    }

    const isWholesale = req.user.wholesalerStatus === "approved"

    // Build the priced item
    let newItem: Omit<ICartItem, "addedAt">

    if (input.itemType === "product") {
      if (!input.productId) throw new ApiError(400, "productId is required")
      newItem = await buildProductItem(input as AddProductInput, isWholesale)
    } else {
      if (!input.designId) throw new ApiError(400, "designId is required")
      newItem = await buildDesignItem(input as AddDesignInput, String(req.user._id))
    }

    // Upsert cart
    let cart = await Cart.findOne({ user: req.user._id })

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] })
    }

    // If the same item already exists (same productId or designId) → merge quantity
    const existingIndex = cart.items.findIndex((item : any) => {
      if (input.itemType === "product") {
        return (
          item.itemType === "product" &&
          String(item.productId) === String((input as AddProductInput).productId)
        )
      }
      return (
        item.itemType === "design" &&
        String(item.designId) === String((input as AddDesignInput).designId)
      )
    })

    if (existingIndex !== -1) {
      const existing = cart.items[existingIndex]
      const newQty = existing.quantity + input.quantity
      existing.quantity = newQty
      existing.totalPrice = (existing.unitPrice - existing.discountPerUnit) * newQty
    } else {
      cart.items.push({ ...newItem, addedAt: new Date() } as ICartItem)
    }

    await cart.save() // pre-save hook recomputes itemCount + subtotal

    return res.status(200).json(
      new ApiResponse(200, cart, "Item added to cart")
    )
  }
)

/* ================================================================== */
/*  UPDATE ITEM QUANTITY                                               */
/*  PATCH /api/v1/cart/item/:itemId                                    */
/* ================================================================== */

export const updateCartItem = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const { itemId } = req.params
    const { quantity }: { quantity: number } = req.body

    if (!quantity || quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1")
    }

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) throw new ApiError(404, "Cart not found")

    const item = cart.items.find(
      (i:any) => String((i as any)._id) === itemId
    )
    if (!item) throw new ApiError(404, "Cart item not found")

    item.quantity = quantity
    item.totalPrice = (item.unitPrice - item.discountPerUnit) * quantity

    await cart.save()

    return res.status(200).json(
      new ApiResponse(200, cart, "Cart item updated")
    )
  }
)



export const removeCartItem = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const { itemId } = req.params

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) throw new ApiError(404, "Cart not found")

    const before = cart.items.length
    cart.items = cart.items.filter(
      (i:any) => String((i as any)._id) !== itemId
    )

    if (cart.items.length === before) {
      throw new ApiError(404, "Cart item not found")
    }

    await cart.save()

    return res.status(200).json(
      new ApiResponse(200, cart, "Item removed from cart")
    )
  }
)



export const clearCart = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
      return res.status(200).json(
        new ApiResponse(200, null, "Cart is already empty")
      )
    }

    cart.items = []
    await cart.save()

    return res.status(200).json(
      new ApiResponse(200, cart, "Cart cleared")
    )
  }
)

/* ================================================================== */
/*  SYNC CART PRICES                                                   */
/*  POST /api/v1/cart/sync                                             */
/*                                                                     */
/*  Call this before showing checkout to refresh cached prices.        */
/*  Useful when admin changes product price between sessions.          */
/* ================================================================== */

export const syncCartPrices = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart || cart.items.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, cart, "Cart is empty — nothing to sync")
      )
    }

    const isWholesale = req.user.wholesalerStatus === "approved"
    const priceChanges: { name: string; old: number; new: number }[] = []

    for (const item of cart.items) {
      if (item.itemType === "product" && item.productId) {
        const card = await Card.findById(item.productId)
        if (!card) continue

        const eligible = isWholesale && card.isAvailableForWholesale
        const freshUnit = eligible ? card.wholesalePrice : card.price
        const freshDiscount = eligible
          ? card.wholesaleDiscount ?? 0
          : card.discount ?? 0

        if (freshUnit !== item.unitPrice || freshDiscount !== item.discountPerUnit) {
          priceChanges.push({
            name: item.name,
            old: item.unitPrice,
            new: freshUnit,
          })
          item.unitPrice = freshUnit
          item.discountPerUnit = freshDiscount
          item.totalPrice = (freshUnit - freshDiscount) * item.quantity
        }
      }
      // Design pricing is managed differently (template-level) — skip for now
    }

    await cart.save()

    return res.status(200).json(
      new ApiResponse(
        200,
        { cart, priceChanges },
        priceChanges.length > 0
          ? `Cart synced — ${priceChanges.length} price(s) updated`
          : "Cart is up to date"
      )
    )
  }
)