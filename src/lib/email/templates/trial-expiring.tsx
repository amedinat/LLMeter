import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface TrialExpiringEmailProps {
  name: string;
  daysLeft: number;
  trialEndDate: string;
  dashboardUrl?: string;
}

export function TrialExpiringEmail({
  name,
  daysLeft,
  trialEndDate,
  dashboardUrl = 'https://llmeter.org/settings',
}: TrialExpiringEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`Your LLMeter Pro trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Your trial is ending soon</Heading>

          <Text style={paragraph}>Hi {name},</Text>

          <Text style={paragraph}>
            Your LLMeter Pro trial ends on <strong>{trialEndDate}</strong> ({String(daysLeft)}{' '}
            day{daysLeft !== 1 ? 's' : ''} remaining).
          </Text>

          <Section style={infoBox}>
            <Text style={infoText}>
              After your trial ends, your account will be downgraded to the Free
              plan. You&apos;ll lose access to unlimited providers, OpenRouter
              integration, anomaly detection, and extended data retention.
            </Text>
          </Section>

          <Text style={paragraph}>
            To keep your Pro features, make sure you have a payment method on
            file. You won&apos;t be charged until your trial ends.
          </Text>

          <Section style={ctaSection}>
            <a href={dashboardUrl} style={ctaButton}>
              Manage Subscription
            </a>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            LLMeter — AI cost monitoring for developers.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
  borderRadius: '8px',
};

const heading = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#1a1a1a',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const paragraph = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const infoBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #fbbf24',
  margin: '16px 0',
};

const infoText = {
  fontSize: '14px',
  color: '#78350f',
  margin: '0',
  lineHeight: '1.5',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
};

const ctaButton = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '6px',
  display: 'inline-block',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0 16px',
};

const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  marginTop: '8px',
};

export default TrialExpiringEmail;
