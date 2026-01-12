// src/api/middlewares/firebase-auth.ts
import { MedusaNextFunction, MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import FirebaseService from '../../modules/firebase/service';

export async function authenticateFirebaseToken(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const firebaseService: FirebaseService = req.scope.resolve('firebase');

  // Verificar si Firebase está disponible
  if (!firebaseService.isAvailable()) {
    return res.status(500).json({
      message: 'Firebase service is not available'
    });
  }

  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar el token
    const decodedToken = await firebaseService.verifyIdToken(token);

    // Agregar la información del usuario al request
    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token',
      error: error.message
    });
  }
}

// Middleware opcional que permite continuar sin token
export async function optionalFirebaseAuth(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const firebaseService: FirebaseService = req.scope.resolve('firebase');

  if (!firebaseService.isAvailable()) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decodedToken = await firebaseService.verifyIdToken(token);
      req.firebaseUser = decodedToken;
    }

    next();
  } catch (error) {
    // En caso de error, simplemente continuar sin autenticación
    next();
  }
}

// Extender el tipo MedusaRequest para incluir firebaseUser
declare module '@medusajs/framework/http' {
  interface MedusaRequest {
    firebaseUser?: import('firebase-admin').auth.DecodedIdToken;
  }
}