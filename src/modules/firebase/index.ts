// src/modules/firebase/index.ts
import { Module } from '@medusajs/framework/utils';
import FirebaseService from './service';

export const FIREBASE_MODULE = 'firebase';

export default Module(FIREBASE_MODULE, {
  service: FirebaseService,
});