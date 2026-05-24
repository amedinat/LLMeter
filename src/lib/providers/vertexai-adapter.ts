import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Google Vertex AI adapter.
 *
 * Credentials format: `project_id::location::access_token`
 *   e.g. `my-gcp-project::us-central1::ya29.a0AfH6SMC...`
 *
 * - project_id: your Google Cloud project ID
 * - location: GCP region (us-central1, europe-west4, etc.)
 * - access_token: OAuth2 bearer token from `gcloud auth print-access-token`
 *   (tokens expire in ~1 hour; refresh with the same command)
 *
 * Validates the connection by listing Vertex AI publisher models.
 * Vertex AI does not expose a per-model usage/billing API accessible via bearer token —
 * use the llmeter SDK wrapper (wrapVertexAI) to capture per-call costs at inference time.
 *
 * API docs: https://cloud.google.com/vertex-ai/generative-ai/docs/reference/rest
 */
export const vertexaiAdapter: ProviderAdapter = {
  type: 'vertexai',

  async validateKey(credentials: string): Promise<boolean> {
    const { projectId, location, accessToken } = parseVertexAICredentials(credentials);

    const url =
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error(
          'Invalid or expired Google access token. Refresh with: gcloud auth print-access-token'
        );
      }
      if (res.status === 403) {
        throw new Error(
          'Access denied. Ensure the Vertex AI API is enabled and the account has the aiplatform.models.list permission.'
        );
      }
      if (res.status === 404) {
        throw new Error(
          `Project "${projectId}" or location "${location}" not found. Check your project ID and region.`
        );
      }
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: { message?: string } })?.error?.message ??
          `Vertex AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _credentials: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Vertex AI does not expose a per-model usage/billing API accessible via bearer token.
    // Use wrapVertexAI() from the llmeter SDK to capture per-call costs at inference time.
    return [];
  },
};

/**
 * Parse the combined credentials string `project_id::location::access_token`.
 * Throws a descriptive error if the format is wrong.
 */
export function parseVertexAICredentials(credentials: string): {
  projectId: string;
  location: string;
  accessToken: string;
} {
  const parts = credentials.split('::');

  if (parts.length < 3) {
    throw new Error(
      'Vertex AI credentials must be in the format: project_id::location::access_token\n' +
        'Example: my-gcp-project::us-central1::ya29.a0AfH6SMC...\n' +
        'Get your access token with: gcloud auth print-access-token'
    );
  }

  const projectId = parts[0].trim();
  const location = parts[1].trim();
  // Access token may contain special chars but not '::'; rejoin remaining parts just in case
  const accessToken = parts.slice(2).join('::').trim();

  if (!projectId) throw new Error('Google Cloud project ID is missing (first segment before ::).');
  if (!location) throw new Error('GCP location is missing (second segment, e.g. us-central1).');
  if (!accessToken) {
    throw new Error(
      'Access token is missing (third segment). Generate it with: gcloud auth print-access-token'
    );
  }

  return { projectId, location, accessToken };
}
