// config/env.validator.ts
// Valida variables de entorno requeridas al inicio

interface EnvValidationError {
  variable: string;
  reason: string;
}

// Variables absolutamente requeridas
const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'COOKIE_SECRET',
] as const;

// Grupos de variables opcionales (si una está presente, todas deben estarlo)
const OPTIONAL_GROUPS = {
  stripe: ['STRIPE_API_KEY', 'STRIPE_WEBHOOK_SECRET'],
  sendgrid: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
  resend: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
  minio: ['MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY'],
  meilisearch: ['MEILISEARCH_HOST', 'MEILISEARCH_ADMIN_KEY'],
  azure_face: ['AZURE_FACE_ENDPOINT', 'AZURE_FACE_KEY'],
  firebase: ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'],
  mercadopago: ['MERCADOPAGO_ACCESS_TOKEN'],
  google_auth: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
} as const;

export function validateEnvironment(): {
  valid: boolean;
  errors: EnvValidationError[];
  warnings: string[];
} {
  const errors: EnvValidationError[] = [];
  const warnings: string[] = [];

  // Validate required variables
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      errors.push({
        variable: varName,
        reason: 'Required variable is missing',
      });
    }
  }

  // Validate optional groups (partial configuration detection)
  for (const [groupName, vars] of Object.entries(OPTIONAL_GROUPS)) {
    const presentVars = vars.filter((v) => process.env[v]);
    const missingVars = vars.filter((v) => !process.env[v]);

    // If some but not all vars are present, warn about incomplete config
    if (presentVars.length > 0 && missingVars.length > 0) {
      warnings.push(
        `Incomplete ${groupName} configuration. Present: [${presentVars.join(', ')}], Missing: [${missingVars.join(', ')}]`
      );
    }
  }

  // Check for development-specific issues
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'supersecret' || process.env.COOKIE_SECRET === 'supersecret') {
      errors.push({
        variable: 'JWT_SECRET/COOKIE_SECRET',
        reason: 'Production environment detected with default secrets. Change these immediately!',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function printValidationResults(): void {
  const { valid, errors, warnings } = validateEnvironment();

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Configuration Warnings:');
    warnings.forEach((w) => console.warn(`   - ${w}`));
  }

  if (!valid) {
    console.error('\n❌ Environment Configuration Errors:');
    errors.forEach((e) => console.error(`   - ${e.variable}: ${e.reason}`));
    console.error('\nPlease fix these errors before starting the application.\n');
    process.exit(1);
  }

  console.log('✅ Environment validation passed\n');
}

// Auto-run validation when imported (can be disabled)
if (process.env.SKIP_ENV_VALIDATION !== 'true') {
  printValidationResults();
}