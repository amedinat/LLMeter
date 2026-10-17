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

interface CustomerMarginEmailProps {
  threshold: number;
  offenders: {
    display_name: string;
    customer_id: string;
    revenue: number;
    cost: number;
    pct: number;
  }[];
  appUrl?: string;
  isTest?: boolean;
}

export function CustomerMarginEmail({
  threshold,
  offenders,
  appUrl = 'https://llmeter.org',
  isTest = false,
}: CustomerMarginEmailProps) {
  const count = offenders.length;
  const previewText = isTest
    ? `[TEST] Email de prueba — tu alerta de margen de cliente está bien configurada`
    : `⚠️ ${count} cliente(s) con costo IA estimado ≥ ${threshold}% de su revenue`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {isTest && (
            <Section style={testBanner}>
              <Text style={testBannerText}>
                🧪 <strong>Email de prueba.</strong> Tu alerta de margen de cliente está correctamente configurada y la entrega de email funciona. Los valores mostrados son ficticios.
              </Text>
            </Section>
          )}
          <Heading style={heading}>⚠️ Alerta de Margen de Cliente</Heading>

          <Section style={alertBox}>
            <Text style={alertLabel}>
              Estos clientes tienen un <strong>costo de IA estimado</strong> (calculado a partir de tokens, no facturado) que alcanzó o superó el <strong>{threshold}%</strong> de su revenue mensual.
            </Text>
          </Section>

          <Section style={tableSection}>
            <table style={table} cellPadding={0} cellSpacing={0}>
              <thead>
                <tr>
                  <th style={thLeft}>Cliente</th>
                  <th style={thRight}>Revenue</th>
                  <th style={thRight}>Costo IA est.</th>
                  <th style={thRight}>% del revenue</th>
                </tr>
              </thead>
              <tbody>
                {offenders.map((o, i) => (
                  <tr key={i}>
                    <td style={tdLeft}>{o.display_name || o.customer_id}</td>
                    <td style={tdRight}>${o.revenue.toFixed(2)}</td>
                    <td style={tdRight}>${o.cost.toFixed(2)}</td>
                    <td style={tdRightStrong}>{o.pct.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section style={ctaSection}>
            <a href={`${appUrl}/customers`} style={ctaButton}>
              Ver Clientes
            </a>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            LLMeter — Monitoreo de costos para APIs de IA. El costo por cliente es
            estimado a partir de tokens; el revenue se ingresa manualmente.
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

const alertLabel = {
  fontSize: '14px',
  color: '#78350f',
  margin: '0',
  lineHeight: '1.5',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const tableSection = {
  marginTop: '20px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const thLeft = {
  fontSize: '12px',
  fontWeight: '600' as const,
  color: '#374151',
  textAlign: 'left' as const,
  padding: '8px',
  borderBottom: '1px solid #e5e7eb',
};

const thRight = {
  fontSize: '12px',
  fontWeight: '600' as const,
  color: '#374151',
  textAlign: 'right' as const,
  padding: '8px',
  borderBottom: '1px solid #e5e7eb',
};

const tdLeft = {
  fontSize: '13px',
  color: '#1f2937',
  textAlign: 'left' as const,
  padding: '8px',
  borderBottom: '1px solid #f3f4f6',
};

const tdRight = {
  fontSize: '13px',
  color: '#4b5563',
  textAlign: 'right' as const,
  padding: '8px',
  borderBottom: '1px solid #f3f4f6',
};

const tdRightStrong = {
  fontSize: '13px',
  fontWeight: '700' as const,
  color: '#92400e',
  textAlign: 'right' as const,
  padding: '8px',
  borderBottom: '1px solid #f3f4f6',
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

const testBanner = {
  backgroundColor: '#dbeafe',
  border: '1px solid #60a5fa',
  borderRadius: '6px',
  padding: '12px 16px',
  marginBottom: '20px',
};

const testBannerText = {
  fontSize: '13px',
  color: '#1e40af',
  margin: '0',
  lineHeight: '1.5',
};

export default CustomerMarginEmail;
