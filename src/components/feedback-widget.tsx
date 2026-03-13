'use client';

import { FeedbackWidget } from '@simplifai-solutions/saas-pulse-sdk';

export function SaasPulseFeedback({ userRef }: { userRef?: string }) {
  const apiKey = process.env.NEXT_PUBLIC_SAAS_PULSE_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_SAAS_PULSE_URL;
  const ingestUrl = process.env.NEXT_PUBLIC_SAAS_PULSE_INGEST_URL
    || (baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/ingest` : '');

  if (!apiKey || !ingestUrl) return null;

  return (
    <FeedbackWidget
      projectSlug="llmeter"
      apiKey={apiKey}
      ingestUrl={ingestUrl}
      theme="dark"
      accentColor="#6366f1"
      userRef={userRef}
      source="llmeter-dashboard"
    />
  );
}
