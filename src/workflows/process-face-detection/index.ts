import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { detectFacesStep } from "./steps/detect-faces"
import { saveFaceDataStep } from "./steps/save-face-data"

type WorkflowInput = {
  imageUrl: string
  customerId?: string
}

export const processFaceDetectionWorkflow = createWorkflow(
  "process-face-detection",
  function (input: WorkflowInput) {
    const detectedFaces = detectFacesStep(input)
    
    const savedData = saveFaceDataStep({
      faces: detectedFaces.faces,
      customerId: input.customerId,
    })

    return new WorkflowResponse({
      faces: detectedFaces,
      savedData,
    })
  }
)