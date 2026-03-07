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

interface GracePeriodEndingEmailProps {
  name: string;
  daysLeft: number;
  graceEndDate: string;
  plan: string;
  settingsUrl?: string;
}

export function GracePeriodEndingEmail({
  name,
  daysLeft,
  graceEndDate,
  plan,
  settingsUrl = 'https://llmeter.org/settings',
}: GracePeriodEndingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`Action required: your LLMeter ${plan} plan will be downgraded in ${String(daysLeft)} day${daysLeft !== 1 ? 's' : ''}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Payment issue — action required</Heading>

          <Text style={paragraph}>Hi {name},</Text>

          <Text style={paragraph}>
            We were unable to process payment for your LLMeter{' '}
            <strong>{plan}</strong> plan. Your grace period ends on{' '}
            <strong>{graceEndDate}</strong> ({daysLeft} day
            {daysLeft !== 1 ? 's' : ''} remaining).
          </Text>

          <Section style={alertBox}>
            <Text style={alertText}>
              If we can&apos;t collect payment by then, your account will be
              downgraded to the Free plan and you&apos;ll lose access to premium
              features.
            </Text>
          </Section>

          <Text style={paragraph}>
            Please update your payment method to continue using your {plan}{' '}
            features without interruption.
          </Text>

          <Section style={ctaSection}>
            <a href={settingsUrl} style={ctaButton}>
              Update Payment Method
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
  color: '#dc2626',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const paragraph = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const alertBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #fca5a5',
  margin: '16px 0',
};

const alertText = {
  fontSize: '14px',
  color: '#991b1b',
  margin: '0',
  lineHeight: '1.5',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
};

const ctaButton = {
  backgroundColor: '#dc2626',
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

export default GracePeriodEndingEmail;
