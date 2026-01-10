import { loadEnv, Modules, defineConfig } from '@medusajs/utils';
import {
  ADMIN_CORS,
  AUTH_CORS,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MEILISEARCH_HOST,
  MEILISEARCH_ADMIN_KEY,
  MERCADOPAGO_ACCESS_TOKEN,
  MERCADOPAGO_SANDBOX, 
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  STORE_URL,
  BACKEND_URL,
  ADMIN_URL
} from 'lib/constants';
import { FaceModule } from "./src/modules/face"

loadEnv(process.env.NODE_ENV, process.cwd());

// Al inicio del archivo, obtén las variables de entorno
const AZURE_FACE_ENDPOINT = process.env.AZURE_FACE_ENDPOINT
const AZURE_FACE_KEY = process.env.AZURE_FACE_KEY

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET
    },
    build: {
      rollupOptions: {
        external: ["@medusajs/dashboard", "@medusajs/admin-shared"]
      }
    }
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    ...(AZURE_FACE_ENDPOINT && AZURE_FACE_KEY ? [{
      resolve: './src/modules/face',
      options: {
        endpoint: AZURE_FACE_ENDPOINT,
        apiKey: AZURE_FACE_KEY,
      }
    }] : []),
    {
      key: Modules.FILE,
      resolve: '@medusajs/file',
      options: {
        providers: [
          ...(MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY ? [{
            resolve: './src/modules/minio-file',
            id: 'minio',
            options: {
              endPoint: MINIO_ENDPOINT,
              accessKey: MINIO_ACCESS_KEY,
              secretKey: MINIO_SECRET_KEY,
              bucket: MINIO_BUCKET // Optional, default: medusa-media
            }
          }] : [{
            resolve: '@medusajs/file-local',
            id: 'local',
            options: {
              upload_dir: 'static',
              backend_url: `${BACKEND_URL}/static`
            }
          }])
        ]
      }
    },
    ...(REDIS_URL ? [{
      key: Modules.EVENT_BUS,
      resolve: '@medusajs/event-bus-redis',
      options: {
        redisUrl: REDIS_URL
      }
    },
    {
      key: Modules.WORKFLOW_ENGINE,
      resolve: '@medusajs/workflow-engine-redis',
      options: {
        redis: {
          url: REDIS_URL,
        }
      }
    }] : []),
    ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL || RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
      key: Modules.NOTIFICATION,
      resolve: '@medusajs/notification',
      options: {
        providers: [
          ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL ? [{
            resolve: '@medusajs/notification-sendgrid',
            id: 'sendgrid',
            options: {
              channels: ['email'],
              api_key: SENDGRID_API_KEY,
              from: SENDGRID_FROM_EMAIL,
            }
          }] : []),
          ...(RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
            resolve: './src/modules/email-notifications',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: RESEND_API_KEY,
              from: RESEND_FROM_EMAIL,
            },
          }] : []),
        ]
      }
    }] : []),
    ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET ? [{
      key: Modules.PAYMENT,
      resolve: '@medusajs/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: STRIPE_API_KEY,
              webhookSecret: STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    }] : []),
    ...(MERCADOPAGO_ACCESS_TOKEN ? [{
      resolve: './src/modules/mercadopago',
      options: {
        accessToken: MERCADOPAGO_ACCESS_TOKEN,
        sandbox: MERCADOPAGO_SANDBOX,
      }
    }] : []),
  ],
  plugins: [
  ...(MEILISEARCH_HOST && MEILISEARCH_ADMIN_KEY ? [{
      resolve: '@rokmohar/medusa-plugin-meilisearch',
      options: {
        config: {
          host: MEILISEARCH_HOST,
          apiKey: MEILISEARCH_ADMIN_KEY
        },
        settings: {
          products: {
            type: 'products',
            enabled: true,
            fields: ['id', 'title', 'description', 'handle', 'variant_sku', 'thumbnail'],
            indexSettings: {
              searchableAttributes: ['title', 'description', 'variant_sku'],
              displayedAttributes: ['id', 'handle', 'title', 'description', 'variant_sku', 'thumbnail'],
              filterableAttributes: ['id', 'handle'],
            },
            primaryKey: 'id',
          }
        }
      }
    }] : []),
    {
      resolve: "medusa-plugin-auth",
      /** @type {import('medusa-plugin-auth').AuthOptions} */
      options: [
        {
          type: "google",
          // strict: "all", // or "none" or "store" or "admin"
          strict: "none",
          identifier: "google",
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          admin: {
            callbackUrl: `${BACKEND_URL}/admin/auth/google/cb`,
            failureRedirect: `${ADMIN_URL}/login`,
            // The success redirect can be overriden from the client by adding a query param `?redirectTo=your_url` to the auth url
            // This query param will have the priority over this configuration
            successRedirect: `${ADMIN_URL}/`
            // authPath: '/admin/auth/google',
            // authCallbackPath: '/admin/auth/google/cb',
            // expiresIn: 24 * 60 * 60 * 1000,
            // verifyCallback: (container, req, accessToken, refreshToken, profile, strict) => {
            //    // implement your custom verify callback here if you need it
            // },
          },
          store: {
            callbackUrl: `${BACKEND_URL}/store/auth/google/cb`,
            failureRedirect: `${STORE_URL}/login`,
            // The success redirect can be overriden from the client by adding a query param `?redirectTo=your_url` to the auth url
            // This query param will have the priority over this configuration
            successRedirect: `${STORE_URL}/`
            // authPath: '/store/auth/google',
            // authCallbackPath: '/store/auth/google/cb',
            // expiresIn: 24 * 60 * 60 * 1000,
            // verifyCallback: (container, req, accessToken, refreshToken, profile, strict) => {
            //    // implement your custom verify callback here if you need it
            // },
          }
        }
      ]
      }
  ]
};

console.log(JSON.stringify(medusaConfig, null, 2));
export default defineConfig(medusaConfig);
