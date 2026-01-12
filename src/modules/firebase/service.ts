// src/modules/firebase/service.ts
import { Logger } from '@medusajs/framework/types';
import * as admin from 'firebase-admin';

type InjectedDependencies = {
  logger: Logger;
};

type FirebaseServiceOptions = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

export default class FirebaseService {
  protected logger_: Logger;
  protected firebaseApp_: admin.app.App | null = null;

  constructor(
    { logger }: InjectedDependencies,
    protected readonly options: FirebaseServiceOptions
  ) {
    this.logger_ = logger;
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Verificar si Firebase ya está inicializado
      if (admin.apps.length > 0) {
        this.firebaseApp_ = admin.apps[0];
        this.logger_.info('Firebase Admin SDK already initialized');
        return;
      }

      // Verificar que tenemos las credenciales necesarias
      if (!this.options.projectId || !this.options.clientEmail || !this.options.privateKey) {
        this.logger_.warn('Firebase credentials not provided. Firebase service will not be available.');
        return;
      }

      // Inicializar Firebase
      this.firebaseApp_ = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.options.projectId,
          clientEmail: this.options.clientEmail,
          privateKey: this.options.privateKey,
        }),
      });

      this.logger_.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger_.error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
      this.firebaseApp_ = null;
    }
  }

  /**
   * Verifica un token de Firebase ID
   * @param idToken - El token de Firebase ID del frontend
   * @returns Los datos decodificados del token
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.firebaseApp_) {
      throw new Error('Firebase is not initialized');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      this.logger_.debug(`Token verified for user: ${decodedToken.uid}`);
      return decodedToken;
    } catch (error) {
      this.logger_.error(`Failed to verify Firebase token: ${error.message}`);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Obtiene información del usuario de Firebase
   * @param uid - El UID del usuario en Firebase
   * @returns Información del usuario
   */
  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    if (!this.firebaseApp_) {
      throw new Error('Firebase is not initialized');
    }

    try {
      return await admin.auth().getUser(uid);
    } catch (error) {
      this.logger_.error(`Failed to get Firebase user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea un token personalizado de Firebase
   * @param uid - El UID del usuario
   * @param additionalClaims - Claims adicionales opcionales
   * @returns Token personalizado
   */
  async createCustomToken(
    uid: string,
    additionalClaims?: object
  ): Promise<string> {
    if (!this.firebaseApp_) {
      throw new Error('Firebase is not initialized');
    }

    try {
      return await admin.auth().createCustomToken(uid, additionalClaims);
    } catch (error) {
      this.logger_.error(`Failed to create custom token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Revoca todos los tokens de refresh de un usuario
   * @param uid - El UID del usuario
   */
  async revokeRefreshTokens(uid: string): Promise<void> {
    if (!this.firebaseApp_) {
      throw new Error('Firebase is not initialized');
    }

    try {
      await admin.auth().revokeRefreshTokens(uid);
      this.logger_.info(`Revoked refresh tokens for user: ${uid}`);
    } catch (error) {
      this.logger_.error(`Failed to revoke refresh tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica si el servicio está disponible
   */
  isAvailable(): boolean {
    return this.firebaseApp_ !== null;
  }
}