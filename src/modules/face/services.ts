import { FaceClient } from "@azure/cognitiveservices-face"
import { ApiKeyCredentials } from "@azure/ms-rest-js"
import { Logger } from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

type FaceOptions = {
  endpoint: string
  apiKey: string
}

class FaceService {
  protected readonly logger_: Logger
  protected readonly client_: FaceClient
  protected readonly options_: FaceOptions

  constructor(
    { logger }: InjectedDependencies,
    options: FaceOptions
  ) {
    this.logger_ = logger
    this.options_ = options

    // Usar ApiKeyCredentials en lugar de CognitiveServicesCredentials
    const credentials = new ApiKeyCredentials({
      inHeader: {
        "Ocp-Apim-Subscription-Key": options.apiKey
      }
    })
    
    this.client_ = new FaceClient(credentials, options.endpoint)
  }

  async detectFaces(imageUrl: string) {
    try {
      const detectedFaces = await this.client_.face.detectWithUrl(imageUrl, {
        returnFaceId: true,
        returnFaceLandmarks: false,
        returnFaceAttributes: [
          "age",
          "gender",
          "smile",
          "facialHair",
          "glasses",
          "emotion"
        ]
      })

      this.logger_.info(`Detected ${detectedFaces.length} faces in image`)
      return detectedFaces
    } catch (error) {
      this.logger_.error("Error detecting faces:", error)
      throw error
    }
  }

  async detectFacesFromStream(imageStream: Buffer) {
    try {
      const detectedFaces = await this.client_.face.detectWithStream(imageStream, {
        returnFaceId: true,
        returnFaceLandmarks: false,
        returnFaceAttributes: [
          "age",
          "gender",
          "smile",
          "facialHair",
          "glasses",
          "emotion"
        ]
      })

      this.logger_.info(`Detected ${detectedFaces.length} faces in stream`)
      return detectedFaces
    } catch (error) {
      this.logger_.error("Error detecting faces from stream:", error)
      throw error
    }
  }

  async verifyFaces(faceId1: string, faceId2: string) {
    try {
      const result = await this.client_.face.verifyFaceToFace(faceId1, faceId2)
      this.logger_.info(`Face verification result: ${result.isIdentical}, confidence: ${result.confidence}`)
      return result
    } catch (error) {
      this.logger_.error("Error verifying faces:", error)
      throw error
    }
  }

  async identifyFaces(faceIds: string[], personGroupId: string) {
    try {
      const result = await this.client_.face.identify(faceIds, {
        personGroupId: personGroupId,
        maxNumOfCandidatesReturned: 1,
        confidenceThreshold: 0.5
      })
      
      this.logger_.info(`Identified ${result.length} faces in person group ${personGroupId}`)
      return result
    } catch (error) {
      this.logger_.error("Error identifying faces:", error)
      throw error
    }
  }

  async findSimilarFaces(faceId: string, faceIds: string[]) {
    try {
      const result = await this.client_.face.findSimilar(faceId, {
        faceIds: faceIds,
        maxNumOfCandidatesReturned: 10,
        mode: "matchPerson"
      })
      
      this.logger_.info(`Found ${result.length} similar faces`)
      return result
    } catch (error) {
      this.logger_.error("Error finding similar faces:", error)
      throw error
    }
  }

  async groupFaces(faceIds: string[]) {
    try {
      const result = await this.client_.face.group(faceIds)
      
      this.logger_.info(`Grouped faces into ${result.groups?.length || 0} groups`)
      return result
    } catch (error) {
      this.logger_.error("Error grouping faces:", error)
      throw error
    }
  }
}

export default FaceService