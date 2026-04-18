import { createClient } from '@/lib/supabase/server';
import PDFDocument from 'pdfkit';
import { pulseTrack } from '@/lib/saas-pulse';

/** Validate YYYY-MM-DD date format */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function isValidDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

type UsageRow = {
  date: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  requests: number;
  cost_usd: number;
  providers: { display_name: string } | { display_name: string }[] | null;
};

function getProviderName(providers: UsageRow['providers']): string {
  if (!providers) return '';
  if (Array.isArray(providers)) return providers[0]?.display_name ?? '';
  return providers.display_name;
}

/**
 * GET /api/usage/export/pdf — Download usage records as PDF
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (from && !isValidDate(from)) {
    return new Response('Invalid "from" date format. Use YYYY-MM-DD.', { status: 400 });
  }
  if (to && !isValidDate(to)) {
    return new Response('Invalid "to" date format. Use YYYY-MM-DD.', { status: 400 });
  }

  let query = supabase
    .from('usage_records')
    .select(`
      date,
      model,
      input_tokens,
      output_tokens,
      requests,
      cost_usd,
      providers!inner(provider, display_name)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);

  const { data, error } = await query;

  if (error) {
    console.error('Usage PDF export error:', error);
    return new Response('Failed to fetch usage data', { status: 500 });
  }

  const rows = (data ?? []) as UsageRow[];

  pulseTrack('feature_used', { user_ref: user.id, metadata: { feature: 'export-pdf' } });

  // Build PDF in memory
  const pdfBytes = await buildPdf(rows, from, to);

  const filename = `llmeter-usage${from ? `-${from}` : ''}${to ? `-to-${to}` : ''}.pdf`;

  return new Response(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function buildPdf(
  rows: UsageRow[],
  from: string | null,
  to: string | null
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100; // account for margins

    // --- Header ---
    doc.fontSize(20).font('Helvetica-Bold').text('LLMeter Usage Report', { align: 'center' });
    doc.moveDown(0.5);

    // Date range subtitle
    let subtitle = 'All time';
    if (from && to) subtitle = `${from} to ${to}`;
    else if (from) subtitle = `From ${from}`;
    else if (to) subtitle = `Up to ${to}`;

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text(subtitle, { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown(1);

    // --- Summary stats ---
    const totalCost = rows.reduce((sum, r) => sum + r.cost_usd, 0);
    const totalRequests = rows.reduce((sum, r) => sum + r.requests, 0);
    const totalInput = rows.reduce((sum, r) => sum + r.input_tokens, 0);
    const totalOutput = rows.reduce((sum, r) => sum + r.output_tokens, 0);

    doc.fontSize(12).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Cost:        $${totalCost.toFixed(4)}`);
    doc.text(`Total Requests:    ${totalRequests.toLocaleString()}`);
    doc.text(`Total Input Tokens:  ${totalInput.toLocaleString()}`);
    doc.text(`Total Output Tokens: ${totalOutput.toLocaleString()}`);
    doc.moveDown(1);

    // --- Table ---
    doc.fontSize(12).font('Helvetica-Bold').text('Usage Details');
    doc.moveDown(0.5);

    // Column definitions (x offset, width, label, alignment)
    const cols = [
      { label: 'Date',          width: 80,  align: 'left'  as const },
      { label: 'Provider',      width: 80,  align: 'left'  as const },
      { label: 'Model',         width: 140, align: 'left'  as const },
      { label: 'Requests',      width: 60,  align: 'right' as const },
      { label: 'Input Tok.',    width: 70,  align: 'right' as const },
      { label: 'Output Tok.',   width: 70,  align: 'right' as const },
      { label: 'Cost (USD)',    width: 70,  align: 'right' as const },
    ];
    const rowHeight = 18;

    function drawRow(
      values: string[],
      y: number,
      opts: { bold?: boolean; bg?: string } = {}
    ) {
      let x = 50;
      if (opts.bg) {
        doc.rect(50, y - 3, pageWidth, rowHeight).fill(opts.bg);
        doc.fillColor('#000000');
      }
      doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
      for (let i = 0; i < cols.length; i++) {
        doc.text(values[i] ?? '', x, y, {
          width: cols[i].width,
          align: cols[i].align,
          lineBreak: false,
        });
        x += cols[i].width;
      }
    }

    // Header row
    const headerY = doc.y;
    drawRow(
      cols.map((c) => c.label),
      headerY,
      { bold: true, bg: '#f3f4f6' }
    );
    doc.moveDown(1.2);

    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(50 + pageWidth, doc.y)
      .strokeColor('#d1d5db')
      .lineWidth(0.5)
      .stroke();
    doc.strokeColor('#000000');
    doc.moveDown(0.2);

    if (rows.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text('No usage records found for this period.', { align: 'center' });
      doc.fillColor('#000000');
    } else {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const provider = getProviderName(r.providers);
        const bg = i % 2 === 1 ? '#f9fafb' : undefined;

        // Check if we need a new page
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }

        const rowY = doc.y;
        drawRow(
          [
            r.date,
            provider,
            r.model,
            r.requests.toLocaleString(),
            r.input_tokens.toLocaleString(),
            r.output_tokens.toLocaleString(),
            `$${r.cost_usd.toFixed(6)}`,
          ],
          rowY,
          { bg }
        );
        doc.moveDown(0.9);
      }
    }

    // Footer
    doc.moveDown(1);
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text(`Generated by LLMeter · ${new Date().toISOString().slice(0, 10)}`, {
        align: 'center',
      });

    doc.end();
  });
}
