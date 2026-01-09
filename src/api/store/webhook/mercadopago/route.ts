import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MERCADOPAGO_MODULE } from "../../../../modules/mercadopago"
import MercadoPagoService from "../../../../modules/mercadopago/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger")

  try {
    const mercadopagoService = req.scope.resolve<MercadoPagoService>(MERCADOPAGO_MODULE)
    const notification = req.body

    logger.info(`Received Mercado Pago webhook: ${JSON.stringify(notification)}`)


    const result = await mercadopagoService.processWebhookNotification(notification)

    if (result) {
      logger.info(`Payment processed: Order ${result.orderId}, Status: ${result.status}`)
      
      // TODO: Aquí actualizarías el estado de la orden en Medusa
      // Ejemplo:
      // if (result.status === 'approved') {
      //   await orderService.capturePayment(result.orderId)
      // } else if (result.status === 'rejected') {
      //   await orderService.cancelPayment(result.orderId)
      // }
    }

    res.status(200).json({ received: true })
  } catch (error: any) {
    logger.error("Webhook processing error:", error)
    res.status(500).json({ error: "Webhook processing failed" })
  }
}

// ✅ Agregar endpoint GET para verificación de Mercado Pago
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Mercado Pago a veces hace GET para verificar el endpoint
  res.status(200).json({ status: "ok" })
}