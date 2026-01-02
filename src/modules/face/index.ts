import { Module } from "@medusajs/framework/utils"
import FaceService from "./services"

export const FACE_MODULE = "face"

export default Module(FACE_MODULE, {
  service: FaceService,
})