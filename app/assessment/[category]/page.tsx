'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { ComplianceQuestion } from '@/types';

// ─── JSON-LD Schema ───────────────────────────────────────────────────────────
const jsonLdSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "B2B Infrastructure & Compliance Gap Analysis",
  "applicationCategory": "SecurityApplication",
  "description": "Interactive tool that identifies organization infrastructure gaps and generates a personalized remediation blueprint.",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
};

type Answers = Record<string, boolean | null>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };

// ─── Local attack scenario mapping (by question_number) ───────────────────────
const attackScenarios: Record<number, { scenario: string; timeToExploit: string; fixTime: string }> = {
  1:  { scenario: "A remote employee connects from hotel Wi-Fi. An attacker on the same network runs a man-in-the-middle attack and captures credentials in plaintext. Within 20 minutes they're inside your corporate network — with zero alerts fired.",                                                                      timeToExploit: "< 20 min",            fixTime: "1–2 hrs to deploy"        },
  2:  { scenario: "An employee reuses their LinkedIn password for your internal CRM. After a 2024 credential breach it surfaces on a dark web dump. An automated bot tries it across 200 of your services and gains entry within hours — silently.",                                                                       timeToExploit: "< 6 hours",           fixTime: "30 min to onboard"        },
  3:  { scenario: "An employee leaves on bad terms. Without centralised IAM, their access to 6 SaaS tools stays active for weeks. They log in from a personal device, download your client list, and share it with a competitor — and you have no logs to prove it.",                                                      timeToExploit: "Days to weeks",       fixTime: "Half-day to configure"    },
  4:  { scenario: "A fake invoice PDF arrives in a finance employee's inbox. Opening it silently installs a ransomware dropper. Without EDR, it spreads to 14 machines and encrypts your file server overnight — discovered at 7am on a Monday.",                                                                          timeToExploit: "< 2 hours",           fixTime: "Agent deploys in minutes" },
  5:  { scenario: "Ransomware encrypts your primary database. Your last backup is 72 hours old and lives on the same network share — also encrypted. You're choosing between paying the ransom or rebuilding your data from scratch.",                                                                                     timeToExploit: "Upon any incident",   fixTime: "1 day to configure"       },
  6:  { scenario: "Attackers probe your public-facing app for 3 days undetected, find a SQL injection vulnerability, and extract your customer database of 40,000 records. They're gone before anyone checks the access logs.",                                                                                            timeToExploit: "3–5 days",            fixTime: "DNS change, < 1 hour"     },
  7:  { scenario: "A CFO receives a convincing email appearing to be from the CEO, requesting an urgent $50K wire transfer. Without phishing simulation training, they comply. By the time it's flagged, the funds are unrecoverable.",                                                                                    timeToExploit: "Seconds (phishing)",  fixTime: "Setup in 1 day"           },
  8:  { scenario: "A critical Windows vulnerability goes unpatched for 6 weeks because IT patches machines manually. A ransomware group targeting that exact CVE scans your IP range, finds you, and deploys their payload within the hour.",                                                                              timeToExploit: "Hours after CVE drop",fixTime: "Automated after setup"    },
  9:  { scenario: "An attacker gains access to a low-privilege cloud account and quietly escalates permissions over 3 weeks. Without centralised logging, the behaviour goes undetected until they exfiltrate your database — and the trail is cold.",                                                                     timeToExploit: "Weeks (slow burn)",   fixTime: "Agent deploys in hours"   },
  10: { scenario: "Your biggest enterprise client sends a security questionnaire. Without documented controls, your team scrambles for 3 weeks assembling evidence. The client pauses the contract — stalling $200K in renewals.",                                                                                         timeToExploit: "Next vendor audit",   fixTime: "Onboard in 1 week"        },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === current ? '20px' : '6px', height: '6px', borderRadius: '3px', background: i < current ? '#22c55e' : i === current ? '#f0f0f0' : '#2a2a2a', transition: 'all 0.3s ease' }} />
      ))}
    </div>
  );
}

function RiskBadge({ level }: { level?: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    critical: { label: 'Critical', color: '#ff4d4d', bg: 'rgba(255,77,77,0.05)',  border: 'rgba(255,77,77,0.2)'  },
    high:     { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.05)', border: 'rgba(249,115,22,0.2)' },
    medium:   { label: 'Medium',   color: '#eab308', bg: 'rgba(234,179,8,0.05)',  border: 'rgba(234,179,8,0.2)'  },
  };
  const style = map[level ?? ''];
  if (!style) return null;
  return (
    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: style.color, background: style.bg, border: `1px solid ${style.border}`, borderRadius: '4px', padding: '2px 6px', fontFamily: '"DM Mono", monospace' }}>
      {style.label}
    </span>
  );
}

function SeverityBreakdown({ critical, high, medium, secure }: { critical: number; high: number; medium: number; secure: number }) {
  const pills = [
    { count: critical, label: 'CRITICAL', color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.3)',  bg: 'rgba(255,77,77,0.07)'  },
    { count: high,     label: 'HIGH',     color: '#f97316', borderColor: 'rgba(249,115,22,0.3)', bg: 'rgba(249,115,22,0.07)' },
    { count: medium,   label: 'MEDIUM',   color: '#eab308', borderColor: 'rgba(234,179,8,0.3)',  bg: 'rgba(234,179,8,0.07)'  },
    { count: secure,   label: 'SECURE',   color: '#22c55e', borderColor: '#1e1e1e',              bg: '#0d0d0d'               },
  ].filter(p => p.count > 0);

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '1rem 0 0', justifyContent: 'center' }}>
      {pills.map(p => (
        <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '10px 16px', border: `1px solid ${p.borderColor}`, borderRadius: '10px', background: p.bg, minWidth: '70px' }}>
          <span style={{ color: p.color, fontSize: '16px', fontWeight: 600 }}>{p.count}</span>
          <span style={{ color: '#555', fontSize: '10px', letterSpacing: '0.05em', fontFamily: '"DM Mono", monospace' }}>{p.label}</span>
        </div>
      ))}
    </div>
  );
}

function ExposureCard({ criticalCount, highCount, mediumCount }: { criticalCount: number; highCount: number; mediumCount: number }) {
  const minExp    = criticalCount * 504_000 + highCount * 252_000 + mediumCount * 84_000;
  const maxExp    = criticalCount * 1_008_000 + highCount * 532_000 + mediumCount * 168_000;
  const riskLabel = criticalCount >= 3 ? 'CRITICAL' : criticalCount >= 1 ? 'HIGH' : 'ELEVATED';

  return (
    <div style={{ background: 'rgba(255,77,77,0.03)', border: '1px solid rgba(255,77,77,0.14)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '0.85rem' }}>
        <div>
          <p style={{ fontSize: '10px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px', fontFamily: '"DM Mono", monospace' }}>
            Estimated Breach Exposure
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ff4d4d', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {fmtMoney(minExp)} – {fmtMoney(maxExp)}
          </p>
        </div>
        <span style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '6px', fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
          ◉ {riskLabel} RISK
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0', borderTop: '1px solid #181818', paddingTop: '0.85rem', flexWrap: 'wrap' }}>
        {[
          { val: '287 days', label: 'Avg. time to detect breach'    },
          { val: '3×',       label: 'Higher breach probability'     },
          { val: '60%',      label: 'SMBs close within 6 months'   },
        ].map((s, i) => (
          <div key={i} style={{ flex: '1 1 90px', paddingRight: i < 2 ? '0.85rem' : 0, borderRight: i < 2 ? '1px solid #181818' : 'none', marginRight: i < 2 ? '0.85rem' : 0 }}>
            <p style={{ fontSize: '1rem', fontWeight: 500, color: '#e0e0e0', margin: '0 0 2px' }}>{s.val}</p>
            <p style={{ fontSize: '10px', color: '#333', margin: 0, fontFamily: '"DM Mono", monospace', lineHeight: 1.4 }}>{s.label}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '10px', color: '#262626', margin: '0.85rem 0 0', fontFamily: '"DM Mono", monospace' }}>
        Source: IBM Cost of a Data Breach 2024 · Verizon DBIR 2024
      </p>
    </div>
  );
}

function InlineRoadmap({ failedQuestions }: { failedQuestions: ComplianceQuestion[] }) {
  const phases = [
    { label: 'Phase 1', timeframe: 'Week 1 – 2',  color: '#ff4d4d', bgRgb: '255,77,77',  badge: 'START HERE', lvl: 'critical' },
    { label: 'Phase 2', timeframe: 'Weeks 3 – 4', color: '#f97316', bgRgb: '249,115,22', badge: 'NEXT',       lvl: 'high'     },
    { label: 'Phase 3', timeframe: 'Month 2',      color: '#eab308', bgRgb: '234,179,8',  badge: 'PLANNED',   lvl: 'medium'   },
  ]
    .map(p => ({ ...p, items: failedQuestions.filter(q => ((q as any).risk_level ?? 'medium') === p.lvl) }))
    .filter(p => p.items.length > 0);

  if (phases.length === 0) return null;

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.1rem' }}>
        <p style={{ fontSize: '10px', color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
          Remediation Roadmap
        </p>
        <div style={{ flex: 1, height: '1px', background: '#1a1a1a' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, gap: '10px' }}>
        {phases.map((p, pi) => (
          <div key={pi} style={{ background: '#0d0d0d', border: `1px solid rgba(${p.bgRgb},0.2)`, borderRadius: '10px', padding: '1.1rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: p.color, opacity: 0.6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <p style={{ fontSize: '10px', color: p.color, letterSpacing: '0.08em', fontFamily: '"DM Mono", monospace', margin: '0 0 2px', textTransform: 'uppercase' }}>{p.label}</p>
                <p style={{ fontSize: '11px', color: '#555', margin: 0, fontFamily: '"DM Mono", monospace' }}>{p.timeframe}</p>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 700, color: p.color, background: `rgba(${p.bgRgb},0.1)`, border: `1px solid rgba(${p.bgRgb},0.25)`, borderRadius: '4px', padding: '2px 6px', fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
                {p.badge}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {p.items.map(q => {
                const sc = attackScenarios[q.question_number];
                return (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: p.color, flexShrink: 0, marginTop: '5px' }} />
                    <div>
                      <p style={{ fontSize: '11px', color: '#c0c0c0', margin: '0 0 1px', fontWeight: 500 }}>{q.tool_category || `Gap ${q.question_number}`}</p>
                      <p style={{ fontSize: '10px', color: '#333', margin: 0, fontFamily: '"DM Mono", monospace' }}>{sc?.fixTime ?? 'See report'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AssessmentPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = use(params);
  const categoryKey    = resolvedParams.category;

  const [questions, setQuestions]         = useState<ComplianceQuestion[]>([]);
  const [answers, setAnswers]             = useState<Answers>({});
  const [email, setEmail]                 = useState('');
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [focusedEmail, setFocusedEmail]   = useState(false);
  const [showResults, setShowResults]     = useState(false);
  const [openScenarios, setOpenScenarios] = useState<Record<string, boolean>>({});

  const toggleScenario = (id: string) =>
    setOpenScenarios(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    async function fetchQuestions() {
      const { data, error } = await supabase
        .from('compliance_questions')
        .select('*')
        .order('question_number', { ascending: true });
      if (error) console.error('Error fetching questions:', error);
      else setQuestions(data ?? []);
      setLoading(false);
    }
    fetchQuestions();
  }, [categoryKey]);

  if (categoryKey !== 'cybersecurity' && !loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#d4d4d8', textTransform: 'capitalize' }}>{categoryKey} Assessment</h1>
          <p style={{ color: '#71717a' }}>Our engineering team is currently mapping this vertical.</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const atRiskCount = Object.values(answers).filter(v => v === false).length;
  const safeCount   = Object.values(answers).filter(v => v === true).length;
  const score       = totalQuestions > 0 ? Math.round((safeCount / totalQuestions) * 100) : 0;

  // Results-specific derived state
  const failedQuestions = questions
    .filter(q => answers[q.id] === false)
    .sort((a, b) => (severityOrder[(a as any).risk_level ?? 'medium'] ?? 9) - (severityOrder[(b as any).risk_level ?? 'medium'] ?? 9));

  const criticalFailed = failedQuestions.filter(q => (q as any).risk_level === 'critical').length;
  const highFailed     = failedQuestions.filter(q => (q as any).risk_level === 'high').length;
  const mediumFailed   = failedQuestions.filter(q => (q as any).risk_level === 'medium').length;
  const secureCount    = totalQuestions - failedQuestions.length;

  const handleAnswer = (questionId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answers }),
      });
      const rawText = await response.text();
      if (!response.ok) {
        try {
          const errorJson = JSON.parse(rawText);
          throw new Error(errorJson.error || `Status ${response.status}`);
        } catch {
          throw new Error(`Status ${response.status}: ${rawText.substring(0, 100)}`);
        }
      }
      setSubmitting(false);
      setShowResults(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Submission error:', error);
      alert(`Backend Error: ${error.message}`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main style={styles.root}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '6rem' }}>
          <div style={styles.spinner} />
          <p style={{ color: '#555', fontSize: '13px', letterSpacing: '0.05em' }}>Loading compliance framework…</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.root}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }} />
      <div style={styles.bgGlow} aria-hidden />

      <div style={styles.container}>

        {/* ════════ ASSESSMENT FORM ════════ */}
        {!showResults ? (
          <>
            <header style={styles.header}>
              <div style={styles.eyebrow}><span style={styles.dot} />Free Security Tool</div>
              <h1 style={styles.h1}>Compliance Gap<br /><span style={styles.h1Accent}>Analysis</span></h1>
              <p style={styles.subtitle}>Answer {totalQuestions} questions. Get an instant report of your security gaps with specific SaaS remediation recommendations.</p>
            </header>

            {totalQuestions > 0 && (
              <div style={styles.progressWrap}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <StepDots total={totalQuestions} current={answeredCount} />
                  <span style={{ fontSize: '12px', color: '#555', fontVariantNumeric: 'tabular-nums' }}>{answeredCount}/{totalQuestions} answered</span>
                </div>
                <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${progress}%` }} /></div>
                
                {/* ── RESTORED: THE LIVE BREACH EXPOSURE TICKER ── */}
                {atRiskCount > 0 && (
                  <div style={{ 
                    marginTop: '1.25rem', padding: '1rem 1.25rem', background: 'rgba(255,77,77,0.05)', 
                    border: '1px solid rgba(255,77,77,0.2)', borderRadius: '8px', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    animation: 'pulseGlow 2s infinite'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4d4d', boxShadow: '0 0 8px #ff4d4d' }}></span>
                      <div>
                        <p style={{ margin: 0, fontSize: '11px', color: '#ff4d4d', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Live Threat Detected</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa' }}>{atRiskCount} vulnerable endpoint{atRiskCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"DM Mono", monospace' }}>Est. Breach Exposure</p>
                      <p style={{ margin: 0, fontSize: '1.2rem', color: '#ff4d4d', fontWeight: 600, fontFamily: '"DM Mono", monospace' }}>{fmtMoney(atRiskCount * 252000)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {questions.length === 0 ? (
                <div style={styles.errorBox}>No questions found — check your Supabase connection.</div>
              ) : (
                questions.map((q, idx) => {
                  const isYes = answers[q.id] === true;
                  const isNo  = answers[q.id] === false;
                  const answered = answers[q.id] !== undefined;
                  return (
                    <div key={q.id} style={{ ...styles.questionCard, borderColor: isNo ? '#ff4d4d33' : answered ? '#22c55e22' : '#1e1e1e', background: isNo ? 'rgba(255,77,77,0.03)' : answered ? 'rgba(34,197,94,0.03)' : '#09090b' }}>
                      <div style={styles.questionHeader}>
                        <span style={styles.questionNum}>{String(q.question_number).padStart(2, '0')}</span>
                        {(q as any).risk_level && <RiskBadge level={(q as any).risk_level} />}
                        {q.tool_category && <span style={styles.categoryPill}>{q.tool_category}</span>}
                      </div>
                      <p style={styles.questionText}>{q.question_text}</p>
                      <div style={styles.radioRow}>
                        <label style={{ ...styles.radioLabel, borderColor: isYes ? '#22c55e' : '#1e1e1e', background: isYes ? 'rgba(34,197,94,0.05)' : 'transparent', color: isYes ? '#22c55e' : '#a1a1aa' }}>
                          <input type="radio" name={`question-${q.id}`} onChange={() => handleAnswer(q.id, true)} required={idx === 0} style={{ display: 'none' }} />
                          <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${isYes ? '#22c55e' : '#3f3f46'}`, background: isYes ? '#22c55e' : 'transparent', flexShrink: 0, transition: 'all 0.15s' }} />
                          Yes — Secured
                        </label>
                        <label style={{ ...styles.radioLabel, borderColor: isNo ? '#ff4d4d' : '#1e1e1e', background: isNo ? 'rgba(255,77,77,0.05)' : 'transparent', color: isNo ? '#ff4d4d' : '#a1a1aa' }}>
                          <input type="radio" name={`question-${q.id}`} onChange={() => handleAnswer(q.id, false)} style={{ display: 'none' }} />
                          <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${isNo ? '#ff4d4d' : '#3f3f46'}`, background: isNo ? '#ff4d4d' : 'transparent', flexShrink: 0, transition: 'all 0.15s' }} />
                          No — At Risk
                        </label>
                      </div>
                    </div>
                  );
                })
              )}

              <div style={styles.emailBlock}>
                <label style={styles.emailLabel}>Work email address</label>
                <p style={styles.emailHelper}>Your personalized PDF report will be sent here.</p>
                <input type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocusedEmail(true)} onBlur={() => setFocusedEmail(false)} required style={{ ...styles.emailInput, borderColor: focusedEmail ? '#f0f0f0' : '#1e1e1e', outline: 'none' }} />
              </div>

              <button type="submit" disabled={submitting || answeredCount < totalQuestions || !email} style={{ ...styles.submitBtn, opacity: (submitting || answeredCount < totalQuestions || !email) ? 0.45 : 1, cursor: (submitting || answeredCount < totalQuestions || !email) ? 'not-allowed' : 'pointer' }}>
                {submitting ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><span style={styles.spinnerSm} /> Generating report…</span> : <>Generate Compliance Report &rarr;</>}
              </button>

              {answeredCount < totalQuestions && totalQuestions > 0 && (
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#52525b', margin: '0' }}>Answer all {totalQuestions} questions to unlock your report</p>
              )}
            </form>
          </>

        ) : (

        /* ════════ RESULTS VIEW ════════ */
          <div style={{ animation: 'fadeUp 0.5s ease both' }}>

            {/* Score header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={styles.eyebrow}>Analysis Complete</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 500, margin: '1rem 0 0.4rem', color: '#a1a1aa', letterSpacing: '0.02em' }}>StackGap Health Score</h3>
              <div style={{ fontSize: '5rem', fontWeight: 800, color: score > 70 ? '#22c55e' : score > 40 ? '#eab308' : '#ff4d4d', lineHeight: 1, marginBottom: '0.5rem' }}>
                {score}<span style={{ fontSize: '2rem', color: '#3f3f46', fontWeight: 400 }}>/100</span>
              </div>
              <p style={{ color: '#555', fontSize: '14px', margin: '0 auto 0', maxWidth: '360px', lineHeight: 1.6 }}>
                PDF report dispatched to <strong style={{ color: '#d4d4d8' }}>{email}</strong>
              </p>
              <SeverityBreakdown critical={criticalFailed} high={highFailed} medium={mediumFailed} secure={secureCount} />
            </div>

            {/* Exposure card */}
            {atRiskCount > 0 && <ExposureCard criticalCount={criticalFailed} highCount={highFailed} mediumCount={mediumFailed} />}

            {/* Gap cards — sorted critical → high → medium */}
            {failedQuestions.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '10px', color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
                    Identified Security Gaps ({failedQuestions.length})
                  </p>
                  <div style={{ flex: 1, height: '1px', background: '#1a1a1a' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {failedQuestions.map((q, idx) => {
                    const sc          = attackScenarios[q.question_number];
                    const riskLevel   = (q as any).risk_level ?? 'medium';
                    const accentMap: Record<string, string> = { critical: '#ff4d4d', high: '#f97316', medium: '#eab308' };
                    const accent      = accentMap[riskLevel] ?? '#ff4d4d';
                    const isOpen      = openScenarios[q.id] ?? false;

                    return (
                      <div key={q.id} style={{ background: '#09090b', border: `1px solid ${accent}22`, borderRadius: '12px', padding: '0', position: 'relative', overflow: 'hidden', animationDelay: `${idx * 50}ms` }} className="solution-card">
                        {/* Left accent bar */}
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: accent }} />

                        <div style={{ padding: '1.25rem 1.25rem 1.25rem 1.5rem' }}>
                          {/* Meta row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#555', letterSpacing: '0.06em' }}>GAP {String(q.question_number).padStart(2, '0')}</span>
                              {(q as any).risk_level && <RiskBadge level={(q as any).risk_level} />}
                            </div>
                            {q.tool_category && (
                              <span style={{ background: '#111', border: '1px solid #1e1e1e', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', color: '#555', fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
                                {q.tool_category}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h2 style={{ fontSize: '1.05rem', fontWeight: 500, color: '#e0e0e0', margin: '0 0 8px', letterSpacing: '-0.01em', lineHeight: 1.4 }}>
                            {q.question_text}
                          </h2>

                          {/* Vulnerability from DB */}
                          <p style={{ color: '#555', fontSize: '13px', lineHeight: 1.65, margin: '0 0 1rem' }}>
                            <strong style={{ color: '#777', fontWeight: 500 }}>Vulnerability: </strong>
                            {q.security_gap || 'Unsecured infrastructure layer exposing internal data.'}
                          </p>

                          {/* Attack scenario toggle */}
                          {sc && (
                            <>
                              <button onClick={() => toggleScenario(q.id)} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0', marginBottom: isOpen ? '0.75rem' : '0' }}>
                                <span style={{ fontSize: '11px', color: accent, fontFamily: '"DM Mono", monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                  {isOpen ? '▾' : '▸'} What an attacker would do
                                </span>
                              </button>

                              {isOpen && (
                                <div style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${accent}22`, borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                                  <p style={{ color: '#999', fontSize: '13px', lineHeight: 1.75, margin: '0 0 10px' }}>{sc.scenario}</p>
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '10px', color: accent, background: `${accent}11`, border: `1px solid ${accent}33`, borderRadius: '4px', padding: '3px 8px', fontFamily: '"DM Mono", monospace' }}>
                                      ⚡ Time to exploit: {sc.timeToExploit}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '4px', padding: '3px 8px', fontFamily: '"DM Mono", monospace' }}>
                                      ✓ Fix time: {sc.fixTime}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Affiliate action bar */}
                        <div style={{ background: 'rgba(24,24,27,0.5)', borderTop: '1px solid #18181b', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '9px', color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: '"DM Mono", monospace' }}>Remediation Protocol</span>
                            <span style={{ fontSize: '12px', color: '#666' }}>{q.affiliate_link ? 'Deploy verified enterprise solution' : 'Review manual policy blueprint'}</span>
                          </div>
                          {q.affiliate_link ? (
                            <a href={q.affiliate_link} target="_blank" rel="noopener noreferrer sponsored"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f4f4f5', color: '#09090b', padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s ease' }}
                              onMouseOver={e => { e.currentTarget.style.background = '#e4e4e7'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseOut={e => { e.currentTarget.style.background = '#f4f4f5'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                              Deploy Solution
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                            </a>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#555', fontStyle: 'italic', background: '#111', padding: '6px 12px', borderRadius: '6px' }}>Internal config required</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Remediation Roadmap */}
            <InlineRoadmap failedQuestions={failedQuestions} />

            {/* Reset */}
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <button
                onClick={() => { setShowResults(false); setAnswers({}); setEmail(''); setOpenScenarios({}); window.scrollTo(0, 0); }}
                style={{ background: 'transparent', border: 'none', color: '#3a3a3a', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', padding: '10px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.04em' }}
              >
                Run a new assessment →
              </button>
            </div>
          </div>
        )}

        <footer style={styles.footer}>
          <span>No account required</span><span style={styles.footerDot}>·</span>
          <span>NIST &amp; ISO 27001 aligned</span><span style={styles.footerDot}>·</span>
          <span>Free forever</span>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { background: #000000; margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(255,77,77,0.1); } 70% { box-shadow: 0 0 0 10px rgba(255,77,77,0); } 100% { box-shadow: 0 0 0 0 rgba(255,77,77,0); } }
        main > div > form > div { animation: fadeUp 0.35s ease both; }
        .solution-card { animation: fadeUp 0.4s ease both; }
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root:          { minHeight: '100vh', background: '#000000', fontFamily: '"DM Sans", sans-serif', color: '#f4f4f5', position: 'relative', overflowX: 'hidden' },
  bgGlow:        { position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.035) 0%, transparent 70%)', pointerEvents: 'none' },
  container:     { maxWidth: '560px', margin: '0 auto', padding: '3rem 1.5rem 4rem', position: 'relative' },
  header:        { marginBottom: '2.5rem' },
  eyebrow:       { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.1em', color: '#22c55e', textTransform: 'uppercase', marginBottom: '1rem', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '20px', padding: '4px 12px' },
  dot:           { width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' },
  h1:            { fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#f4f4f5', margin: '0 0 1rem' },
  h1Accent:      { fontWeight: 500, color: '#ffffff' },
  subtitle:      { fontSize: '14px', color: '#a1a1aa', lineHeight: 1.7, margin: 0 },
  progressWrap:  { marginBottom: '1.75rem' },
  progressTrack: { height: '2px', background: '#18181b', borderRadius: '2px', overflow: 'hidden' },
  progressFill:  { height: '100%', background: 'linear-gradient(90deg, #22c55e, #4ade80)', borderRadius: '2px', transition: 'width 0.4s ease' },
  atRiskBadge:   { marginTop: '8px', fontSize: '12px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '6px' },
  questionCard:  { border: '1px solid #18181b', borderRadius: '10px', padding: '1.25rem', transition: 'border-color 0.2s, background 0.2s' },
  questionHeader:{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  questionNum:   { fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#71717a', letterSpacing: '0.05em' },
  categoryPill:  { fontSize: '9px', textTransform: 'uppercase', color: '#a1a1aa', background: '#18181b', border: '1px solid #27272a', borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.05em' },
  questionText:  { fontSize: '14px', fontWeight: 400, color: '#d4d4d8', lineHeight: 1.6, margin: '0 0 14px' },
  radioRow:      { display: 'flex', gap: '10px' },
  radioLabel:    { flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', border: '1px solid', borderRadius: '7px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease', userSelect: 'none' },
  emailBlock:    { background: '#09090b', border: '1px solid #18181b', borderRadius: '10px', padding: '1.25rem', marginTop: '8px' },
  emailLabel:    { display: 'block', fontSize: '13px', fontWeight: 500, color: '#a1a1aa', marginBottom: '4px', letterSpacing: '0.03em' },
  emailHelper:   { fontSize: '12px', color: '#52525b', margin: '0 0 12px' },
  emailInput:    { width: '100%', padding: '11px 14px', background: '#000000', border: '1px solid', borderRadius: '7px', color: '#f4f4f5', fontSize: '14px', fontFamily: '"DM Sans", sans-serif', transition: 'border-color 0.15s' },
  submitBtn:     { width: '100%', padding: '15px', background: '#f4f4f5', color: '#09090b', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.02em', transition: 'opacity 0.2s, transform 0.1s', marginTop: '4px' },
  footer:        { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '3rem', fontSize: '12px', color: '#3f3f46', flexWrap: 'wrap' },
  footerDot:     { color: '#18181b' },
  errorBox:      { padding: '1rem', background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '8px', color: '#ff4d4d', fontSize: '13px' },
  spinner:       { width: '28px', height: '28px', border: '2px solid #18181b', borderTop: '2px solid #22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  spinnerSm:     { display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #000000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};