// src/api/store/firebase-customer/route.ts
import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import FirebaseService from '../../../modules/firebase/service';
import z from 'zod';

/**
 * POST /store/firebase-customer/sync
 * Sincroniza un usuario de Firebase con un cliente de Medusa
 */
type tokenFirebase = z.infer<typeof TokenFirebaseSchema>;

const TokenFirebaseSchema = z.object({
  idToken: z.string(),
});

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const firebaseService: FirebaseService = req.scope.resolve('firebase');
  const customerService = req.scope.resolve('customer');

  try {
    const { idToken } = TokenFirebaseSchema.parse(req.body);

    if (!idToken) {
      return res.status(400).json({
        message: 'idToken is required'
      });
    }

    // Verificar el token de Firebase
    const decodedToken = await firebaseService.verifyIdToken(idToken);
    const firebaseUser = await firebaseService.getUserByUid(decodedToken.uid);

    // Buscar si el cliente ya existe en Medusa por email
    const existingCustomers = await customerService.listCustomers({
      email: firebaseUser.email,
    });

    let customer;

    if (existingCustomers.length > 0) {
      // Cliente ya existe, actualizarlo
      customer = existingCustomers[0];
      
      // Actualizar metadata con información de Firebase
      customer = await customerService.updateCustomers(customer.id, {
        metadata: {
          ...customer.metadata,
          firebase_uid: decodedToken.uid,
          firebase_provider: decodedToken.firebase?.sign_in_provider,
          last_firebase_sync: new Date().toISOString(),
        }
      });
    } else {
      // Crear nuevo cliente
      customer = await customerService.createCustomers({
        email: firebaseUser.email,
        first_name: firebaseUser.displayName?.split(' ')[0] || '',
        last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        phone: firebaseUser.phoneNumber || undefined,
        metadata: {
          firebase_uid: decodedToken.uid,
          firebase_provider: decodedToken.firebase?.sign_in_provider,
          firebase_photo_url: firebaseUser.photoURL,
          created_from_firebase: true,
          last_firebase_sync: new Date().toISOString(),
        }
      });
    }

    return res.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        firebase_uid: decodedToken.uid,
      }
    });
  } catch (error) {
    console.error('Error syncing customer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync customer',
      error: error.message
    });
  }
};