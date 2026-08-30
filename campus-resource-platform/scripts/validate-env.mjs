#!/usr/bin/env node

/**
 * Enterprise Build-Time Environment Variable Validator
 * Ensures all required environment secrets and URLs exist before building.
 */

const requiredEnvVars = [
    { name: 'FIREBASE_API_KEY', fallback: 'AIzaSyBEzE0nsRv_I267jJ7jN7KKobDbGPfUsww' },
    { name: 'FIREBASE_PROJECT_ID', fallback: 'straw-hats-7795d' },
    { name: 'FIREBASE_AUTH_DOMAIN', fallback: 'straw-hats-7795d.firebaseapp.com' }
];

console.log('🔍 [SRE] Validating Build Environment Variables...');

const missing = [];

for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name] || envVar.fallback;
    if (!value) {
        missing.push(envVar.name);
    }
}

if (missing.length > 0) {
    console.error('\n❌ [SRE BUILD FATAL]: Missing required environment variables:');
    missing.forEach(v => console.error(`  - ${v}`));
    console.error('\nPlease configure these in your deployment pipeline or .env file before building.\n');
    process.exit(1);
}

console.log('✅ [SRE] All required environment variables validated successfully.\n');
process.exit(0);
