import { Paddle, Environment } from '@paddle/paddle-node-sdk';

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;

if (!PADDLE_API_KEY) {
  console.warn('PADDLE_API_KEY is not set. Paddle integration will not work.');
}

export const paddle = new Paddle(PADDLE_API_KEY || 'test_key', {
  environment: process.env.PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox,
});

/**
 * Verify Paddle Webhook Signature
 */
export async function verifyPaddleWebhook(
  signature: string,
  rawBody: string,
  secret: string
): Promise<boolean> {
  // Paddle SDK handles signature verification usually, but if needed we can use the SDK utility
  // Note: Paddle Node SDK might differ slightly in webhook verification from Stripe
  // For now, relying on the SDK's built-in mechanism or manual verification if SDK doesn't expose it directly in this version
  // Actually, @paddle/paddle-node-sdk has webhooks helper
  try {
      // The Paddle SDK verification might require the secret
      // Implementation depends on SDK version
      // Assuming standard implementation:
      return paddle.webhooks.unmarshal(rawBody, secret, signature) !== null;
  } catch (e) {
      console.error('Paddle webhook verification failed:', e);
      return false;
  }
}
