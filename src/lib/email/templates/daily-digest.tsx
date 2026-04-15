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

export interface DailyDigestEmailProps {
  yesterdaySpend: number;
  sevenDayAvg: number;
  topModels: { model: string; provider: string; cost: number }[];
  date: string; // e.g. "April 7, 2026"
  dashboardUrl?: string;
  pricingUrl?: string;
  settingsUrl?: string;
  isProUser?: boolean;
}

export function DailyDigestEmail({
  yesterdaySpend,
  sevenDayAvg,
  topModels = [],
  date,
  dashboardUrl = 'https://llmeter.org/dashboard',
  pricingUrl = 'https://llmeter.org/pricing',
  settingsUrl = 'https://llmeter.org/settings',
  isProUser = false,
}: DailyDigestEmailProps) {
  const diff = sevenDayAvg > 0 ? ((yesterdaySpend - sevenDayAvg) / sevenDayAvg) * 100 : 0;
  const trendLabel =
    diff > 10
      ? `↑ ${diff.toFixed(0)}% above average`
      : diff < -10
        ? `↓ ${Math.abs(diff).toFixed(0)}% below average`
        : '≈ on par with average';
  const trendColor = diff > 10 ? '#dc2626' : diff < -10 ? '#16a34a' : '#6b7280';

  const previewText = `Yesterday you spent $${yesterdaySpend.toFixed(2)} on LLM APIs`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brandLabel}>LLMeter</Text>
          <Heading style={heading}>Your daily LLM cost summary</Heading>
          <Text style={dateText}>{date}</Text>

          <Section style={spendBox}>
            <Text style={spendAmount}>${yesterdaySpend.toFixed(2)}</Text>
            <Text style={spendLabel}>spent yesterday</Text>
            {sevenDayAvg > 0 && (
              <Text style={{ ...trendText, color: trendColor }}>{trendLabel}</Text>
            )}
          </Section>

          {sevenDayAvg > 0 && (
            <Section style={avgSection}>
              <Text style={avgText}>
                7-day average: <strong>${sevenDayAvg.toFixed(2)}/day</strong>
              </Text>
            </Section>
          )}

          {topModels.length > 0 && (
            <Section style={modelsSection}>
              <Text style={subheading}>Top models yesterday</Text>
              {topModels.slice(0, 5).map((m, i) => (
                <Text key={i} style={modelRow}>
                  <span style={modelRank}>#{i + 1}</span>
                  {' '}{m.provider} / {m.model}
                  <span style={modelCost}> — ${m.cost.toFixed(4)}</span>
                </Text>
              ))}
            </Section>
          )}

          {!isProUser && (
            <Section style={upsellBox}>
              <Text style={upsellText}>
                <strong>Set a budget alert</strong> — get notified before you overspend.
                Available on Pro plan.
              </Text>
              <a href={pricingUrl} style={upsellLink}>
                Upgrade to Pro →
              </a>
            </Section>
          )}

          <Section style={ctaSection}>
            <a href={dashboardUrl} style={ctaButton}>
              View Full Dashboard
            </a>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            LLMeter — LLM cost monitoring without a proxy.
            You&apos;re receiving this because you have providers connected.
            <br />
            <a href={settingsUrl} style={footerLink}>
              Manage preferences
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ----- Styles -----
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
  borderRadius: '8px',
};

const brandLabel = {
  fontSize: '12px',
  fontWeight: '700' as const,
  color: '#06b6d4',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '0 0 8px',
};

const heading = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#1a1a1a',
  textAlign: 'center' as const,
  margin: '0 0 4px',
};

const dateText = {
  fontSize: '13px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const spendBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  border: '1px solid #bae6fd',
};

const spendAmount = {
  fontSize: '40px',
  fontWeight: '700' as const,
  color: '#0369a1',
  margin: '0',
};

const spendLabel = {
  fontSize: '14px',
  color: '#0284c7',
  margin: '4px 0 0',
};

const trendText = {
  fontSize: '13px',
  fontWeight: '600' as const,
  margin: '8px 0 0',
};

const avgSection = {
  marginTop: '12px',
  textAlign: 'center' as const,
};

const avgText = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '0',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const modelsSection = {
  marginTop: '20px',
};

const subheading = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#374151',
  margin: '0 0 10px',
};

const modelRow = {
  fontSize: '13px',
  color: '#4b5563',
  margin: '6px 0',
  paddingLeft: '8px',
  borderLeft: '2px solid #e5e7eb',
};

const modelRank = {
  color: '#9ca3af',
  fontWeight: '600' as const,
};

const modelCost = {
  color: '#374151',
  fontWeight: '600' as const,
};

const upsellBox = {
  backgroundColor: '#fafafa',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  marginTop: '20px',
};

const upsellText = {
  fontSize: '13px',
  color: '#374151',
  margin: '0 0 8px',
};

const upsellLink = {
  fontSize: '13px',
  color: '#2563eb',
  fontWeight: '600' as const,
};

const ctaSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
};

const ctaButton = {
  backgroundColor: '#0369a1',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '6px',
  display: 'inline-block',
};

const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  marginTop: '8px',
};

const footerLink = {
  color: '#9ca3af',
};

export default DailyDigestEmail;
