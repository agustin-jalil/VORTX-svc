import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { Logger } from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

type MercadoPagoOptions = {
  accessToken: string
  sandbox?: boolean
}

type CreatePreferenceInput = {
  orderId: string
  items: Array<{
    title: string
    quantity: number
    unit_price: number
    currency_id?: string
  }>
  payer?: {
    name?: string
    surname?: string
    email?: string
    phone?: {
      area_code?: string
      number?: string
    }
  }
  back_urls?: {
    success?: string
    failure?: string
    pending?: string
  }
  notification_url?: string
}

class MercadoPagoService {
  protected readonly logger_: Logger
  protected readonly client_: MercadoPagoConfig
  protected readonly preference_: Preference
  protected readonly payment_: Payment
  protected readonly options_: MercadoPagoOptions

  constructor(
    { logger }: InjectedDependencies,
    options: MercadoPagoOptions
  ) {
    this.logger_ = logger
    this.options_ = options

    this.client_ = new MercadoPagoConfig({
      accessToken: options.accessToken,
      options: {
        timeout: 5000,
      }
    })

    this.preference_ = new Preference(this.client_)
    this.payment_ = new Payment(this.client_)

    this.logger_.info(`Mercado Pago service initialized ${options.sandbox ? '(SANDBOX MODE)' : '(PRODUCTION)'}`)
  }

  /**
   * Crear preferencia de pago
   */
  async createPreference(input: CreatePreferenceInput) {
    try {
      const preferenceData = {
        items: input.items.map((item, index) => ({
          id: `item-${index + 1}`,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: item.currency_id || "ARS",
        })),
        payer: input.payer ? {
          name: input.payer.name,
          surname: input.payer.surname,
          email: input.payer.email,
          phone: input.payer.phone ? {
            area_code: input.payer.phone.area_code || "",
            number: input.payer.phone.number || "",
          } : undefined,
        } : undefined,
        back_urls: {
          success: input.back_urls?.success || `${process.env.STORE_URL || 'http://localhost:8000'}/checkout/success`,
          failure: input.back_urls?.failure || `${process.env.STORE_URL || 'http://localhost:8000'}/checkout/failure`,
          pending: input.back_urls?.pending || `${process.env.STORE_URL || 'http://localhost:8000'}/checkout/pending`,
        },
        notification_url: input.notification_url || `${process.env.BACKEND_URL}/store/webhooks/mercadopago`,
        auto_return: "approved" as const,
        external_reference: input.orderId,
        statement_descriptor: process.env.STORE_NAME || "Mi Tienda",
      }

      const preference = await this.preference_.create({
        body: preferenceData
      })

      this.logger_.info(`Created Mercado Pago preference for order ${input.orderId}`)

      return {
        id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      }
    } catch (error: any) {
      this.logger_.error("Error creating Mercado Pago preference:", error)
      throw error
    }
  }

  /**
   * Obtener información de un pago
   */
  async getPayment(paymentId: string | number) {
    try {
      // ✅ CORRECCIÓN: Convertir a number y pasar en el formato correcto
      const id = typeof paymentId === 'string' 
        ? Number(paymentId) 
        : paymentId

      if (isNaN(id)) {
        throw new Error(`Invalid payment ID: ${paymentId}`)
      }

      // ✅ Pasar como objeto con la estructura correcta: { id, requestOptions? }
      const payment = await this.payment_.get({ 
        id: id
      })

      return {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        transactionAmount: payment.transaction_amount,
        currencyId: payment.currency_id,
        dateCreated: payment.date_created,
        dateApproved: payment.date_approved,
        externalReference: payment.external_reference,
        paymentMethod: payment.payment_method_id,
        payer: {
          email: payment.payer?.email,
          identification: payment.payer?.identification,
        }
      }
    } catch (error: any) {
      this.logger_.error(`Error getting payment ${paymentId}:`, error)
      throw error
    }
  }

  /**
   * Procesar notificación webhook
   */
/**
 * Procesar notificación webhook
 */
    async processWebhookNotification(notification: any) {
    try {
        // ✅ CORRECCIÓN: Convertir el objeto a string
        this.logger_.info(`Processing Mercado Pago webhook: ${JSON.stringify(notification)}`)

        const notificationType = notification.type || notification.topic
        const resourceId = notification.data?.id || notification.id

        if (!resourceId) {
        this.logger_.warn("Webhook received without resource ID")
        return null
        }

        if (notificationType === "payment" || notification.topic === "payment") {
        const payment = await this.getPayment(resourceId)
        
        return {
            paymentId: payment.id?.toString(),
            orderId: payment.externalReference,
            status: payment.status,
            amount: payment.transactionAmount,
        }
        }

        this.logger_.info(`Received ${notificationType} notification, ignoring`)
        return null
    } catch (error: any) {
        this.logger_.error(`Error processing webhook: ${error.message}`, error)
        throw error
    }
    }

  /**
   * Verificar estado de pago
   */
  getPaymentStatus(status: string | undefined): "pending" | "approved" | "rejected" | "cancelled" {
    if (!status) return "pending"
    
    switch (status) {
      case "approved":
        return "approved"
      case "rejected":
      case "cancelled":
        return "rejected"
      case "in_process":
      case "pending":
      default:
        return "pending"
    }
  }
}

export default MercadoPagoService