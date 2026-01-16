import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { ICustomerModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import FirebaseService from "modules/firebase/service"
import { FIREBASE_MODULE } from "modules/firebase"

type FirebaseAuthInput = {
  idToken: string
}

type FirebaseAuthOutput = {
  customer: any
  firebaseUser: any
}

const verifyFirebaseTokenStep = createStep(
  "verify-firebase-token",
  async ({ idToken }: { idToken: string }, { container }) => {
    const firebaseService: FirebaseService = container.resolve(FIREBASE_MODULE)
    const decodedToken = await firebaseService.verifyIdToken(idToken)

    return new StepResponse({ decodedToken })
  }
)

const syncCustomerStep = createStep(
  "sync-customer",
  async ({ decodedToken }: any, { container }) => {
    const customerService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)

    if (!decodedToken.email) {
      throw new Error("Email is required from Firebase token")
    }

    // Buscar customer existente
    let [existingCustomers] = await customerService.listCustomers({
      email: decodedToken.email
    })

    let customer

    if (existingCustomers && existingCustomers.length > 0) {
      customer = existingCustomers[0]

      // Actualizar metadata
      if (!customer.metadata?.firebase_uid) {
        customer = await customerService.updateCustomers(customer.id, {
          metadata: {
            ...customer.metadata,
            firebase_uid: decodedToken.uid,
          }
        })
      }
    } else {
      // Crear nuevo customer
      const nameParts = decodedToken.name?.split(' ') || []
      const firstName = nameParts[0] || decodedToken.email.split('@')[0]
      const lastName = nameParts.slice(1).join(' ') || ''

      customer = await customerService.createCustomers({
        email: decodedToken.email,
        first_name: firstName,
        last_name: lastName,
        metadata: {
          firebase_uid: decodedToken.uid,
          email_verified: decodedToken.email_verified || false,
        }
      })
    }

    return new StepResponse({ customer, decodedToken })
  }
)

export const firebaseAuthWorkflow = createWorkflow(
  "firebase-auth",
  (input: FirebaseAuthInput) => {
    const { decodedToken } = verifyFirebaseTokenStep({ idToken: input.idToken })
    const { customer } = syncCustomerStep({ decodedToken })

    return new WorkflowResponse({
      customer,
      firebaseUser: decodedToken,
    })
  }
)