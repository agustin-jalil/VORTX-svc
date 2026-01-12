// src/api/store/protected/route.ts
import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { authenticateFirebaseToken } from '../../middlewares/firebase-auth';

/**
 * GET /store/protected
 * Ruta protegida que requiere autenticación de Firebase
 */
export const GET = [
  authenticateFirebaseToken,
  async (req: MedusaRequest, res: MedusaResponse) => {
    // El middleware ya validó el token y agregó firebaseUser al request
    return res.json({
      message: 'You are authenticated!',
      user: {
        uid: req.firebaseUser?.uid,
        email: req.firebaseUser?.email,
        emailVerified: req.firebaseUser?.email_verified,
      }
    });
  }
];

/**
 * POST /store/protected
 * Ejemplo de ruta POST protegida
 */
export const POST = [
  authenticateFirebaseToken,
  async (req: MedusaRequest, res: MedusaResponse) => {
    const data  = req.body;

    return res.json({
      message: 'Data processed successfully',
      processedBy: req.firebaseUser?.uid,
      data
    });
  }
];