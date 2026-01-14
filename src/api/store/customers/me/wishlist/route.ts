// src/api/store/customers/me/wishlist/route.ts
import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/framework/types"
import { WISHLIST_MODULE } from "../../../../../modules/wishlist"
import WishlistService from "../../../../../modules/wishlist/service"
import { z } from "zod"

const AddToWishlistSchema = z.object({
  product_id: z.string(),
  variant_id: z.string().optional(),
})

/**
 * GET /store/customers/me/wishlist
 * Obtener lista de favoritos del usuario
 */
export async function GET(
  req: MedusaStoreRequest,
  res: MedusaResponse
) {
  try {
    const customerId = req.auth_context?.actor_id
    
    if (!customerId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const wishlistService = req.scope.resolve<WishlistService>(WISHLIST_MODULE)
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)

    const wishlistItems = await wishlistService.list(customerId)

    // Enriquecer con datos de productos
    const productIds = wishlistItems.map(item => item.product_id)
    const products = await productService.listProducts({
      id: productIds,
    })

    const enrichedItems = wishlistItems.map(item => {
      const product = products.find(p => p.id === item.product_id)
      return {
        ...item,
        product: product || null,
      }
    })

    res.json({ 
      wishlist: enrichedItems,
      count: enrichedItems.length 
    })
  } catch (error) {
    const logger = req.scope.resolve("logger")
    logger.error("Error fetching wishlist:", error)
    res.status(500).json({ 
      error: "Failed to fetch wishlist",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

/**
 * POST /store/customers/me/wishlist
 * Añadir producto a favoritos
 */
export async function POST(
  req: MedusaStoreRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger")

  try {
    const customerId = req.auth_context?.actor_id
    
    if (!customerId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const data = AddToWishlistSchema.parse(req.body)
    const wishlistService = req.scope.resolve<WishlistService>(WISHLIST_MODULE)

    const item = await wishlistService.add({
      customer_id: customerId,
      product_id: data.product_id,
      variant_id: data.variant_id,
    })

    res.status(201).json({ 
      success: true,
      item 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation error",
        details: error.issues,
      })
    }

    if (error instanceof Error && error.message === "Product already in wishlist") {
      return res.status(409).json({ 
        error: "Product already in wishlist"
      })
    }

    logger.error("Error adding to wishlist:", error)
    res.status(500).json({ 
      error: "Failed to add to wishlist",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

/**
 * DELETE /store/customers/me/wishlist
 * Limpiar todos los favoritos
 */
export async function DELETE(
  req: MedusaStoreRequest,
  res: MedusaResponse
) {
  try {
    const customerId = req.auth_context?.actor_id
    
    if (!customerId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const wishlistService = req.scope.resolve<WishlistService>(WISHLIST_MODULE)
    await wishlistService.clear(customerId)

    res.json({ 
      success: true,
      message: "Wishlist cleared" 
    })
  } catch (error) {
    const logger = req.scope.resolve("logger")
    logger.error("Error clearing wishlist:", error)
    res.status(500).json({ 
      error: "Failed to clear wishlist",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
}