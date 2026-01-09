import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MERCADOPAGO_MODULE } from "../../../modules/mercadopago"
import MercadoPagoService from "../../../modules/mercadopago/service"

type CreatePaymentPreferenceInput = {
  orderId: string
  items: Array<{
    title: string
    quantity: number
    unit_price: number
  }>
  customerEmail?: string
  customerName?: string
}

export const createPaymentPreferenceStep = createStep(
  "create-payment-preference-step",
  async (input: CreatePaymentPreferenceInput, { container }) => {
    const mercadopagoService = container.resolve<MercadoPagoService>(MERCADOPAGO_MODULE)

    const preference = await mercadopagoService.createPreference({
      orderId: input.orderId,
      items: input.items,
      payer: input.customerEmail ? {
        email: input.customerEmail,
        name: input.customerName?.split(' ')[0],
        surname: input.customerName?.split(' ').slice(1).join(' '),
      } : undefined,
    })

    return new StepResponse({ preference }, { preferenceId: preference.id })
  }
)