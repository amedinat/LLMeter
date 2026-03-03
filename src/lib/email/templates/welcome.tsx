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

interface WelcomeEmailProps {
  name: string;
  dashboardUrl?: string;
}

export function WelcomeEmail({
  name,
  dashboardUrl = 'https://llmeter.dev/dashboard',
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to LLMeter — start tracking your AI costs</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to LLMeter!</Heading>

          <Text style={paragraph}>Hi {name},</Text>

          <Text style={paragraph}>
            Thanks for signing up! LLMeter helps you monitor and control your AI
            spending across OpenAI, Anthropic, DeepSeek, Google AI, and
            OpenRouter — all from one dashboard.
          </Text>

          <Text style={paragraph}>Here&apos;s how to get started:</Text>

          <Section style={listSection}>
            <Text style={listItem}>1. Connect your first AI provider</Text>
            <Text style={listItem}>2. Set up a budget alert</Text>
            <Text style={listItem}>3. Watch your costs in real time</Text>
          </Section>

          <Section style={ctaSection}>
            <a href={dashboardUrl} style={ctaButton}>
              Go to Dashboard
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

const listSection = {
  marginBottom: '24px',
};

const listItem = {
  fontSize: '14px',
  color: '#374151',
  margin: '4px 0',
  paddingLeft: '8px',
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

export default WelcomeEmail;
