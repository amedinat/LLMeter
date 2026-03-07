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

interface AlertTriggeredEmailProps {
  alertType: 'monthly' | 'daily';
  currentSpend: number;
  threshold: number;
  topContributors?: { model: string; provider: string; cost: number }[];
  dashboardUrl?: string;
}

export function AlertTriggeredEmail({
  alertType,
  currentSpend,
  threshold,
  topContributors = [],
  dashboardUrl = 'https://llmeter.org/dashboard',
}: AlertTriggeredEmailProps) {
  const periodLabel = alertType === 'monthly' ? 'mensual' : 'diario';
  const previewText = `⚠️ Tu gasto ${periodLabel} ($${currentSpend.toFixed(2)}) superó el umbral de $${threshold.toFixed(2)}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>⚠️ Alerta de Presupuesto</Heading>

          <Section style={alertBox}>
            <Text style={alertAmount}>
              ${currentSpend.toFixed(2)}
            </Text>
            <Text style={alertLabel}>
              Gasto {periodLabel} actual
            </Text>
            <Hr style={divider} />
            <Text style={thresholdText}>
              Umbral configurado: <strong>${threshold.toFixed(2)}</strong>
            </Text>
          </Section>

          {topContributors.length > 0 && (
            <Section style={contributorsSection}>
              <Text style={subheading}>Principales contribuyentes:</Text>
              {topContributors.slice(0, 5).map((c, i) => (
                <Text key={i} style={contributorRow}>
                  {c.provider} / {c.model} — ${c.cost.toFixed(2)}
                </Text>
              ))}
            </Section>
          )}

          <Section style={ctaSection}>
            <a href={dashboardUrl} style={ctaButton}>
              Ver Dashboard
            </a>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            LLMeter — Monitoreo de costos para APIs de IA.
            Puedes ajustar o desactivar esta alerta desde tu panel de control.
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

const heading = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#1a1a1a',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const alertBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  border: '1px solid #fbbf24',
};

const alertAmount = {
  fontSize: '36px',
  fontWeight: '700' as const,
  color: '#92400e',
  margin: '0',
};

const alertLabel = {
  fontSize: '14px',
  color: '#78350f',
  margin: '4px 0 0',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const thresholdText = {
  fontSize: '14px',
  color: '#4b5563',
  margin: '0',
};

const subheading = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#374151',
  margin: '0 0 8px',
};

const contributorsSection = {
  marginTop: '20px',
};

const contributorRow = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '4px 0',
  paddingLeft: '8px',
  borderLeft: '2px solid #e5e7eb',
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

const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  marginTop: '8px',
};

export default AlertTriggeredEmail;
