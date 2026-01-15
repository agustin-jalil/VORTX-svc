import { defineMiddlewares } from "@medusajs/framework/http"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ConfigModule } from "@medusajs/framework/types"
import { parseCorsOrigins } from "@medusajs/framework/utils"
import cors from "cors"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/*",
      method: "OPTIONS",
      middlewares: [
        (req: MedusaRequest, res: MedusaResponse) => {
          res.status(204).end()
        },
      ],
    },
    {
      matcher: "/store/firebase-auth*",
      middlewares: [
        (
          req: MedusaRequest,
          res: MedusaResponse,
          next: MedusaNextFunction
        ) => {
          const configModule = req.scope.resolve<ConfigModule>("configModule")

          return cors({
            origin: parseCorsOrigins(
              configModule.projectConfig.http.storeCors
            ),
            credentials: true,
          })(req, res, next)
        },
      ],
    },
    {
      matcher: "/store/firebase-customer*",
      middlewares: [
        (
          req: MedusaRequest,
          res: MedusaResponse,
          next: MedusaNextFunction
        ) => {
          const configModule = req.scope.resolve<ConfigModule>("configModule")

          return cors({
            origin: parseCorsOrigins(
              configModule.projectConfig.http.storeCors
            ),
            credentials: true,
          })(req, res, next)
        },
      ],
    },
  ],
})
