import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// ✅ Agregar handler OPTIONS para CORS preflight
export async function OPTIONS(
  req: MedusaRequest,
  res: MedusaResponse
) {
  res.status(204).end()
}

// Tus otros handlers (POST, GET, etc.)
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Tu lógica aquí
}