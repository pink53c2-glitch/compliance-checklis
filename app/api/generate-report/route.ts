import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import { supabase } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, answers } = body;

    if (!email || !answers) {
      return NextResponse.json({ error: 'Missing email or answers data' }, { status: 400 });
    }

    // ── Compute failed questions up-front (needed for summary card) ──
    const failedQuestionIds = Object.entries(answers)
      .filter(([_, isSecure]) => isSecure === false)
      .map(([questionId]) => questionId);

    // ═══════════════════════════════════════════════════════════════
    // PDF GENERATION
    // ═══════════════════════════════════════════════════════════════
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    // ── Design tokens ────────────────────────────────────────────
    const PW = 210;
    const ML = 18;
    const CW = PW - ML * 2;

    // Palette
    const BLACK      = [9,   9,   11 ];
    const BLUE       = [37,  99,  235];
    const BLUE_FAINT = [239, 246, 255];
    const RED        = [220, 38,  38 ];
    const RED_FAINT  = [254, 242, 242];
    const GREEN      = [22,  163, 74 ];
    const GREEN_FAINT= [240, 253, 244];
    const ZINC_100   = [244, 244, 245];
    const ZINC_200   = [228, 228, 231];
    const ZINC_400   = [161, 161, 170];
    const ZINC_500   = [113, 113, 122];
    const WHITE      = [255, 255, 255];

    // Shorthand helpers
    const f = (c: number[]) => doc.setFillColor(c[0], c[1], c[2]);
    const s = (c: number[]) => doc.setDrawColor(c[0], c[1], c[2]);
    const t = (c: number[]) => doc.setTextColor(c[0], c[1], c[2]);

    let pageNum = 1;

    // ── Footer (called on each page before addPage or at end) ────
    const drawFooter = () => {
      const fy = 286;
      s(ZINC_200); doc.setLineWidth(0.25);
      doc.line(ML, fy, PW - ML, fy);
      t(ZINC_400); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      doc.text('stackgap.xyz  ·  Automated Security Intelligence', ML, fy + 5);
      doc.text(`Page ${pageNum}`, PW - ML, fy + 5, { align: 'right' });
    };

    // ── HEADER ──────────────────────────────────────────────────
    // Dark band
    f(BLACK); doc.rect(0, 0, PW, 44, 'F');
    // Blue accent stripe at bottom of header
    f(BLUE); doc.rect(0, 42, PW, 2, 'F');

    // Two-tone logo: STACK (white) + GAP (blue)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    t(WHITE); doc.text('STACK', ML, 27);
    const stackW = doc.getTextWidth('STACK');
    t(BLUE); doc.text('GAP', ML + stackW, 27);

    // Right-side header labels
    t(ZINC_400); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('VULNERABILITY ASSESSMENT REPORT', PW - ML, 21, { align: 'right' });
    doc.text('AUTOMATED  ·  CONFIDENTIAL', PW - ML, 30, { align: 'right' });

    // ── META STRIP ───────────────────────────────────────────────
    let y = 57;

    t(ZINC_400); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('TARGET', ML, y);
    doc.text('DATE', PW - ML - 52, y);

    y += 5;
    t(BLACK); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
    doc.text(email, ML, y);
    t(ZINC_500); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(
      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      PW - ML - 52, y
    );

    y += 8;
    s(ZINC_200); doc.setLineWidth(0.3);
    doc.line(ML, y, PW - ML, y);

    // ── RISK OVERVIEW CARD ───────────────────────────────────────
    y += 10;
    const isAtRisk    = failedQuestionIds.length > 0;
    const riskBg      = isAtRisk ? RED_FAINT   : GREEN_FAINT;
    const riskAccent  = isAtRisk ? RED          : GREEN;

    // Card background
    f(riskBg); doc.roundedRect(ML, y, CW, 30, 2, 2, 'F');
    // Left accent bar
    f(riskAccent); doc.roundedRect(ML, y, 4, 30, 1, 1, 'F');

    // Eyebrow label
    t(ZINC_500); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('RISK OVERVIEW', ML + 10, y + 9);

    // Large gap count
    t(riskAccent); doc.setFont('helvetica', 'bold'); doc.setFontSize(26);
    const countStr = failedQuestionIds.length.toString();
    doc.text(countStr, ML + 10, y + 23);
    const countW = doc.getTextWidth(countStr);

    // Status line next to count
    doc.setFontSize(9.5);
    const statusLine = isAtRisk
      ? 'CRITICAL GAPS  ·  IMMEDIATE REMEDIATION REQUIRED'
      : 'NO VULNERABILITIES  ·  INFRASTRUCTURE VERIFIED SECURE';
    doc.text(statusLine, ML + 14 + countW, y + 23);

    y += 38;

    // ── SECTION DIVIDER ──────────────────────────────────────────
    let gapsFound = 0;

    if (failedQuestionIds.length > 0) {
      t(ZINC_500); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      const sectionLabel = `IDENTIFIED VULNERABILITIES  (${failedQuestionIds.length})`;
      doc.text(sectionLabel, ML, y);
      const slW = doc.getTextWidth(sectionLabel);
      s(ZINC_200); doc.setLineWidth(0.3);
      doc.line(ML + slW + 5, y - 1.5, PW - ML, y - 1.5);
      y += 9;
    }

    // ── VULNERABILITY CARDS ──────────────────────────────────────
    if (failedQuestionIds.length > 0) {
      const { data: questions, error: dbError } = await supabase
        .from('compliance_questions')
        .select('id, question_text, security_gap, affiliate_link')
        .in('id', failedQuestionIds);

      if (dbError) throw dbError;

      if (questions) {
        questions.forEach((q) => {
          gapsFound++;

          // Pre-calculate line wraps to determine card height
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
          const qLines = doc.splitTextToSize(q.question_text, CW - 22);

          doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
          const gLines = doc.splitTextToSize(`IMPACT  ·  ${q.security_gap}`, CW - 18);

          const linkBlockH  = q.affiliate_link ? 14 : 0;
          const cardH =
            10                          // top padding
            + qLines.length * 5.5       // question text
            + 4                         // gap
            + gLines.length * 4.5       // impact text
            + (q.affiliate_link ? 8 : 4) // pre-link gap or bottom pad
            + linkBlockH                 // link block
            + 6;                         // bottom padding

          // Page overflow guard — check before drawing
          if (y + cardH > 278) {
            drawFooter();
            doc.addPage();
            pageNum++;
            y = 20;
          }

          // ── Card shell ──────────────────────────────────────
          f(ZINC_100); doc.rect(ML, y, CW, cardH, 'F');

          // Red left accent bar (the signature element)
          f(RED); doc.rect(ML, y, 3.5, cardH, 'F');

          // ── VULN ID badge (top-right of card) ───────────────
          const badgeText = `VULN-${String(q.id).padStart(3, '0')}`;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
          const badgeW = doc.getTextWidth(badgeText) + 7;
          f(RED_FAINT); doc.rect(PW - ML - badgeW, y + 4, badgeW, 8, 'F');
          t(RED); doc.text(badgeText, PW - ML - badgeW + 3.5, y + 9.5);

          // ── Question text ────────────────────────────────────
          let cy = y + 10;
          t(BLACK); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
          doc.text(qLines, ML + 9, cy);
          cy += qLines.length * 5.5 + 4;

          // ── Impact text ──────────────────────────────────────
          t(ZINC_500); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
          doc.text(gLines, ML + 9, cy);
          cy += gLines.length * 4.5 + 8;

          // ── Affiliate fix link ───────────────────────────────
          if (q.affiliate_link) {
            f(BLUE_FAINT); doc.rect(ML + 9, cy - 2, CW - 13, 10, 'F');
            t(BLUE); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
            doc.text(`\u2192  ${q.affiliate_link}`, ML + 13, cy + 4.5);
          }

          y += cardH + 5;
        });
      }
    }

    // ── ALL SECURE BANNER ────────────────────────────────────────
    if (gapsFound === 0) {
      if (y + 24 > 278) { drawFooter(); doc.addPage(); pageNum++; y = 20; }
      f(GREEN_FAINT); doc.roundedRect(ML, y, CW, 24, 2, 2, 'F');
      f(GREEN); doc.roundedRect(ML, y, 4, 24, 1, 1, 'F');
      t(GREEN); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('\uD83D\uDEE1  INFRASTRUCTURE VERIFIED SECURE', ML + 10, y + 11);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      t(ZINC_500);
      doc.text('No critical vulnerabilities detected across your security profile.', ML + 10, y + 18);
    }

    // Footer on the last page
    drawFooter();

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // ═══════════════════════════════════════════════════════════════
    // EMAIL TEMPLATE
    // ═══════════════════════════════════════════════════════════════
    const riskHex     = gapsFound > 0 ? '#ef4444' : '#22c55e';
    const riskBg2     = gapsFound > 0 ? '#1c0808' : '#081c0e';
    const riskBorder  = gapsFound > 0 ? '#7f1d1d' : '#14532d';
    const riskStatus  = gapsFound > 0 ? 'ACTION REQUIRED' : 'SECURE';
    const auditDate   = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const emailHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>StackGap Security Report</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0a0a0b;border:1px solid #1f1f23;border-radius:10px;overflow:hidden;">

        <!-- ── HEADER ──────────────────────────────────── -->
        <tr>
          <td style="background:#09090b;border-bottom:2px solid #2563eb;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:22px 32px;">
                  <span style="font-size:20px;font-weight:800;letter-spacing:-0.04em;color:#ffffff;font-family:inherit;">
                    STACK<span style="color:#3b82f6;">GAP</span>
                  </span>
                </td>
                <td align="right" style="padding:22px 32px;">
                  <span style="font-size:10px;color:#3f3f46;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">
                    Security Report
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── BODY ────────────────────────────────────── -->
        <tr>
          <td style="padding:32px;">

            <!-- Title & sub -->
            <h1 style="margin:0 0 6px 0;font-size:21px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
              Your Security Report is Ready
            </h1>
            <p style="margin:0 0 28px 0;font-size:14px;color:#71717a;line-height:1.65;">
              We analyzed your infrastructure posture and found
              <strong style="color:${riskHex};">${gapsFound} exposure${gapsFound !== 1 ? 's' : ''}</strong>
              that require${gapsFound === 1 ? 's' : ''} immediate attention.
            </p>

            <!-- ── Terminal status block (signature element) ── -->
            <div style="background:${riskBg2};border:1px solid ${riskBorder};border-left:3px solid ${riskHex};border-radius:6px;padding:20px 24px;margin-bottom:28px;">

              <!-- Fake shell prompt -->
              <div style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#3f3f46;margin-bottom:14px;letter-spacing:0.02em;">
                $ stackgap --run-audit --target=${email}
              </div>

              <!-- Large gap count hero -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:20px;border-right:1px solid ${riskBorder};vertical-align:middle;">
                    <div style="font-family:'Courier New',Courier,monospace;font-size:52px;font-weight:700;color:${riskHex};line-height:1;letter-spacing:-0.04em;">
                      ${gapsFound}
                    </div>
                    <div style="font-family:'Courier New',Courier,monospace;font-size:9px;color:#3f3f46;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px;">
                      GAPS_FOUND
                    </div>
                  </td>
                  <td style="padding-left:20px;vertical-align:middle;">
                    <div style="font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:700;color:${riskHex};letter-spacing:0.01em;">
                      ${riskStatus}
                    </div>
                    <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#52525b;margin-top:6px;line-height:1.6;">
                      DATE=${auditDate}<br>
                      REPORT=ATTACHED
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- ── Attachment callout ──────────────────── -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#111113;border:1px solid #27272a;border-radius:6px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:5px;">
                    &#128206; PDF Report Attached
                  </div>
                  <div style="font-size:13px;color:#52525b;line-height:1.55;">
                    Your full breakdown — vulnerability detail, impact analysis, and direct remediation links — is attached to this email.
                  </div>
                </td>
              </tr>
            </table>

            <!-- ── Footer ─────────────────────────────── -->
            <div style="border-top:1px solid #1f1f23;padding-top:20px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#3f3f46;">
                StackGap Security Intelligence &nbsp;&middot;&nbsp;
                <a href="https://stackgap.xyz" style="color:#2563eb;text-decoration:none;">stackgap.xyz</a>
              </p>
            </div>

          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

    // ── Send via Resend ──────────────────────────────────────────
    await resend.emails.send({
      from: 'StackGap Security <reports@stackgap.xyz>',
      to: [email],
      subject: `🚨 Action Required: ${gapsFound} Security Gaps Found`,
      html: emailHtmlTemplate,
      attachments: [
        {
          filename: `StackGap_Report_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Report processed. Found ${gapsFound} gaps.`,
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}