"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  getPaddleInstance: () => getPaddleInstance,
  getStripeInstance: () => getStripeInstance,
  resetPaddleInstance: () => resetPaddleInstance
});
module.exports = __toCommonJS(client_exports);

// src/providers/paddle/client.ts
var import_paddle_js = require("@paddle/paddle-js");
var paddleInstance = null;
var paddlePromise = null;
async function getPaddleInstance(config) {
  if (paddleInstance) return paddleInstance;
  if (!paddlePromise) {
    paddlePromise = (0, import_paddle_js.initializePaddle)({
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPaddleInstance,
  getStripeInstance,
  resetPaddleInstance
});
//# sourceMappingURL=client.cjs.map