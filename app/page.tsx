'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// ─── JSON-LD Schema ───────────────────────────────────────────────────────────
const jsonLdSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Cybersecurity Compliance Checklist Generator",
  "applicationCategory": "SecurityApplication",
  "description": "Free interactive tool that identifies your organization's cybersecurity compliance gaps and generates a personalized remediation blueprint with recommended SaaS tools.",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Instant compliance gap analysis",
    "Custom PDF remediation report",
    "SaaS tool recommendations",
    "NIST, ISO 27001, SOC 2 framework coverage"
  ],
  "audience": {
    "@type": "Audience",
    "audienceType": "IT Managers, Security Engineers, CTOs, Compliance Officers"
  },
  "potentialAction": {
    "@type": "UseAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://yourdomain.com/checklist",
      "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"]
    }
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Question = {
  id: string;
  question_number: number;
  question_text: string;
  category?: string;
  risk_level?: 'critical' | 'high' | 'medium';
};

type Answers = Record<string, boolean | null>;

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? '20px' : '6px',
            height: '6px',
            borderRadius: '3px',
            background: i < current ? '#22c55e' : i === current ? '#f0f0f0' : '#2a2a2a',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

// ─── Risk badge ───────────────────────────────────────────────────────────────
function RiskBadge({ level }: { level?: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    critical: { label: 'Critical', color: '#ff4d4d', bg: 'rgba(255,77,77,0.1)' },
    high:     { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    medium:   { label: 'Medium',   color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  };
  const style = map[level ?? 'medium'];
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: style.color,
      background: style.bg,
      border: `1px solid ${style.color}22`,
      borderRadius: '4px',
      padding: '2px 7px',
    }}>
      {style.label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ChecklistPage() {
  const router = useRouter();
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [answers, setAnswers]       = useState<Answers>({});
  const [email, setEmail]           = useState('');
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [focusedEmail, setFocusedEmail] = useState(false);

  // Fetch questions from Supabase
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
  }, []);

  const answeredCount  = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progress       = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const atRiskCount    = Object.values(answers).filter(v => v === false).length;

  const handleAnswer = (questionId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Send the data to your API to email the PDF
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answers }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // 2. NEW FIX: Find the failed questions and get their actual Question Number (1-10)
      const failedQuestionNumbers = Object.entries(answers)
        .filter(([_, isSecure]) => isSecure === false)
        .map(([id]) => {
          // Look up the actual question object using the ID, and grab its number
          const matchedQuestion = questions.find(q => q.id === id);
          return matchedQuestion ? matchedQuestion.question_number : null;
        })
        .filter(Boolean) // Remove any nulls just in case
        .join(',');

      // 3. Redirect with clean numbers (e.g., ?gaps=1,4,5)
      router.push(`/results?gaps=${failedQuestionNumbers}`);

    } catch (error) {
      console.error('Submission error:', error);
      alert('There was a problem generating your report. Please try again.');
      setSubmitting(false); 
    } 
  };
  // ── Loading state ────────────────────────────────────────────────────────
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

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <main style={styles.root}>

      {/* JSON-LD Schema — server-rendered so AI bots & crawlers read it in raw HTML */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* Ambient background glow */}
      <div style={styles.bgGlow} aria-hidden />

      <div style={styles.container}>

        {/* Header */}
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
            Answer {totalQuestions} questions. Get an instant report of your security gaps
            with specific SaaS remediation recommendations.
          </p>
        </header>

        {/* Progress bar */}
        {totalQuestions > 0 && (
          <div style={styles.progressWrap}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <StepDots total={totalQuestions} current={answeredCount} />
              <span style={{ fontSize: '12px', color: '#555', fontVariantNumeric: 'tabular-nums' }}>
                {answeredCount}/{totalQuestions} answered
              </span>
            </div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
            {atRiskCount > 0 && (
              <p style={styles.atRiskBadge}>
                <span style={{ color: '#ff4d4d' }}>●</span> {atRiskCount} gap{atRiskCount !== 1 ? 's' : ''} detected
              </p>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {questions.length === 0 ? (
            <div style={styles.errorBox}>
              No questions found — check your Supabase connection.
            </div>
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
                    borderColor: isNo ? '#ff4d4d33' : answered ? '#22c55e22' : '#1e1e1e',
                    background: isNo ? 'rgba(255,77,77,0.03)' : answered ? 'rgba(34,197,94,0.03)' : '#0d0d0d',
                  }}
                >
                  <div style={styles.questionHeader}>
                    <span style={styles.questionNum}>
                      {String(q.question_number).padStart(2, '0')}
                    </span>
                    {q.risk_level && <RiskBadge level={q.risk_level} />}
                    {q.category && (
                      <span style={styles.categoryPill}>{q.category}</span>
                    )}
                  </div>

                  <p style={styles.questionText}>{q.question_text}</p>

                  <div style={styles.radioRow}>
                    {/* Yes */}
                    <label
                      style={{
                        ...styles.radioLabel,
                        borderColor: isYes ? '#22c55e' : '#1e1e1e',
                        background: isYes ? 'rgba(34,197,94,0.08)' : 'transparent',
                        color: isYes ? '#22c55e' : '#888',
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        onChange={() => handleAnswer(q.id, true)}
                        required={idx === 0}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        width: '14px', height: '14px', borderRadius: '50%',
                        border: `2px solid ${isYes ? '#22c55e' : '#333'}`,
                        background: isYes ? '#22c55e' : 'transparent',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }} />
                      Yes — Secured
                    </label>

                    {/* No */}
                    <label
                      style={{
                        ...styles.radioLabel,
                        borderColor: isNo ? '#ff4d4d' : '#1e1e1e',
                        background: isNo ? 'rgba(255,77,77,0.08)' : 'transparent',
                        color: isNo ? '#ff4d4d' : '#888',
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        onChange={() => handleAnswer(q.id, false)}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        width: '14px', height: '14px', borderRadius: '50%',
                        border: `2px solid ${isNo ? '#ff4d4d' : '#333'}`,
                        background: isNo ? '#ff4d4d' : 'transparent',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }} />
                      No — At Risk
                    </label>
                  </div>
                </div>
              );
            })
          )}

          {/* Email capture */}
          <div style={styles.emailBlock}>
            <label style={styles.emailLabel}>Work email address</label>
            <p style={styles.emailHelper}>Your personalized PDF report will be sent here.</p>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedEmail(true)}
              onBlur={() => setFocusedEmail(false)}
              required
              style={{
                ...styles.emailInput,
                borderColor: focusedEmail ? '#f0f0f0' : '#1e1e1e',
                outline: 'none',
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || answeredCount < totalQuestions || !email}
            style={{
              ...styles.submitBtn,
              opacity: (submitting || answeredCount < totalQuestions || !email) ? 0.45 : 1,
              cursor: (submitting || answeredCount < totalQuestions || !email) ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span style={styles.spinnerSm} /> Generating report…
              </span>
            ) : (
              <>Generate Compliance Report &rarr;</>
            )}
          </button>

          {answeredCount < totalQuestions && totalQuestions > 0 && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#444', margin: '0' }}>
              Answer all {totalQuestions} questions to unlock your report
            </p>
          )}
        </form>

        {/* Footer trust signals */}
        <footer style={styles.footer}>
          <span>No account required</span>
          <span style={styles.footerDot}>·</span>
          <span>NIST &amp; ISO 27001 aligned</span>
          <span style={styles.footerDot}>·</span>
          <span>Free forever</span>
        </footer>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: #080808; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        main > div > form > div {
          animation: fadeUp 0.35s ease both;
        }
      `}</style>
    </main>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#080808',
    fontFamily: '"DM Sans", sans-serif',
    color: '#f0f0f0',
    position: 'relative',
    overflowX: 'hidden',
  },
  bgGlow: {
    position: 'fixed',
    top: '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '3rem 1.5rem 4rem',
    position: 'relative',
  },
  header: {
    marginBottom: '2.5rem',
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    fontSize: '11px',
    fontFamily: '"DM Mono", monospace',
    letterSpacing: '0.1em',
    color: '#22c55e',
    textTransform: 'uppercase',
    marginBottom: '1rem',
    background: 'rgba(34,197,94,0.07)',
    border: '1px solid rgba(34,197,94,0.15)',
    borderRadius: '20px',
    padding: '4px 12px',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 6px #22c55e',
  },
  h1: {
    fontSize: 'clamp(2rem, 5vw, 2.75rem)',
    fontWeight: 300,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    color: '#f0f0f0',
    margin: '0 0 1rem',
  },
  h1Accent: {
    fontWeight: 500,
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '14px',
    color: '#555',
    lineHeight: 1.7,
    margin: 0,
  },
  progressWrap: {
    marginBottom: '1.75rem',
  },
  progressTrack: {
    height: '2px',
    background: '#1a1a1a',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22c55e, #4ade80)',
    borderRadius: '2px',
    transition: 'width 0.4s ease',
  },
  atRiskBadge: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  questionCard: {
    border: '1px solid #1e1e1e',
    borderRadius: '10px',
    padding: '1.25rem',
    transition: 'border-color 0.2s, background 0.2s',
  },
  questionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  questionNum: {
    fontFamily: '"DM Mono", monospace',
    fontSize: '11px',
    color: '#333',
    letterSpacing: '0.05em',
  },
  categoryPill: {
    fontSize: '10px',
    color: '#444',
    background: '#141414',
    border: '1px solid #1e1e1e',
    borderRadius: '4px',
    padding: '2px 7px',
    letterSpacing: '0.05em',
  },
  questionText: {
    fontSize: '14px',
    fontWeight: 400,
    color: '#c0c0c0',
    lineHeight: 1.6,
    margin: '0 0 14px',
  },
  radioRow: {
    display: 'flex',
    gap: '10px',
  },
  radioLabel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 14px',
    border: '1px solid',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  },
  emailBlock: {
    background: '#0d0d0d',
    border: '1px solid #1e1e1e',
    borderRadius: '10px',
    padding: '1.25rem',
    marginTop: '8px',
  },
  emailLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#888',
    marginBottom: '4px',
    letterSpacing: '0.03em',
  },
  emailHelper: {
    fontSize: '12px',
    color: '#333',
    margin: '0 0 12px',
  },
  emailInput: {
    width: '100%',
    padding: '11px 14px',
    background: '#080808',
    border: '1px solid',
    borderRadius: '7px',
    color: '#f0f0f0',
    fontSize: '14px',
    fontFamily: '"DM Sans", sans-serif',
    transition: 'border-color 0.15s',
  },
  submitBtn: {
    width: '100%',
    padding: '15px',
    background: '#f0f0f0',
    color: '#080808',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    fontFamily: '"DM Sans", sans-serif',
    letterSpacing: '0.02em',
    transition: 'opacity 0.2s, transform 0.1s',
    marginTop: '4px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginTop: '2rem',
    fontSize: '12px',
    color: '#2a2a2a',
    flexWrap: 'wrap',
  },
  footerDot: {
    color: '#1a1a1a',
  },
  errorBox: {
    padding: '1rem',
    background: 'rgba(255,77,77,0.05)',
    border: '1px solid rgba(255,77,77,0.2)',
    borderRadius: '8px',
    color: '#ff4d4d',
    fontSize: '13px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '2px solid #1a1a1a',
    borderTop: '2px solid #22c55e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  spinnerSm: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(0,0,0,0.2)',
    borderTop: '2px solid #080808',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};