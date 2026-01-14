// src/modules/wishlist/service.ts
import { Logger } from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

type WishlistItem = {
  id: string
  customer_id: string
  product_id: string
  variant_id?: string
  created_at: Date
}

/**
 * Servicio de Wishlist (Favoritos)
 * Maneja la lista de productos favoritos del usuario
 */
class WishlistService {
  protected readonly logger_: Logger
  // En producción, esto debería estar en una base de datos
  // Por ahora usamos un Map en memoria como ejemplo
  private wishlistStore: Map<string, WishlistItem[]> = new Map()

  constructor({ logger }: InjectedDependencies) {
    this.logger_ = logger
    this.logger_.info("Wishlist service initialized")
  }

  /**
   * Obtener todos los favoritos de un cliente
   */
  async list(customerId: string): Promise<WishlistItem[]> {
    const items = this.wishlistStore.get(customerId) || []
    this.logger_.info(`Retrieved ${items.length} wishlist items for customer ${customerId}`)
    return items
  }

  /**
   * Añadir producto a favoritos
   */
  async add(data: {
    customer_id: string
    product_id: string
    variant_id?: string
  }): Promise<WishlistItem> {
    const items = this.wishlistStore.get(data.customer_id) || []
    
    // Verificar si ya existe
    const exists = items.some(
      item => item.product_id === data.product_id && 
              item.variant_id === data.variant_id
    )

    if (exists) {
      throw new Error("Product already in wishlist")
    }

    const newItem: WishlistItem = {
      id: `wish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customer_id: data.customer_id,
      product_id: data.product_id,
      variant_id: data.variant_id,
      created_at: new Date(),
    }

    items.push(newItem)
    this.wishlistStore.set(data.customer_id, items)
    
    this.logger_.info(`Added product ${data.product_id} to wishlist for customer ${data.customer_id}`)
    return newItem
  }

  /**
   * Eliminar producto de favoritos
   */
  async remove(customerId: string, itemId: string): Promise<void> {
    const items = this.wishlistStore.get(customerId) || []
    const filteredItems = items.filter(item => item.id !== itemId)
    
    if (items.length === filteredItems.length) {
      throw new Error("Wishlist item not found")
    }

    this.wishlistStore.set(customerId, filteredItems)
    this.logger_.info(`Removed item ${itemId} from wishlist for customer ${customerId}`)
  }

  /**
   * Verificar si un producto está en favoritos
   */
  async exists(customerId: string, productId: string, variantId?: string): Promise<boolean> {
    const items = this.wishlistStore.get(customerId) || []
    return items.some(
      item => item.product_id === productId && 
              item.variant_id === variantId
    )
  }

  /**
   * Limpiar todos los favoritos de un cliente
   */
  async clear(customerId: string): Promise<void> {
    this.wishlistStore.delete(customerId)
    this.logger_.info(`Cleared wishlist for customer ${customerId}`)
  }
}

export default WishlistService