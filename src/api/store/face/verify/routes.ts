import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FaceModuleService } from "modules/face/services"


type VerifyFaceBody = {
  imageUrl1: string
  imageUrl2: string
}

export async function POST(
  req: MedusaRequest<VerifyFaceBody>,
  res: MedusaResponse
) {
  const { imageUrl1, imageUrl2 } = req.body

  const faceService = req.scope.resolve<FaceModuleService>("face")

  const id1 = await faceService.detectFromUrl(imageUrl1)
  const id2 = await faceService.detectFromUrl(imageUrl2)

  const result = await faceService.verifyFaces(id1, id2)

  res.json(result)
}
