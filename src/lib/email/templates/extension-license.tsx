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

interface ExtensionLicenseEmailProps {
  licenseKey: string;
  storeUrl?: string;
}

export function ExtensionLicenseEmail({
  licenseKey,
  storeUrl = 'https://www.llmeter.org/extension',
}: ExtensionLicenseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your LLMeter Live Cost Pro license key</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Your LLMeter Live Cost license</Heading>

          <Text style={paragraph}>
            Thanks for buying the lifetime license. Here is your key — keep this
            email, it is the only place we send it in plain text:
          </Text>

          <Section style={keyBox}>
            <Text style={keyText}>{licenseKey}</Text>
          </Section>

          <Text style={paragraph}>To activate Pro:</Text>
          <Section style={listSection}>
            <Text style={listItem}>1. Install the extension from the Chrome Web Store</Text>
            <Text style={listItem}>2. Open its Settings page (click the icon → Settings)</Text>
            <Text style={listItem}>3. Paste the key under “License” and click Activate</Text>
          </Section>

          <Text style={paragraph}>
            The key works on up to 5 browsers. Need a reset or lost the key?
            Reply to this email.
          </Text>

          <Section style={ctaSection}>
            <a href={storeUrl} style={ctaButton}>
              Get the extension
            </a>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>LLMeter — AI cost monitoring for developers.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '32px', maxWidth: '560px', borderRadius: '8px' };
const heading = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 16px' };
const paragraph = { fontSize: '15px', lineHeight: '24px', color: '#374151', margin: '0 0 12px' };
const keyBox = { backgroundColor: '#0f766e', borderRadius: '8px', padding: '16px', margin: '8px 0 20px', textAlign: 'center' as const };
const keyText = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '20px', letterSpacing: '0.08em', color: '#ffffff', margin: 0 };
const listSection = { margin: '0 0 16px' };
const listItem = { fontSize: '14px', lineHeight: '22px', color: '#374151', margin: '0 0 4px' };
const ctaSection = { textAlign: 'center' as const, margin: '24px 0' };
const ctaButton = { backgroundColor: '#0f766e', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' as const, fontSize: '14px', display: 'inline-block' };
const divider = { borderColor: '#e5e7eb', margin: '24px 0 16px' };
const footer = { fontSize: '12px', color: '#9ca3af', margin: 0 };
