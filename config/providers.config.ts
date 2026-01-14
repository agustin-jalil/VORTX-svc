// config/providers.config.ts
// Separa cada provider en su propia función para mejor mantenibilidad

interface ProviderConfig {
  enabled: boolean;
  config: any;
}

// FILE STORAGE PROVIDERS
export function getFileStorageProvider(): ProviderConfig {
  const {
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
    BACKEND_URL,
  } = process.env;

  const useMinIO = Boolean(MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY);

  return {
    enabled: true,
    config: {
      key: 'FILE',
      resolve: '@medusajs/file',
      options: {
        providers: [
          useMinIO
            ? {
                resolve: './src/modules/minio-file',
                id: 'minio',
                options: {
                  endPoint: MINIO_ENDPOINT,
                  accessKey: MINIO_ACCESS_KEY,
                  secretKey: MINIO_SECRET_KEY,
                  bucket: MINIO_BUCKET || 'medusa-media',
                },
              }
            : {
                resolve: '@medusajs/file-local',
                id: 'local',
                options: {
                  upload_dir: 'static',
                  backend_url: `${BACKEND_URL}/static`,
                },
              },
        ],
      },
    },
  };
}

// PAYMENT PROVIDERS
export function getPaymentProviders(): ProviderConfig {
  const {
    STRIPE_API_KEY,
    STRIPE_WEBHOOK_SECRET,
    MERCADOPAGO_ACCESS_TOKEN,
    MERCADOPAGO_SANDBOX,
  } = process.env;

  const stripeEnabled = Boolean(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET);
  const mercadoPagoEnabled = Boolean(MERCADOPAGO_ACCESS_TOKEN);

  if (!stripeEnabled && !mercadoPagoEnabled) {
    return { enabled: false, config: null };
  }

  const providers = [];

  if (stripeEnabled) {
    providers.push({
      resolve: '@medusajs/payment-stripe',
      id: 'stripe',
      options: {
        apiKey: STRIPE_API_KEY,
        webhookSecret: STRIPE_WEBHOOK_SECRET,
      },
    });
  }

  return {
    enabled: providers.length > 0,
    config: {
      key: 'PAYMENT',
      resolve: '@medusajs/payment',
      options: { providers },
    },
  };
}

// NOTIFICATION PROVIDERS
export function getNotificationProvider(): ProviderConfig {
  const {
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
  } = process.env;

  const sendgridEnabled = Boolean(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL);
  const resendEnabled = Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL);

  if (!sendgridEnabled && !resendEnabled) {
    return { enabled: false, config: null };
  }

  const providers = [];

  if (sendgridEnabled) {
    providers.push({
      resolve: '@medusajs/notification-sendgrid',
      id: 'sendgrid',
      options: {
        channels: ['email'],
        api_key: SENDGRID_API_KEY,
        from: SENDGRID_FROM_EMAIL,
      },
    });
  }

  if (resendEnabled) {
    providers.push({
      resolve: './src/modules/email-notifications',
      id: 'resend',
      options: {
        channels: ['email'],
        api_key: RESEND_API_KEY,
        from: RESEND_FROM_EMAIL,
      },
    });
  }

  return {
    enabled: true,
    config: {
      key: 'NOTIFICATION',
      resolve: '@medusajs/notification',
      options: { providers },
    },
  };
}

// REDIS SERVICES (Event Bus + Workflow Engine)
export function getRedisServices(): ProviderConfig[] {
  const { REDIS_URL } = process.env;

  if (!REDIS_URL) {
    return [];
  }

  return [
    {
      enabled: true,
      config: {
        key: 'EVENT_BUS',
        resolve: '@medusajs/event-bus-redis',
        options: { redisUrl: REDIS_URL },
      },
    },
    {
      enabled: true,
      config: {
        key: 'WORKFLOW_ENGINE',
        resolve: '@medusajs/workflow-engine-redis',
        options: {
          redis: { url: REDIS_URL },
        },
      },
    },
  ];
}

// CUSTOM MODULES
export function getCustomModules(): ProviderConfig[] {
  const {
    AZURE_FACE_ENDPOINT,
    AZURE_FACE_KEY,
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    MERCADOPAGO_ACCESS_TOKEN,
    MERCADOPAGO_SANDBOX,
  } = process.env;

  const modules: ProviderConfig[] = [];

  // Azure Face Recognition
  if (AZURE_FACE_ENDPOINT && AZURE_FACE_KEY) {
    modules.push({
      enabled: true,
      config: {
        resolve: './src/modules/face',
        options: {
          endpoint: AZURE_FACE_ENDPOINT,
          apiKey: AZURE_FACE_KEY,
        },
      },
    });
  }

  // Firebase
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    modules.push({
      enabled: true,
      config: {
        resolve: './src/modules/firebase',
        options: {
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY,
        },
      },
    });
  }

  // MercadoPago
  if (MERCADOPAGO_ACCESS_TOKEN) {
    modules.push({
      enabled: true,
      config: {
        resolve: './src/modules/mercadopago',
        options: {
          accessToken: MERCADOPAGO_ACCESS_TOKEN,
          sandbox: MERCADOPAGO_SANDBOX === 'true',
        },
      },
    });
  }

  modules.push({
    enabled: true,
    config: {
      resolve: './src/modules/wishlist',
      options: {}
    }
  })

  return modules;
}

// SEARCH PLUGIN
export function getMeilisearchPlugin(): ProviderConfig {
  const { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } = process.env;

  if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_KEY) {
    return { enabled: false, config: null };
  }

  return {
    enabled: true,
    config: {
      resolve: '@rokmohar/medusa-plugin-meilisearch',
      options: {
        config: {
          host: MEILISEARCH_HOST,
          apiKey: MEILISEARCH_ADMIN_KEY,
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
          },
        },
      },
    },
  };
}

// HELPER: Filter enabled configs
export function enabledConfigs(configs: ProviderConfig[]): any[] {
  return configs.filter((c) => c.enabled).map((c) => c.config);
}
