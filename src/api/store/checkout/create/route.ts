import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { createPaymentPreferenceWorkflow } from "../../../../workflows/create-payment-preference"

const CreateCheckoutSchema = z.object({
  orderId: z.string(),
  items: z.array(z.object({
    title: z.string(),
    quantity: z.number().int().positive(),
    unit_price: z.number().positive(),
  })),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
})

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger")

  try {
    const data = CreateCheckoutSchema.parse(req.body)

    const { result } = await createPaymentPreferenceWorkflow(req.scope).run({
      input: data,
    })

    res.json({
      success: true,
      preference: result.preference,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation error",
        details: error.issues,
      })
    }

    logger.error("Checkout creation error:", error)
    
    res.status(500).json({ 
      error: "Failed to create checkout",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}