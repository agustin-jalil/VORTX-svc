import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createPaymentPreferenceStep } from "./steps/create-payment-preference"

type WorkflowInput = {
  orderId: string
  items: Array<{
    title: string
    quantity: number
    unit_price: number
  }>
  customerEmail?: string
  customerName?: string
}

export const createPaymentPreferenceWorkflow = createWorkflow(
  "create-payment-preference",
  function (input: WorkflowInput) {
    const preference = createPaymentPreferenceStep(input)

    return new WorkflowResponse({ preference })
  }
)