// src/api/store/customers/me/wishlist/[id]/route.ts
import { MedusaRequest, MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "modules/wishlist"
import WishlistService from "modules/wishlist/service"

/**
 * DELETE /store/customers/me/wishlist/:id
 * Eliminar un producto específico de favoritos
 */
export async function DELETE(
  req: MedusaStoreRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger")

  try {
    const customerId = req.auth_context?.actor_id
    
    if (!customerId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const itemId = req.params.id
    const wishlistService = req.scope.resolve<WishlistService>(WISHLIST_MODULE)

    await wishlistService.remove(customerId, itemId)

    res.json({ 
      success: true,
      message: "Item removed from wishlist" 
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Wishlist item not found") {
      return res.status(404).json({ 
        error: "Wishlist item not found"
      })
    }

    logger.error("Error removing from wishlist:", error)
    res.status(500).json({ 
      error: "Failed to remove from wishlist",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
}