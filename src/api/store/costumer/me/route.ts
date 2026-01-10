import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"

type CustomerServiceLike = {
  retrieve(id: string): Promise<any>
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" })
      return
    }

    const token = authHeader.replace("Bearer ", "")

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecret"
    ) as { customer_id?: string }

    if (!decoded.customer_id) {
      res.status(401).json({ error: "Invalid token" })
      return
    }

    const customerService =
      req.scope.resolve("customerService") as CustomerServiceLike

    const customer = await customerService.retrieve(decoded.customer_id)

    res.json({ customer })
  } catch (error) {
    console.error("[Medusa] Token validation error:", error)
    res.status(401).json({ error: "Invalid token" })
  }
}
