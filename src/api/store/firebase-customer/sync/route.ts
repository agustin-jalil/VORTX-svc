import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ICustomerModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { FIREBASE_MODULE } from "modules/firebase"
import FirebaseService from "modules/firebase/service"
import { z } from "zod"

const SyncCustomerSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
})

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.status(204).end()
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger")

  try {
    const { idToken } = SyncCustomerSchema.parse(req.body)

    const firebaseService = req.scope.resolve<FirebaseService>(FIREBASE_MODULE)
    const customerService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)

    if (!firebaseService.isAvailable()) {
      return res.status(503).json({
        error: "Firebase service is not available"
      })
    }

    // 1. Verificar token de Firebase
    const decodedToken = await firebaseService.verifyIdToken(idToken)
    
    if (!decodedToken.email) {
      return res.status(400).json({
        error: "Email is required from Firebase token"
      })
    }

    logger.info(`Syncing customer for Firebase UID: ${decodedToken.uid}`)

    // 2. Buscar o crear customer en Medusa
    let [existingCustomers] = await customerService.listCustomers({
      email: decodedToken.email
    })

    let customer

    if (existingCustomers && existingCustomers.length > 0) {
      customer = existingCustomers[0]
      logger.info(`Found existing customer: ${customer.id}`)

      if (!customer.metadata?.firebase_uid) {
        customer = await customerService.updateCustomers(customer.id, {
          metadata: {
            ...customer.metadata,
            firebase_uid: decodedToken.uid,
          }
        })
      }
    } else {
      const nameParts = decodedToken.name?.split(' ') || []
      const firstName = nameParts[0] || decodedToken.email.split('@')[0]
      const lastName = nameParts.slice(1).join(' ') || ''

      customer = await customerService.createCustomers({
        email: decodedToken.email,
        first_name: firstName,
        last_name: lastName,
        has_account: true,
        metadata: {
          firebase_uid: decodedToken.uid,
          email_verified: decodedToken.email_verified || false,
        }
      })

      logger.info(`Created new customer: ${customer.id}`)
    }

    // 3. ✅ Crear token JWT manualmente usando el servicio JWT de Medusa
    const jwtService = req.scope.resolve("jwt")
    
    const token = jwtService.sign({
      actor_id: customer.id,
      actor_type: "customer",
      app_metadata: {
        customer_id: customer.id,
      }
    })

    logger.info(`Generated JWT token for customer: ${customer.id}`)

    // 4. Establecer cookie segura
    res.cookie('medusa_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      path: '/',
    })

    res.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        has_account: customer.has_account,
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.issues,
      })
    }

    logger.error("Customer sync error:", error)
    
    res.status(500).json({
      error: "Failed to sync customer",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
}