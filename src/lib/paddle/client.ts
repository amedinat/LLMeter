'use client';

import { initializePaddle, type Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | null = null;
let paddlePromise: Promise<Paddle | undefined> | null = null;

/**
 * Get or initialize the Paddle.js client-side instance.
 * Uses the client token from NEXT_PUBLIC_PADDLE_CLIENT_TOKEN.
 * Returns null if the token is not configured.
 */
export async function getPaddleInstance(): Promise<Paddle | null> {
  if (paddleInstance) return paddleInstance;

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) {
    console.warn('Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN');
    return null;
  }

  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      token,
      environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'sandbox'
        ? 'sandbox'
        : 'production',
    });
  }

  const instance = await paddlePromise;
  if (instance) {
    paddleInstance = instance;
  }
  return paddleInstance;
}
