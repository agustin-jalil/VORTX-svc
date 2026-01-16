import { defineMiddlewares } from "@medusajs/framework/http"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaStoreRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ConfigModule } from "@medusajs/framework/types"
import { parseCorsOrigins } from "@medusajs/framework/utils"
import cors from "cors"

// ✅ Middleware de autenticación usando JWT
const authenticateCustomer = async (
  req: MedusaStoreRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const logger = req.scope.resolve("logger")
  
  try {
    // Obtener token del header Authorization o cookie
    const authHeader = req.headers.authorization
    const cookieToken = req.cookies?.medusa_auth_token
    const token = authHeader?.replace('Bearer ', '') || cookieToken

    if (!token) {
      logger.warn("No authentication token provided")
      return res.status(401).json({ 
        error: "Unauthorized",
        message: "No authentication token provided" 
      })
    }

    // ✅ Verificar token usando el servicio JWT
    const jwtService = req.scope.resolve("jwt")
    
    try {
      const decoded = jwtService.verify(token)
      
      if (!decoded || !decoded.actor_id || decoded.actor_type !== 'customer') {
        logger.warn("Invalid token structure")
        return res.status(401).json({ 
          error: "Unauthorized",
          message: "Invalid token" 
        })
      }

      // ✅ Establecer el contexto de autenticación
      req.auth_context = {
        actor_id: decoded.actor_id,
        actor_type: 'customer',
      }

      logger.info(`Authenticated customer: ${req.auth_context.actor_id}`)
      next()
      
    } catch (jwtError) {
      logger.error("JWT verification failed:", jwtError)
      return res.status(401).json({ 
        error: "Unauthorized",
        message: "Invalid or expired token" 
      })
    }

  } catch (error) {
    logger.error("Authentication error:", error)
    return res.status(500).json({ 
      error: "Internal server error",
      message: "Authentication failed" 
    })
  }
}

export default defineMiddlewares({
  routes: [
    // CORS para Firebase
    {
      matcher: "/store/firebase-auth*",
      middlewares: [
        (
          req: MedusaRequest,
          res: MedusaResponse,
          next: MedusaNextFunction
        ) => {
          const configModule = req.scope.resolve<ConfigModule>("configModule")
          return cors({
            origin: parseCorsOrigins(configModule.projectConfig.http.storeCors),
            credentials: true,
          })(req, res, next)
        },
      ],
    },
    {
      matcher: "/store/firebase-customer*",
      middlewares: [
        (
          req: MedusaRequest,
          res: MedusaResponse,
          next: MedusaNextFunction
        ) => {
          const configModule = req.scope.resolve<ConfigModule>("configModule")
          return cors({
            origin: parseCorsOrigins(configModule.projectConfig.http.storeCors),
            credentials: true,
          })(req, res, next)
        },
      ],
    },
    // ✅ Wishlist con CORS + Autenticación
    {
      matcher: "/store/customers/me/wishlist*",
      middlewares: [
        (
          req: MedusaRequest,
          res: MedusaResponse,
          next: MedusaNextFunction
        ) => {
          const configModule = req.scope.resolve<ConfigModule>("configModule")
          return cors({
            origin: parseCorsOrigins(configModule.projectConfig.http.storeCors),
            credentials: true,
          })(req, res, next)
        },
        authenticateCustomer, // ✅ Middleware de autenticación
      ],
    },
  ],
})