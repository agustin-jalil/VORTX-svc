import { Logger } from '@medusajs/framework/types';

export type InjectedDependencies = {
  logger: Logger;
};

export type FirebaseServiceOptions = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};