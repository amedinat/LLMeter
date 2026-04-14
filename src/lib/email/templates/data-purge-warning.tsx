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

interface DataPurgeWarningEmailProps {
  name: string;
  daysLeft: number;
  purgeDate: string;
  dashboardUrl?: string;
}

export function DataPurgeWarningEmail({
  name,
  daysLeft,
  purgeDate,
  dashboardUrl = 'https://llmeter.org/dashboard',
}: DataPurgeWarningEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`Your LLMeter usage data will be deleted in ${daysLeft} days`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Your data will be deleted soon</Heading>

          <Text style={paragraph}>Hi {name},</Text>

          <Text style={paragraph}>
            We noticed you haven&apos;t logged into LLMeter in a while. As part of
            our Free plan data retention policy, your usage data will be
            permanently deleted on <strong>{purgeDate}</strong> ({String(daysLeft)}{' '}
            day{daysLeft !== 1 ? 's' : ''} from now).
          </Text>

          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>What gets deleted:</strong> All your usage records and
              per-customer cost data.
            </Text>
            <Text style={infoText}>
              <strong>What stays:</strong> Your account, provider connections,
              and alert configurations remain intact.
            </Text>
          </Section>

          <Text style={paragraph}>
            To keep your data, simply log in before {purgeDate}. Or upgrade to
            Pro for extended data retention (up to 1 year).
          </Text>

          <Section style={ctaSection}>
            <a href={dashboardUrl} style={ctaButton}>
              Log In Now
            </a>
          </Section>

          <Section style={upgradeSection}>
            <a href={`${dashboardUrl.replace('/dashboard', '')}/pricing`} style={upgradeLink}>
              Or upgrade to Pro for $19/mo →
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
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #fca5a5',
  margin: '16px 0',
};

const infoText = {
  fontSize: '14px',
  color: '#7f1d1d',
  margin: '0 0 8px',
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

const upgradeSection = {
  textAlign: 'center' as const,
  marginTop: '12px',
};

const upgradeLink = {
  fontSize: '13px',
  color: '#2563eb',
  textDecoration: 'underline',
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

export default DataPurgeWarningEmail;
