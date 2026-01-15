import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/medusa"
import cors from "cors"

const storeCors = cors({
  origin: process.env.STORE_CORS?.split(","),
  credentials: true,
})

export default (router) => {
  // 🔥 RUTAS CUSTOM FIREBASE
  router.use(
    "/store/firebase-auth",
    storeCors
  )

  router.use(
    "/store/firebase-customer",
    storeCors
  )
}
