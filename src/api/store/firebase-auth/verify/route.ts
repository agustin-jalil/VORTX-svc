import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FIREBASE_MODULE } from "modules/firebase"
import FirebaseService from "modules/firebase/service"
import { z } from "zod"

const VerifyTokenSchema = z.object({
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
    const { idToken } = VerifyTokenSchema.parse(req.body)

    const firebaseService = req.scope.resolve<FirebaseService>(FIREBASE_MODULE)

    if (!firebaseService.isAvailable()) {
      return res.status(503).json({
        error: "Firebase service is not available"
      })
    }

    // Verificar el token con Firebase
    const decodedToken = await firebaseService.verifyIdToken(idToken)

    logger.info(`Token verified for Firebase user: ${decodedToken.uid}`)

    res.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.issues,
      })
    }

    logger.error("Firebase token verification error:", error)
    
    res.status(401).json({
      error: "Invalid or expired token",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
}