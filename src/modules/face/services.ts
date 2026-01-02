import { FaceClient } from "@azure/cognitiveservices-face"
import { ApiKeyCredentials } from "@azure/ms-rest-js"

export class FaceModuleService {
  private client: FaceClient

  constructor() {
    const credentials = new ApiKeyCredentials({
      inHeader: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_FACE_KEY!,
      },
    })

    this.client = new FaceClient(
      credentials,
      process.env.AZURE_FACE_ENDPOINT!
    )
  }

  async detectFromUrl(imageUrl: string) {
    const faces = await this.client.face.detectWithUrl(imageUrl, {
      detectionModel: "detection_03",
      recognitionModel: "recognition_04",
      returnFaceId: true,
    })

    if (!faces?.length) {
      throw new Error("No se detectó ningún rostro")
    }

    return faces[0].faceId
  }

  async verifyFaces(faceId1: string, faceId2: string) {
    const { isIdentical, confidence } =
      await this.client.face.verifyFaceToFace(faceId1, faceId2)

    return { isIdentical, confidence }
  }
}
