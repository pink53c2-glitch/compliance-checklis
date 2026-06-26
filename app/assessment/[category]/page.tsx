'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { ComplianceQuestion } from '../../../types';

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

// ─── Solutions Map (Rich Scenario Data) ───────────────────────────────────────
const solutionsMap: Record<string, {
  severity: 'critical' | 'high' | 'medium';
  framework: string;
  scenario: string;
  timeToExploit: string;
  fixTime: string;
  productFallback: string;
}> = {
  "1": { severity: "critical", framework: "NIST AC-17", productFallback: "VPN / ZTNA", scenario: "A remote employee connects from hotel Wi-Fi. An attacker runs a man-in-the-middle attack and captures credentials in plaintext. Within 20 minutes they're inside your corporate network.", timeToExploit: "< 20 min", fixTime: "1–2 hours to deploy" },
  "2": { severity: "critical", framework: "NIST IA-5", productFallback: "Password Manager", scenario: "An employee reuses a personal password for your internal CRM. After a third-party breach, an automated bot tries it across 200 services and gains entry within hours.", timeToExploit: "< 6 hours", fixTime: "30 min to onboard team" },
  "3": { severity: "high", framework: "NIST AC-2", productFallback: "IAM", scenario: "An employee leaves on bad terms. Without centralised IAM, their access to 6 SaaS tools stays active for weeks. They download your client list and share it with a competitor.", timeToExploit: "Days to weeks", fixTime: "Half-day to configure" },
  "4": { severity: "critical", framework: "NIST SI-3", productFallback: "EDR", scenario: "A fake invoice PDF silently installs a ransomware dropper. Without EDR, it spreads to 14 machines and encrypts your file server overnight.", timeToExploit: "< 2 hours", fixTime: "Agent deploys in minutes" },
  "5": { severity: "high", framework: "NIST CP-9", productFallback: "Cloud Backup", scenario: "Ransomware encrypts your primary database. Your last backup is 72 hours old and lives on the same network share. You're choosing between paying the ransom or rebuilding from scratch.", timeToExploit: "Upon any incident", fixTime: "1 day to configure" },
  "6": { severity: "high", framework: "NIST SC-7", productFallback: "Firewall", scenario: "Attackers probe your public-facing app for 3 days undetected, find a SQL injection vulnerability, and extract your customer database.", timeToExploit: "3–5 days", fixTime: "DNS change, < 1 hour" },
  "7": { severity: "medium", framework: "NIST AT-2", productFallback: "Training", scenario: "A CFO receives a convincing email appearing to be from the CEO requesting an urgent wire transfer. Without simulation training, they comply.", timeToExploit: "Seconds (phishing)", fixTime: "Setup in 1 day" },
  "8": { severity: "high", framework: "NIST SI-2", productFallback: "Patch Mgmt", scenario: "A critical Windows vulnerability goes unpatched for 6 weeks. A ransomware group targeting that exact CVE scans your IP range and deploys their payload within the hour.", timeToExploit: "Hours after disclosure", fixTime: "Automated after setup" },
  "9": { severity: "high", framework: "NIST AU-6", productFallback: "Log Management", scenario: "An attacker gains access to a low-privilege cloud account and escalates permissions over 3 weeks. Without centralized logging, the behavior goes undetected until data is exfiltrated.", timeToExploit: "Weeks (slow burn)", fixTime: "Agent deploys in hours" },
  "10":{ severity: "medium", framework: "ISO 27001", productFallback: "Compliance", scenario: "Your biggest enterprise client sends a security questionnaire. Without documented controls, your team scrambles for weeks assembling evidence, stalling renewals.", timeToExploit: "Next vendor audit", fixTime: "Onboard in 1 week" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === current ? '20px' : '6px', height: '6px', borderRadius: '3px', background: i < current ? '#22c55e' : i === current ? '#f0f0f0' : '#27272a', transition: 'all 0.3s ease' }} />
      ))}
    </div>
  );
}

function RiskBadge({ level }: { level?: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    critical: { label: 'Critical', color: '#ff4d4d', bg: 'rgba(255,77,77,0.05)', border: 'rgba(255,77,77,0.2)' },
    high:     { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.05)', border: 'rgba(249,115,22,0.2)' },
    medium:   { label: 'Medium',   color: '#eab308', bg: 'rgba(234,179,8,0.05)', border: 'rgba(234,179,8,0.2)' },
  };
  const style = map[level ?? 'medium'];
  return (
    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: style.color, background: style.bg, border: `1px solid ${style.border}`, borderRadius: '4px', padding: '2px 6px', fontFamily: '"DM Mono", monospace' }}>
      {style.label}
    </span>
  );
}

function RemediationRoadmap({ failedGaps }: { failedGaps: ComplianceQuestion[] }) {
  if (failedGaps.length === 0) return null;

  // Crucial Fix: Map using question_number instead of id
  const getSeverity = (q: ComplianceQuestion) => solutionsMap[String(q.question_number)]?.severity || 'medium';
  
  const phase1 = failedGaps.filter(q => getSeverity(q) === "critical");
  const phase2 = failedGaps.filter(q => getSeverity(q) === "high");
  const phase3 = failedGaps.filter(q => getSeverity(q) === "medium");

  const phases = [
    { label:"Phase 1", timeframe:"Week 1 – 2", color:"#ff4d4d", bgRgb:"255,77,77", items: phase1, badge:"START HERE" },
    { label:"Phase 2", timeframe:"Weeks 3 – 4", color:"#f97316", bgRgb:"249,115,22", items: phase2, badge:"NEXT" },
    { label:"Phase 3", timeframe:"Month 2", color:"#eab308", bgRgb:"234,179,8", items: phase3, badge:"PLANNED" },
  ].filter(p => p.items.length > 0);

  return (
    <div style={{ marginTop:"3rem", animation: 'fadeUp 0.5s ease both', animationDelay: '0.2s' }}>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"1.25rem" }}>
        <p style={{ fontSize:"10px", color:"#a1a1aa", letterSpacing:"0.1em", textTransform:"uppercase", margin:0, fontFamily:'"DM Mono", monospace' }}>Remediation Roadmap</p>
        <div style={{ flex:1, height:"1px", background:"#1e1e1e" }} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:`repeat(auto-fit, minmax(200px, 1fr))`, gap:"12px" }}>
        {phases.map((phase, pi) => (
          <div key={pi} style={{ background:"#09090b", border:`1px solid #1e1e1e`, borderRadius:"10px", padding:"1.25rem", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", background:phase.color, opacity:0.4 }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
              <div>
                <p style={{ fontSize:"10px", color:phase.color, letterSpacing:"0.08em", fontFamily:'"DM Mono", monospace', margin:"0 0 3px", textTransform:"uppercase" }}>{phase.label}</p>
                <p style={{ fontSize:"11px", color:"#52525b", margin:0, fontFamily:'"DM Mono", monospace' }}>{phase.timeframe}</p>
              </div>
              <span style={{ fontSize:"9px", fontWeight:700, letterSpacing:"0.08em", color:phase.color, background:`rgba(${phase.bgRgb},0.05)`, border:`1px solid rgba(${phase.bgRgb},0.2)`, borderRadius:"4px", padding:"2px 7px", fontFamily:'"DM Mono", monospace', whiteSpace:"nowrap" }}>
                {phase.badge}
              </span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {phase.items.map(q => {
                const sol = solutionsMap[String(q.question_number)];
                return (
                  <div key={q.id} style={{ display:"flex", alignItems:"flex-start", gap:"8px" }}>
                    <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:phase.color, flexShrink:0, marginTop:"5px" }} />
                    <div>
                      <p style={{ fontSize:"12px", color:"#d4d4d8", margin:"0 0 2px", fontWeight:500 }}>{q.tool_category || sol?.productFallback}</p>
                      <p style={{ fontSize:"10px", color:"#52525b", margin:0, fontFamily:'"DM Mono", monospace' }}>{sol?.fixTime || "1 day setup"}</p>
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
  const categoryKey = resolvedParams.category;

  const [questions, setQuestions]   = useState<ComplianceQuestion[]>([]);
  const [answers, setAnswers]       = useState<Answers>({});
  const [email, setEmail]           = useState('');
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [focusedEmail, setFocusedEmail] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scenarioOpenId, setScenarioOpenId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      const { data, error } = await supabase.from('compliance_questions').select('*').order('question_number', { ascending: true });
      if (error) console.error('Error fetching questions:', error);
      else setQuestions(data ?? []);
      setLoading(false);
    }
    fetchQuestions();
  }, [categoryKey]);

  if (categoryKey !== 'cybersecurity' && !loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#d4d4d8', textTransform: 'capitalize' }}>{categoryKey} Assessment</h1>
          <p style={{ color: '#71717a' }}>Our engineering team is currently mapping this vertical.</p>
        </div>
      </div>
    );
  }

  const answeredCount  = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progress       = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  
  // Array of questions answered 'false'
  const failedGapsData = questions.filter(q => answers[q.id] === false);
  const atRiskCount    = failedGapsData.length;
  const safeAnswers    = Object.values(answers).filter(v => v === true).length;
  const score          = totalQuestions > 0 ? Math.round((safeAnswers / totalQuestions) * 100) : 0;

  // Sorting logic for the cards (Critical -> High -> Medium)
  const sortedFailedGaps = [...failedGapsData].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 };
    const sevA = solutionsMap[String(a.question_number)]?.severity || 'medium';
    const sevB = solutionsMap[String(b.question_number)]?.severity || 'medium';
    return (order[sevA] ?? 9) - (order[sevB] ?? 9);
  });

  const minExposure = atRiskCount * 84_000;
  const maxExposure = atRiskCount * 252_000;

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
        try { throw new Error(JSON.parse(rawText).error || `Status ${response.status}`); } 
        catch { throw new Error(`Status ${response.status}: ${rawText.substring(0, 100)}`); }
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
          <p style={{ color: '#71717a', fontSize: '13px', letterSpacing: '0.05em' }}>Loading compliance framework…</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.root}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }} />
      <div style={styles.bgGlow} aria-hidden />

      <div style={styles.container}>
        
        {!showResults ? (
          <>
            <header style={styles.header}>
              <div style={styles.eyebrow}>
                <span style={styles.dot} />
                Free Security Tool
              </div>
              <h1 style={styles.h1}>
                Compliance Gap<br />
                <span style={styles.h1Accent}>Analysis</span>
              </h1>
              <p style={styles.subtitle}>
                Answer {totalQuestions} questions. Get an instant report of your security gaps with specific SaaS remediation recommendations.
              </p>
            </header>

            {totalQuestions > 0 && (
              <div style={styles.progressWrap}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <StepDots total={totalQuestions} current={answeredCount} />
                  <span style={{ fontSize: '12px', color: '#71717a', fontVariantNumeric: 'tabular-nums' }}>
                    {answeredCount}/{totalQuestions} answered
                  </span>
                </div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                </div>
                
                {/* Live Threat Ticker */}
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
                      <p style={{ margin: 0, fontSize: '1.2rem', color: '#ff4d4d', fontWeight: 600, fontFamily: '"DM Mono", monospace' }}>{fmtMoney(maxExposure)}</p>
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
                  const answered  = answers[q.id] !== undefined;
                  const isYes     = answers[q.id] === true;
                  const isNo      = answers[q.id] === false;
                  return (
                    <div
                      key={q.id}
                      style={{
                        ...styles.questionCard,
                        borderColor: isNo ? '#ff4d4d33' : answered ? '#22c55e22' : '#18181b',
                        background: isNo ? 'rgba(255,77,77,0.03)' : answered ? 'rgba(34,197,94,0.03)' : '#09090b',
                      }}
                    >
                      <div style={styles.questionHeader}>
                        <span style={styles.questionNum}>{String(q.question_number).padStart(2, '0')}</span>
                        {q.hasOwnProperty('risk_level') && (q as any).risk_level && <RiskBadge level={(q as any).risk_level} />}
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
                <input
                  type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedEmail(true)} onBlur={() => setFocusedEmail(false)} required
                  style={{ ...styles.emailInput, borderColor: focusedEmail ? '#f0f0f0' : '#1e1e1e', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || answeredCount < totalQuestions || !email}
                style={{ ...styles.submitBtn, opacity: (submitting || answeredCount < totalQuestions || !email) ? 0.45 : 1, cursor: (submitting || answeredCount < totalQuestions || !email) ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><span style={styles.spinnerSm} /> Generating blueprint…</span>
                ) : (
                  <>Generate Remediation Blueprint &rarr;</>
                )}
              </button>

              {answeredCount < totalQuestions && totalQuestions > 0 && (
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#52525b', margin: '0' }}>
                  Answer all {totalQuestions} questions to unlock your report
                </p>
              )}
            </form>
          </>
        ) : (
          
          // ── UPGRADED INLINE RESULTS VIEW WITH SCENARIOS, ROADMAP & SORTING ──
          <div style={{ animation: 'fadeUp 0.5s ease both' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={styles.eyebrow}>Analysis Complete</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '1rem 0 0.5rem', color: '#fff' }}>StackGap Health Score</h3>
              <div style={{ fontSize: '5rem', fontWeight: 800, color: score > 70 ? '#22c55e' : score > 40 ? '#eab308' : '#ff4d4d', lineHeight: 1, marginBottom: '1rem' }}>
                {score}<span style={{ fontSize: '2rem', color: '#52525b', fontWeight: 400 }}>/100</span>
              </div>
              <p style={{ color: '#a1a1aa', fontSize: '15px' }}>
                A detailed PDF remediation blueprint has been securely emailed to <strong style={{ color: '#f4f4f5' }}>{email}</strong>.
              </p>
            </div>

            {atRiskCount > 0 ? (
              <>
                <div style={{ background: 'rgba(255,77,77,0.02)', border: '1px solid rgba(255,77,77,0.15)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#71717a', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px', fontFamily: '"DM Mono", monospace' }}>Estimated Breach Exposure</p>
                      <p style={{ fontSize: '1.9rem', fontWeight: 600, color: '#ff4d4d', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>{fmtMoney(minExposure)} – {fmtMoney(maxExposure)}</p>
                    </div>
                    <span style={{ background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.2)', color: '#ff4d4d', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', padding: '4px 12px', borderRadius: '6px', fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
                      ◉ {atRiskCount >= 3 ? 'CRITICAL' : 'HIGH'} RISK
                    </span>
                  </div>
                  
                  {/* Upgraded 3-Column Exposure Stats */}
                  <div style={{ display: 'flex', gap: '0', borderTop: '1px solid #18181b', paddingTop: '1rem', flexWrap: 'wrap' }}>
                    {[
                      { label:"Avg. days to detect breach", value:"287 Days" },
                      { label:"Likelihood increase vs patched", value:"3.2×" },
                      { label:"SMBs that close within 6 mos", value:"60%" },
                    ].map((stat, i) => (
                      <div key={i} style={{ flex:"1 1 120px", padding:"0 1rem 0 0", borderRight: i < 2 ? "1px solid #1e1e1e" : "none", marginRight: i < 2 ? "1rem" : 0 }}>
                        <p style={{ fontSize:"1.1rem", fontWeight:500, color:"#f4f4f5", margin:"0 0 3px" }}>{stat.value}</p>
                        <p style={{ fontSize:"10px", color:"#71717a", margin:0, fontFamily:'"DM Mono", monospace' }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <h4 style={{ color: '#f4f4f5', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontFamily: '"DM Mono", monospace' }}>
                  Identified Security Gaps:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {sortedFailedGaps.map((q, idx) => {
                    // Match strictly on question_number
                    const solData = solutionsMap[String(q.question_number)] || { scenario: "Attackers exploit unsecured data leading to systemic compromise.", timeToExploit: "Variable", fixTime: "Requires manual review", severity: "medium" };
                    const isScenarioOpen = scenarioOpenId === String(q.id);

                    return (
                      <div key={q.id} style={{ background: '#09090b', border: '1px solid #18181b', borderRadius: '12px', padding: '0', position: 'relative', overflow: 'hidden', animationDelay: `${idx * 50}ms` }} className="solution-card">
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: solData.severity === 'critical' ? '#ff4d4d' : solData.severity === 'high' ? '#f97316' : '#eab308' }} />

                        <div style={{ padding: '1.25rem 1.25rem 1.25rem 1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#71717a', letterSpacing: '0.06em' }}>GAP {String(q.question_number).padStart(2, '0')}</span>
                              <RiskBadge level={solData.severity} />
                            </div>
                            {q.tool_category && (
                              <span style={{ background: '#18181b', border: '1px solid #27272a', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', color: '#a1a1aa', fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
                                {q.tool_category}
                              </span>
                            )}
                          </div>

                          <h2 style={{ fontSize: '1.15rem', fontWeight: 500, color: '#f4f4f5', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                            {q.question_text}
                          </h2>

                          <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, margin: '0 0 1rem' }}>
                            {q.security_gap || 'Unsecured infrastructure layer exposing internal data.'}
                          </p>

                          {/* ── Attack Scenario Toggle ── */}
                          <button
                            onClick={() => setScenarioOpenId(isScenarioOpen ? null : String(q.id))}
                            style={{ display: "flex", alignItems: "center", gap: "7px", background: "transparent", border: "none", cursor: "pointer", padding: "0", marginBottom: isScenarioOpen ? "0.75rem" : "0.5rem" }}
                          >
                            <span style={{ fontSize: "11px", color: solData.severity === 'critical' ? '#ff4d4d' : solData.severity === 'high' ? '#f97316' : '#eab308', fontFamily: '"DM Mono", monospace', letterSpacing: "0.06em", textTransform: "uppercase" }}>
                              {isScenarioOpen ? "▾" : "▸"} What an attacker would do
                            </span>
                          </button>

                          {isScenarioOpen && (
                            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", padding: "1rem 1.1rem", marginBottom: "0.5rem" }}>
                              <p style={{ color: "#d4d4d8", fontSize: "13px", lineHeight: 1.75, margin: "0 0 10px" }}>{solData.scenario}</p>
                              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "10px", color: "#f97316", background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: "4px", padding: "3px 8px", fontFamily: '"DM Mono", monospace' }}>⚡ Time to exploit: {solData.timeToExploit}</span>
                                <span style={{ fontSize: "10px", color: "#22c55e", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "4px", padding: "3px 8px", fontFamily: '"DM Mono", monospace' }}>✓ Fix time: {solData.fixTime}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Affiliate Action Bar */}
                        <div style={{ background: 'rgba(24, 24, 27, 0.4)', borderTop: '1px solid #18181b', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '9px', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: '"DM Mono", monospace' }}>Remediation Protocol</span>
                            <span style={{ fontSize: '12.5px', color: '#d4d4d8' }}>{q.affiliate_link ? 'Deploy verified enterprise solution' : 'Review manual policy blueprint'}</span>
                          </div>
                          
                          {q.affiliate_link ? (
                            <a href={q.affiliate_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ffffff', color: '#09090b', padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s ease' }}>
                              Deploy Solution
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                            </a>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#71717a', fontStyle: 'italic', background: '#18181b', padding: '6px 12px', borderRadius: '6px' }}>Internal configuration required</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <RemediationRoadmap failedGaps={sortedFailedGaps} />
              </>
            ) : (
              <div style={{ background: "rgba(34,197,94,0.02)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "12px", padding: "2.5rem", textAlign: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#22c55e", margin: "0 auto 1rem" }}>✓</div>
                <h2 style={{ color: "#22c55e", margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 500 }}>All Controls Passing</h2>
                <p style={{ color: "#a1a1aa", margin: 0, fontSize: "13px", lineHeight: 1.6 }}>Your infrastructure passed all compliance checkpoints. We recommend re-running this assessment quarterly.</p>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button 
                onClick={() => { setShowResults(false); setAnswers({}); setEmail(''); window.scrollTo(0,0); }}
                style={{ background: 'transparent', border: 'none', color: '#71717a', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', padding: '10px' }}
              >
                Reset and run a new assessment
              </button>
            </div>
          </div>
        )}

        <footer style={styles.footer}>
          <span>No account required</span>
          <span style={styles.footerDot}>·</span>
          <span>NIST &amp; ISO 27001 aligned</span>
          <span style={styles.footerDot}>·</span>
          <span>Free forever</span>
        </footer>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { background: #000000; margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(255,77,77,0.1); } 70% { box-shadow: 0 0 0 10px rgba(255,77,77,0); } 100% { box-shadow: 0 0 0 0 rgba(255,77,77,0); } }
        main > div > form > div { animation: fadeUp 0.35s ease both; }
        .solution-card { animation: fadeUp 0.4s ease both; }
        .solution-card a:hover { background: #e4e4e7 !important; transform: translateY(-1px); }
      `}</style>
    </main>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: '#000000', fontFamily: '"DM Sans", sans-serif', color: '#f4f4f5', position: 'relative', overflowX: 'hidden' },
  bgGlow: { position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.035) 0%, transparent 70%)', pointerEvents: 'none' },
  container: { maxWidth: '560px', margin: '0 auto', padding: '3rem 1.5rem 4rem', position: 'relative' },
  header: { marginBottom: '2.5rem' },
  eyebrow: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.1em', color: '#22c55e', textTransform: 'uppercase', marginBottom: '1rem', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '20px', padding: '4px 12px' },
  dot: { width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' },
  h1: { fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#f4f4f5', margin: '0 0 1rem' },
  h1Accent: { fontWeight: 500, color: '#ffffff' },
  subtitle: { fontSize: '14px', color: '#a1a1aa', lineHeight: 1.7, margin: 0 },
  progressWrap: { marginBottom: '1.75rem' },
  progressTrack: { height: '2px', background: '#18181b', borderRadius: '2px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #22c55e, #4ade80)', borderRadius: '2px', transition: 'width 0.4s ease' },
  atRiskBadge: { marginTop: '8px', fontSize: '12px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '6px' },
  questionCard: { border: '1px solid #18181b', borderRadius: '10px', padding: '1.25rem', transition: 'border-color 0.2s, background 0.2s' },
  questionHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  questionNum: { fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#71717a', letterSpacing: '0.05em' },
  categoryPill: { fontSize: '9px', textTransform: 'uppercase', color: '#a1a1aa', background: '#18181b', border: '1px solid #27272a', borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.05em' },
  questionText: { fontSize: '14px', fontWeight: 400, color: '#d4d4d8', lineHeight: 1.6, margin: '0 0 14px' },
  radioRow: { display: 'flex', gap: '10px' },
  radioLabel: { flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', border: '1px solid', borderRadius: '7px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease', userSelect: 'none' },
  emailBlock: { background: '#09090b', border: '1px solid #18181b', borderRadius: '10px', padding: '1.25rem', marginTop: '8px' },
  emailLabel: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#a1a1aa', marginBottom: '4px', letterSpacing: '0.03em' },
  emailHelper: { fontSize: '12px', color: '#52525b', margin: '0 0 12px' },
  emailInput: { width: '100%', padding: '11px 14px', background: '#000000', border: '1px solid', borderRadius: '7px', color: '#f4f4f5', fontSize: '14px', fontFamily: '"DM Sans", sans-serif', transition: 'border-color 0.15s' },
  submitBtn: { width: '100%', padding: '15px', background: '#f4f4f5', color: '#09090b', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.02em', transition: 'opacity 0.2s, transform 0.1s', marginTop: '4px' },
  footer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '3rem', fontSize: '12px', color: '#3f3f46', flexWrap: 'wrap' },
  footerDot: { color: '#18181b' },
  errorBox: { padding: '1rem', background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '8px', color: '#ff4d4d', fontSize: '13px' },
  spinner: { width: '28px', height: '28px', border: '2px solid #18181b', borderTop: '2px solid #22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  spinnerSm: { display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #000000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}