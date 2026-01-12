// src/api/store/firebase-auth/route.ts
import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import FirebaseService from '../../../modules/firebase/service';
import z from 'zod';

/**
 * POST /store/firebase-auth/verify
 * Verifica un token de Firebase y devuelve información del usuario
 */
type tokenFirebase = z.infer<typeof TokenFirebaseSchema>;

const TokenFirebaseSchema = z.object({
  idToken: z.string(),
});

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const firebaseService: FirebaseService = req.scope.resolve('firebase');

  try {
    const { idToken } = TokenFirebaseSchema.parse(req.body);

    if (!idToken) {
      return res.status(400).json({
        message: 'idToken is required'
      });
    }

    // Verificar el token
    const decodedToken = await firebaseService.verifyIdToken(idToken);

    // Obtener información adicional del usuario si es necesario
    const userRecord = await firebaseService.getUserByUid(decodedToken.uid);

    return res.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        phoneNumber: userRecord.phoneNumber,
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};