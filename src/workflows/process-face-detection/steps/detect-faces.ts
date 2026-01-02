import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { FACE_MODULE } from "modules/face"
import FaceService from "modules/face/services"

type DetectFacesInput = {
  imageUrl: string
}

export const detectFacesStep = createStep(
  "detect-faces-step",
  async (input: DetectFacesInput, { container }) => {
    const faceService: FaceService = container.resolve(FACE_MODULE)

    const faces = await faceService.detectFaces(input.imageUrl)

    return new StepResponse(
      { faces, count: faces.length },
      { imageUrl: input.imageUrl } // Compensation data
    )
  },
  async (compensationData, { container }) => {
    // Rollback logic si es necesario
    console.log("Rolling back face detection for:", compensationData.imageUrl)
  }
)