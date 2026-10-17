import { isValidLicenseFormat, normaliseLicenseKey } from './plan';

export const LICENSE_VALIDATE_URL = 'https://www.llmeter.org/api/extension/license/validate';

export interface LicenseValidation {
  valid: boolean;
  plan: 'pro' | 'free';
  /** Reason when invalid (user-readable). */
  reason?: string;
}

interface ValidateResponse {
  valid?: boolean;
  plan?: string;
  error?: string;
}

/**
 * Validate a license key against llmeter.org. Only the key and a random
 * device id are sent — never provider keys or cost data.
 *
 * Network failures are reported as `valid: false` with a reason so the UI can
 * keep the previously validated plan (see background/options).
 */
export async function validateLicense(
  rawKey: string,
  deviceId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LicenseValidation> {
  const key = normaliseLicenseKey(rawKey);
  if (!isValidLicenseFormat(key)) {
    return { valid: false, plan: 'free', reason: 'Key must look like LLM-XXXX-XXXX-XXXX-XXXX.' };
  }

  let res: Response;
  try {
    res = await fetchImpl(LICENSE_VALIDATE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ key, device_id: deviceId }),
    });
  } catch (err) {
    return { valid: false, plan: 'free', reason: `Could not reach llmeter.org: ${(err as Error).message}` };
  }

  if (res.status === 429) {
    return { valid: false, plan: 'free', reason: 'Too many attempts. Try again in a few minutes.' };
  }

  const body = (await res.json().catch(() => null)) as ValidateResponse | null;
  if (res.ok && body?.valid === true) {
    return { valid: true, plan: 'pro' };
  }
  return {
    valid: false,
    plan: 'free',
    reason: body?.error ?? `License server returned HTTP ${res.status}.`,
  };
}
