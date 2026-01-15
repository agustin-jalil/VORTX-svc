// medusa-config.js - REFACTORIZADO
import { loadEnv, defineConfig } from '@medusajs/utils';
import {
  getFileStorageProvider,
  getPaymentProviders,
  getNotificationProvider,
  getRedisServices,
  getCustomModules,
  getMeilisearchPlugin,
  enabledConfigs,
} from './config/providers.config';

loadEnv(process.env.NODE_ENV, process.cwd());

// Core project configuration
const projectConfig = {
  databaseUrl: process.env.DATABASE_URL,
  databaseLogging: process.env.NODE_ENV === 'development',
  redisUrl: process.env.REDIS_URL,
  workerMode: process.env.WORKER_MODE,
  http: {
    adminCors: "https://vortx-frn-test.up.railway.app,http://localhost:3000,http://localhost:3001,https://backend-test-b960.up.railway.app, http://192.168.11.38:3000",
    authCors: "https://vortx-frn-test.up.railway.app,http://localhost:3000,http://localhost:3001,https://backend-test-b960.up.railway.app, http://192.168.11.38:3000",
    storeCors: "https://vortx-frn-test.up.railway.app,http://localhost:3000,http://localhost:3001,https://backend-test-b960.up.railway.app, http://192.168.11.38:3000",
    jwtSecret: process.env.JWT_SECRET,
    cookieSecret: process.env.COOKIE_SECRET,
  },
  build: {
    rollupOptions: {
      external: ['@medusajs/dashboard', '@medusajs/admin-shared'],
    },
  },
};

// Admin configuration
const adminConfig = {
  backendUrl: process.env.BACKEND_URL,
  disable: process.env.SHOULD_DISABLE_ADMIN === 'true',
};

// Assemble all modules
const modules = enabledConfigs([
  ...getCustomModules(),
  // getFileStorageProvider(),
  ...getRedisServices(),
  getNotificationProvider(),
  getPaymentProviders(),
]);

// Assemble all plugins
const plugins = enabledConfigs([
  getMeilisearchPlugin(),
]);

// Final configuration
const medusaConfig = {
  projectConfig,
  admin: adminConfig,
  modules,
  plugins,
};

// Optional: log in development only
if (process.env.NODE_ENV === 'development') {
  console.log('Medusa Configuration:', JSON.stringify(medusaConfig, null, 2));
}

export default defineConfig(medusaConfig);