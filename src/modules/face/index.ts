import { Module } from "@medusajs/framework/utils"
import { FaceModuleService } from "./services"

export const FaceModule = Module("face", {
  service: FaceModuleService,
})
