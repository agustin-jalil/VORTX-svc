import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { processFaceDetectionWorkflow } from "workflows/process-face-detection"
import { z } from "zod"

const FaceDetectSchema = z.object({
  imageUrl: z.string().url("Must be a valid URL"),
  customerId: z.string().optional(),
})

type FaceDetectRequestBody = z.infer<typeof FaceDetectSchema>

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger")

  try {
    // Validar el body
    const { imageUrl, customerId } = FaceDetectSchema.parse(req.body)

    const { result } = await processFaceDetectionWorkflow(req.scope).run({
      input: {
        imageUrl,
        customerId,
      },
    })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    // Error de validación de Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation error",
        details: error.issues, // ✅ CORRECTO: usar .issues en lugar de .errors
      })
    }

    // Otros errores
    logger.error("Face detection error:", error)
    
    res.status(500).json({ 
      error: "Failed to process face detection",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}