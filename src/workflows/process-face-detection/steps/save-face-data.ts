import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type SaveFaceDataInput = {
  faces: any[]
  customerId?: string
}

export const saveFaceDataStep = createStep(
  "save-face-data-step",
  async (input: SaveFaceDataInput, { container }) => {
    // Aquí podrías guardar en tu base de datos
    // const customModuleService = container.resolve("customModuleService")
    
    const savedRecord = {
      id: "face_" + Date.now(),
      customerId: input.customerId,
      facesDetected: input.faces.length,
      timestamp: new Date(),
    }

    // await customModuleService.create(savedRecord)

    return new StepResponse(savedRecord, { id: savedRecord.id })
  },
  async (compensationData, { container }) => {
    // Rollback: eliminar el registro si algo falla después
    // await customModuleService.delete(compensationData.id)
    console.log("Rolling back saved face data:", compensationData.id)
  }
)