function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    if (process.env.NODE_ENV === "production" && !fallback) {
      throw new Error(`Missing required environment variable ${name}`);
    }
    return fallback ?? "";
  }
  return value;
}

function bool(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === "true" || raw === "1" || raw === "yes";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appName: required("NEXT_PUBLIC_APP_NAME", "NDC Naija"),
  appUrl: required("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  siteUrl: required("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  adminUrl: required("NEXT_PUBLIC_ADMIN_URL", "http://localhost:3000/admin"),
  databaseUrl: required(
    "DATABASE_URL",
    "postgres://ndc:ndc_local_dev@localhost:5432/ndc_naija",
  ),
  databaseDriver: (process.env.DATABASE_DRIVER ?? "pglite") as "pglite" | "postgres",
  postgresSsl: bool("POSTGRES_SSL", false),
  authSecret: required("AUTH_SECRET", "dev-only-auth-secret-change-me-please-32"),
  encryptionKey: required("ENCRYPTION_KEY", "dev-only-encryption-key-change-me-32"),
  cronSecret: required("CRON_SECRET", "dev-cron-secret"),
  superAdminEmail: required("SUPER_ADMIN_EMAIL", "admin@ndcnaija.org"),
  superAdminPassword: required("SUPER_ADMIN_PASSWORD", "ChangeMe_SuperAdmin_2026!"),
  superAdminName: required("SUPER_ADMIN_NAME", "NDC Super Admin"),
  featureLoans: bool("FEATURE_LOANS_ENABLED", false),
  featureInvestment: bool("FEATURE_INVESTMENT_ENABLED", false),
  featureDisbursement: bool("FEATURE_DISBURSEMENT_ENABLED", false),
  featurePublicEquity: bool("FEATURE_PUBLIC_EQUITY_PORTAL", false),
  paystackSecret: process.env.PAYSTACK_SECRET_KEY ?? "",
  paystackPublic: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? process.env.PAYSTACK_PUBLIC_KEY ?? "",
  paystackWebhook: process.env.PAYSTACK_WEBHOOK_SECRET ?? "",
  flutterwaveSecret: process.env.FLUTTERWAVE_SECRET_KEY ?? "",
  resendKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: required("EMAIL_FROM", "NDC Naija <noreply@ndcnaija.org>"),
  storageDriver: (process.env.STORAGE_DRIVER ?? "local") as "local" | "supabase",
  storageDir: process.env.STORAGE_LOCAL_DIR ?? "./uploads",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnon: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseService: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "ndc-private",
  cloudinaryCloud: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinarySecret: process.env.CLOUDINARY_API_SECRET ?? "",
  githubId: process.env.GITHUB_CLIENT_ID ?? "",
  githubSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  gitlabId: process.env.GITLAB_CLIENT_ID ?? "",
  gitlabSecret: process.env.GITLAB_CLIENT_SECRET ?? "",
  sentryDsn: process.env.SENTRY_DSN ?? "",
  rateLimitWindow: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 80),
};
