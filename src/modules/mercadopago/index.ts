import { Module } from "@medusajs/framework/utils"
import MercadoPagoService from "./service"

export const MERCADOPAGO_MODULE = "mercadopago"

export default Module(MERCADOPAGO_MODULE, {
  service: MercadoPagoService,
})