// src/api/auth/customer/google/callback/route.ts

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // Medusa ya procesó el OAuth y creó la sesión
    const customerId = req.session?.auth_context?.customer_id
    
    if (!customerId) {
      const frontendUrl = process.env.AUTH_CALLBACK_URL || "http://localhost:3000/auth/callback"
      return res.redirect(`${frontendUrl}?error=no_customer`)
    }

    // Generar JWT token
    const token = jwt.sign(
      { customer_id: customerId },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "7d" }
    )

    // Redirigir al frontend con el token
    const frontendUrl = process.env.AUTH_CALLBACK_URL || "http://localhost:3000/auth/callback"
    res.redirect(`${frontendUrl}?token=${token}`)
  } catch (error) {
    console.error("[Medusa] Google callback error:", error)
    const frontendUrl = process.env.AUTH_CALLBACK_URL || "http://localhost:3000/auth/callback"
    res.redirect(`${frontendUrl}?error=auth_failed`)
  }
}