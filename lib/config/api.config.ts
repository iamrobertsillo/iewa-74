/**
 * API Configuration
 *
 * This file controls which API implementation is used (mock vs real).
 * Set USE_MOCK_API to false when your backend is ready.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Set to false to use real API implementations
 * Set to true to use mock implementations for testing
 */
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || true;

/**
 * API Base URL for real implementations
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * ProcessWire API Configuration
 */
export const PROCESSWIRE_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_PROCESSWIRE_API_URL || '',
  apiKey: process.env.PROCESSWIRE_API_KEY || '',
};

/**
 * Cloudflare Images Configuration
 */
export const CLOUDFLARE_CONFIG = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
  imagesUrl: process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL || '',
};

/**
 * Stripe Configuration
 */
export const STRIPE_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

/**
 * PayPal Configuration
 */
export const PAYPAL_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  secret: process.env.PAYPAL_SECRET || '',
};

/**
 * Email Service Configuration
 */
export const EMAIL_CONFIG = {
  apiKey: process.env.EMAIL_SERVICE_API_KEY || '',
  fromEmail: process.env.EMAIL_FROM || 'noreply@74years.com',
};

/**
 * Analytics Configuration
 */
export const ANALYTICS_CONFIG = {
  gaId: process.env.NEXT_PUBLIC_GA_ID || '',
  gscId: process.env.NEXT_PUBLIC_GSC_ID || '',
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  /**
   * Enable reservation system
   */
  RESERVATIONS_ENABLED: true,

  /**
   * Reservation duration in milliseconds (3 hours)
   */
  RESERVATION_DURATION: 3 * 60 * 60 * 1000,

  /**
   * Warning time before expiration in milliseconds (15 minutes)
   */
  RESERVATION_WARNING_TIME: 15 * 60 * 1000,

  /**
   * Price per square in cents (€5 = 500 cents)
   */
  PRICE_PER_SQUARE: 500,

  /**
   * Currency
   */
  CURRENCY: 'EUR',

  /**
   * Grid expansion threshold (percentage of occupied squares)
   */
  EXPANSION_THRESHOLD: 0.9,

  /**
   * Enable coupons
   */
  COUPONS_ENABLED: true,

  /**
   * Enable social sharing
   */
  SOCIAL_SHARING_ENABLED: true,

  /**
   * Enable reporting
   */
  REPORTING_ENABLED: true,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a configuration value is set
 */
export function isConfigured(key: keyof typeof PROCESSWIRE_CONFIG | keyof typeof CLOUDFLARE_CONFIG): boolean {
  return Boolean(PROCESSWIRE_CONFIG[key as keyof typeof PROCESSWIRE_CONFIG] || CLOUDFLARE_CONFIG[key as keyof typeof CLOUDFLARE_CONFIG]);
}

/**
 * Get API mode (mock or real)
 */
export function getAPIMode(): 'mock' | 'real' {
  return USE_MOCK_API ? 'mock' : 'real';
}

/**
 * Log configuration status (for debugging)
 */
export function logConfigStatus() {
  if (typeof window === 'undefined') return; // Server-side

  console.log('='.repeat(60));
  console.log('74years.com - API Configuration');
  console.log('='.repeat(60));
  console.log(`Mode: ${getAPIMode().toUpperCase()}`);
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`ProcessWire: ${isConfigured('apiUrl') ? '✅' : '❌'}`);
  console.log(`Cloudflare: ${isConfigured('accountId') ? '✅' : '❌'}`);
  console.log(`Stripe: ${STRIPE_CONFIG.publicKey ? '✅' : '❌'}`);
  console.log(`PayPal: ${PAYPAL_CONFIG.clientId ? '✅' : '❌'}`);
  console.log('='.repeat(60));
}
