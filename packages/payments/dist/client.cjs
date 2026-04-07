"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/providers/paddle/client.ts
var _paddlejs = require('@paddle/paddle-js');
var paddleInstance = null;
var paddlePromise = null;
async function getPaddleInstance(config) {
  if (paddleInstance) return paddleInstance;
  if (!paddlePromise) {
    paddlePromise = _paddlejs.initializePaddle.call(void 0, {
      token: config.clientToken,
      environment: config.environment === "sandbox" ? "sandbox" : "production"
    });
  }
  const instance = await paddlePromise;
  if (instance) {
    paddleInstance = instance;
  }
  return paddleInstance;
}
function resetPaddleInstance() {
  paddleInstance = null;
  paddlePromise = null;
}

// src/providers/stripe/client.ts
async function getStripeInstance(_config) {
  throw new Error("Stripe client is not yet implemented");
}




exports.getPaddleInstance = getPaddleInstance; exports.getStripeInstance = getStripeInstance; exports.resetPaddleInstance = resetPaddleInstance;
//# sourceMappingURL=client.cjs.map