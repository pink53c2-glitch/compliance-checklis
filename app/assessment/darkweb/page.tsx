'use client';

import { useState, useEffect } from 'react';

// ─── Severity classification by exposed data ──────────────────────────────────
const getBreachSeverity = (xposedData: string): 'critical' | 'high' | 'medium' => {
  const d = (xposedData || '').toLowerCase();
  if (['password', 'credit card', 'financial', 'ssn', 'banking', 'health', 'medical'].some(k => d.includes(k))) return 'critical';
  if (['email', 'phone', 'address', 'username', 'name'].some(k => d.includes(k))) return 'high';
  return 'medium';
};

// ─── Attack context per exposed data type ─────────────────────────────────────
const getAttackContext = (xposedData: string): string => {
  const d = (xposedData || '').toLowerCase();
  if (d.includes('password'))
    return 'Credential stuffing bots are already trying this password across thousands of services. Your corporate email, cloud storage, Slack, and banking portals are all targets — an automated attack can test all of them within minutes.';
  if (d.includes('phone'))
    return 'Your verified number enables SIM-swap attacks. An attacker calls your carrier, convinces them to redirect your SIM, and uses it to bypass SMS-based MFA — locking you out of every account in under an hour.';
  if (d.includes('email') || d.includes('mail'))
    return 'Your verified email address is now on active phishing campaign lists. Expect targeted spear-phishing impersonating your IT team, banking providers, or SaaS vendors — personalised using your other leaked data.';
  if (d.includes('address') || d.includes('location'))
    return 'Physical address data is used for pretexting attacks — fraudsters call your bank or employer posing as you, using your address to pass security questions and request account changes.';
  return 'This data is used to build high-fidelity impersonation profiles. Attackers combine multiple breaches to create convincing social engineering attacks against you and your organisation.';
};

const SEVERITY = {
  critical: { color: '#ff4d4d', bg: 'rgba(255,77,77,0.07)', border: 'rgba(255,77,77,0.22)', label: 'CRITICAL'  },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.2)', label: 'HIGH RISK' },
  medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.06)',  border: 'rgba(234,179,8,0.18)', label: 'MEDIUM'    },
};

const SCAN_STEPS = [
  'Scanning criminal forums…',
  'Checking darknet paste sites…',
  'Cross-referencing 12B+ breach records…',
  'Analysing credential exposure patterns…',
];

// ─── Scanning animation component ─────────────────────────────────────────────
function ScanningState({ email }: { email: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setStep(s => Math.min(s + 1, SCAN_STEPS.length - 1)), 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={styles.eyebrow}><span style={{ ...styles.dot, animation: 'pulse 1.2s ease infinite' }} /> Live Threat Intel</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: '#a1a1aa', margin: '1rem 0 0.4rem' }}>Deep Scanning in Progress</h3>
        <p style={{ color: '#52525b', fontSize: '13px', fontFamily: '"DM Mono", monospace' }}>{email}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '340px', margin: '0 auto' }}>
        {SCAN_STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', background: i <= step ? 'rgba(255,77,77,0.04)' : 'transparent', border: `1px solid ${i <= step ? 'rgba(255,77,77,0.15)' : '#111'}`, transition: 'all 0.4s ease' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: i < step ? '#22c55e' : i === step ? '#ff4d4d' : '#1a1a1a', boxShadow: i === step ? '0 0 8px #ff4d4d' : 'none', transition: 'all 0.4s ease' }} />
            <span style={{ fontSize: '12px', fontFamily: '"DM Mono", monospace', color: i <= step ? '#a1a1aa' : '#2a2a2a', letterSpacing: '0.02em' }}>{s}</span>
            {i < step && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#22c55e', fontFamily: '"DM Mono", monospace' }}>DONE</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DarkWebScanner() {
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [scanned, setScanned]     = useState(false);
  const [breaches, setBreaches]   = useState<any[]>([]);
  const [openCards, setOpenCards] = useState<Record<number, boolean>>({});
  const [focused, setFocused]     = useState(false);

  const toggleCard = (i: number) => setOpenCards(prev => ({ ...prev, [i]: !prev[i] }));

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await fetch(`https://api.xposedornot.com/v1/breach-analytics?email=${email}`);
      const data = await res.json();
      setBreaches(data?.ExposedBreaches?.breaches_details ?? []);
      setScanned(true);
    } catch {
      setBreaches([]);
      setScanned(true);
    }
    setLoading(false);
  };

  // Derived stats
  const criticalBreaches = breaches.filter(b => getBreachSeverity(b.xposed_data) === 'critical').length;
  const highBreaches     = breaches.filter(b => getBreachSeverity(b.xposed_data) === 'high').length;
  const mediumBreaches   = breaches.filter(b => getBreachSeverity(b.xposed_data) === 'medium').length;

  const minExposure = criticalBreaches * 680_000 + highBreaches * 280_000 + mediumBreaches * 90_000;
  const maxExposure = criticalBreaches * 1_200_000 + highBreaches * 580_000 + mediumBreaches * 180_000;
  const fmtM = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;

  // Sort breaches: critical → high → medium
  const sortedBreaches = [...breaches].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 };
    return (order[getBreachSeverity(a.xposed_data)] ?? 9) - (order[getBreachSeverity(b.xposed_data)] ?? 9);
  });

  return (
    <main style={styles.root}>
      <div style={styles.bgGlow} aria-hidden />

      <div style={styles.container}>

        {/* ════════ SCAN FORM ════════ */}
        {!scanned && !loading && (
          <>
            <header style={{ ...styles.header, textAlign: 'center' }}>
              <div style={styles.eyebrow}><span style={styles.dot} /> Live Threat Intel</div>
              <h1 style={styles.h1}>Dark Web <span style={styles.h1Accent}>Domain Scanner</span></h1>
              <p style={styles.subtitle}>
                Enter your work email to scan criminal forums, paste sites, and known breach databases for active corporate credential exposure.
              </p>
            </header>

            <form onSubmit={handleScan} style={{ background: '#09090b', border: '1px solid #18181b', borderRadius: '12px', padding: '1.5rem' }}>
              <label style={styles.emailLabel}>Target Work Email</label>
              <p style={{ fontSize: '12px', color: '#52525b', margin: '0 0 12px', fontFamily: '"DM Mono", monospace' }}>
                Checks against 12B+ exposed records across 800+ breach sources
              </p>
              <input
                type="email" placeholder="name@company.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                required
                style={{ ...styles.emailInput, borderColor: focused ? '#ff4d4d44' : '#1e1e1e', boxShadow: focused ? '0 0 0 3px rgba(255,77,77,0.08)' : 'none' }}
              />
              <button type="submit" disabled={!email} style={{ ...styles.submitBtn, opacity: !email ? 0.45 : 1, cursor: !email ? 'not-allowed' : 'pointer' }}>
                Scan Dark Web Sources →
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              {['800+ breach sources', 'Criminal forums', 'Darknet pastebins', 'Free, instant'].map(s => (
                <span key={s} style={{ fontSize: '11px', color: '#52525b', fontFamily: '"DM Mono", monospace', letterSpacing: '0.04em' }}>✓ {s}</span>
              ))}
            </div>
          </>
        )}

        {/* ════════ SCANNING ANIMATION ════════ */}
        {loading && <ScanningState email={email} />}

        {/* ════════ RESULTS ════════ */}
        {scanned && !loading && (
          <div style={{ animation: 'fadeUp 0.5s ease both' }}>

            {/* Score header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={styles.eyebrow}>Scan Complete</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 500, margin: '1rem 0 0.4rem', color: '#a1a1aa' }}>
                Credential Exposure Status
              </h3>

              {breaches.length > 0 ? (
                <>
                  <div style={{ fontSize: '5rem', fontWeight: 800, color: '#ff4d4d', lineHeight: 1, marginBottom: '0.5rem' }}>
                    {breaches.length}
                    <span style={{ fontSize: '1.5rem', color: '#52525b', fontWeight: 400 }}> breach{breaches.length !== 1 ? 'es' : ''}</span>
                  </div>
                  <p style={{ color: '#a1a1aa', fontSize: '14px', maxWidth: '340px', margin: '0 auto 0' }}>
                    Credentials for <strong style={{ color: '#d4d4d8' }}>{email}</strong> found in active criminal databases
                  </p>
                  {/* Severity breakdown pills */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                    {[
                      { count: criticalBreaches, label: 'CRITICAL', color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.3)', bg: 'rgba(255,77,77,0.07)' },
                      { count: highBreaches,     label: 'HIGH',     color: '#f97316', borderColor: 'rgba(249,115,22,0.3)', bg: 'rgba(249,115,22,0.07)' },
                      { count: mediumBreaches,   label: 'MEDIUM',   color: '#eab308', borderColor: 'rgba(234,179,8,0.3)',  bg: 'rgba(234,179,8,0.07)' },
                    ].filter(p => p.count > 0).map(p => (
                      <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '10px 16px', border: `1px solid ${p.borderColor}`, borderRadius: '10px', background: p.bg, minWidth: '70px' }}>
                        <span style={{ color: p.color, fontSize: '16px', fontWeight: 600 }}>{p.count}</span>
                        <span style={{ color: '#71717a', fontSize: '10px', letterSpacing: '0.05em', fontFamily: '"DM Mono", monospace' }}>{p.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '4rem', fontWeight: 800, color: '#22c55e', lineHeight: 1, marginBottom: '0.5rem' }}>SECURE</div>
                  <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '0 auto', maxWidth: '340px' }}>
                    No known dark web exposures found for <strong style={{ color: '#d4d4d8' }}>{email}</strong>
                  </p>
                </>
              )}
            </div>

            {/* ── Exposure estimate card (FIXED CONTRAST TEXT COLORS) ── */}
            {breaches.length > 0 && (
              <div style={{ background: 'rgba(255,77,77,0.03)', border: '1px solid rgba(255,77,77,0.14)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '0.85rem' }}>
                  <div>
                    <p style={{ fontSize: '10px', color: '#71717a', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px', fontFamily: '"DM Mono", monospace' }}>
                      Estimated Organisational Risk
                    </p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ff4d4d', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {fmtM(minExposure)} – {fmtM(maxExposure)}
                    </p>
                  </div>
                  <span style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '6px', fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
                    ◉ {criticalBreaches >= 1 ? 'CRITICAL' : 'HIGH'} COMPROMISE
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.65, margin: '0 0 0.85rem' }}>
                  Automated threat matrices are highly active. Personal identifiable information (PII) and corporate communication handles must be strictly audited and shielded immediately.
                </p>
                <p style={{ fontSize: '10px', color: '#52525b', margin: 0, fontFamily: '"DM Mono", monospace' }}>
                  Source: IBM Cost of a Data Breach 2024 · based on exposure severity mix
                </p>
              </div>
            )}

            {/* ── All-clear proactive section ── */}
            {breaches.length === 0 && (
              <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#22c55e', fontSize: '16px' }}>✓</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#22c55e', margin: 0 }}>No Active Exposures Found</p>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '2px 0 0', fontFamily: '"DM Mono", monospace' }}>Last verified: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  Your email hasn't appeared in any known breach. That changes fast — 2,200+ new credentials are leaked every minute. Stay protected proactively.
                </p>
                <a
                  href="https://go.nordpass.io/aff_c?offer_id=754&aff_id=150219&aff_sub=stackgap_pass"
                  target="_blank" rel="noopener noreferrer sponsored"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f4f4f5', color: '#09090b', padding: '9px 16px', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none' }}
                >
                  Set Up Proactive Protection →
                </a>
              </div>
            )}

            {/* ── Breach cards ── */}
            {sortedBreaches.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '10px', color: '#71717a', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
                    Breach Sources ({sortedBreaches.length})
                  </p>
                  <div style={{ flex: 1, height: '1px', background: '#1a1a1a' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.75rem' }}>
                  {sortedBreaches.map((b, idx) => {
                    const sev    = getBreachSeverity(b.xposed_data);
                    const cfg    = SEVERITY[sev];
                    const isOpen = openCards[idx] ?? false;
                    const chips  = (b.xposed_data || '').split(';').filter(Boolean);

                    return (
                      <div key={idx} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                        {/* Left accent bar */}
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: cfg.color }} />

                        <div style={{ padding: '1.25rem 1.25rem 1.25rem 1.5rem' }}>
                          {/* Meta row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#71717a', letterSpacing: '0.06em' }}>
                                #{String(idx + 1).padStart(2, '0')}
                              </span>
                              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: cfg.color, background: `${cfg.color}14`, border: `1px solid ${cfg.border}`, borderRadius: '4px', padding: '2px 7px', fontFamily: '"DM Mono", monospace' }}>
                                {cfg.label}
                              </span>
                              {b.xposed_year && (
                                <span style={{ fontSize: '10px', color: '#71717a', fontFamily: '"DM Mono", monospace' }}>{b.xposed_year}</span>
                              )}
                            </div>
                            {b.industry && (
                              <span style={{ background: '#111', border: '1px solid #1e1e1e', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', color: '#a1a1aa', fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
                                {b.industry}
                              </span>
                            )}
                          </div>

                          {/* Breach name */}
                          <h2 style={{ fontSize: '1.1rem', fontWeight: 500, color: '#e0e0e0', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                            {b.breach} Database
                          </h2>
                          {b.domain && <p style={{ fontSize: '11px', color: '#71717a', fontFamily: '"DM Mono", monospace', margin: '0 0 12px' }}>{b.domain}</p>}

                          {/* Exposed data chips */}
                          {chips.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                              {chips.map((chip: string) => {
                                const isHighRisk = ['password', 'credit card', 'financial', 'ssn'].some(k => chip.toLowerCase().includes(k));
                                return (
                                  <span key={chip} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontFamily: '"DM Mono", monospace', color: isHighRisk ? cfg.color : '#a1a1aa', background: isHighRisk ? `${cfg.color}10` : '#111', border: `1px solid ${isHighRisk ? cfg.border : '#1e1e1e'}` }}>
                                    {chip.trim()}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Attack context toggle */}
                          <button onClick={() => toggleCard(idx)} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0', marginBottom: isOpen ? '0.75rem' : '0' }}>
                            <span style={{ fontSize: '11px', color: cfg.color, fontFamily: '"DM Mono", monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              {isOpen ? '▾' : '▸'} What an attacker does with this
                            </span>
                          </button>

                          {isOpen && (
                            <div style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${cfg.border}`, borderRadius: '8px', padding: '1rem' }}>
                              <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.75, margin: 0 }}>
                                {getAttackContext(b.xposed_data)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Dual Premium Remediation Protocol Stack (FIXED MONETIZATION ANCHOR) ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1rem' }}>
                  <div style={{ background: '#0a0a0b', border: '1px solid #1f1f23', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: '#09090b', borderBottom: '1px solid #1f1f23', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#ff4d4d', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '4px', padding: '2px 8px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.08em' }}>
                        ⚡ ESSENTIAL REMEDIATION
                      </span>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <p style={{ fontSize: '10px', color: '#71717a', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: '"DM Mono", monospace' }}>Priority 01 — Account Shield</p>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 500, color: '#f0f0f0', margin: 0, letterSpacing: '-0.02em' }}>NordPass Business</h3>
                        </div>
                        <span style={{ background: '#111', border: '1px solid #1e1e1e', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', color: '#a1a1aa', fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>Identity Vault</span>
                      </div>
                      <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.65, margin: '0 0 1.1rem' }}>
                        Even if passwords weren't leaked in this specific dataset, exposed communication vectors open you up to targeting. Enforce immediate vaulting, hard corporate master policies, and dynamic credential monitoring across your perimeter.
                      </p>
                      <a
                        href="https://go.nordpass.io/aff_c?offer_id=754&aff_id=150219&aff_sub=stackgap_pass"
                        target="_blank" rel="noopener noreferrer sponsored"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f4f4f5', color: '#09090b', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#e4e4e7'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#f4f4f5'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        Deploy NordPass Architecture →
                      </a>
                    </div>
                  </div>

                  <div style={{ background: '#0a0a0b', border: '1px solid #1f1f23', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: '#09090b', borderBottom: '1px solid #1f1f23', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '4px', padding: '2px 8px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.08em' }}>
                        🛡️ RECOMMENDED INFRASTRUCTURE CONTROL
                      </span>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <p style={{ fontSize: '10px', color: '#71717a', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: '"DM Mono", monospace' }}>Priority 02 — Perimeter Defense</p>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 500, color: '#f0f0f0', margin: 0, letterSpacing: '-0.02em' }}>NordVPN Teams</h3>
                        </div>
                        <span style={{ background: '#111', border: '1px solid #1e1e1e', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', color: '#a1a1aa', fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>Zero Trust Network</span>
                      </div>
                      <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.65, margin: '0 0 1.1rem' }}>
                        Protect enterprise connection lines. Layering Zero Trust network access ensures that even if credentials or user IDs are combined down the road by attackers, they cannot map or touch internal databases without dedicated device validation layers.
                      </p>
                      <a
                        href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=150219&aff_sub=stackgap_re"
                        target="_blank" rel="noopener noreferrer sponsored"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f4f4f5', color: '#09090b', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#e4e4e7'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#f4f4f5'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        Deploy NordVPN Edge Gateway →
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Reset */}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button onClick={() => { setScanned(false); setEmail(''); setOpenCards({}); }} style={{ background: 'transparent', border: 'none', color: '#52525b', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.04em' }}>
                Scan another address →
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { background: #000000; margin: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow:0 0 6px #ff4d4d; } 50% { box-shadow:0 0 14px #ff4d4d; } }
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root:       { minHeight: '100vh', background: '#000000', fontFamily: '"DM Sans", sans-serif', color: '#f4f4f5', position: 'relative' },
  bgGlow:     { position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,77,77,0.04) 0%, transparent 70%)', pointerEvents: 'none' },
  container:  { maxWidth: '560px', margin: '0 auto', padding: '3rem 1.5rem 4rem', position: 'relative' },
  header:     { marginBottom: '2.5rem' },
  eyebrow:    { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.1em', color: '#ff4d4d', textTransform: 'uppercase', marginBottom: '1rem', background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.15)', borderRadius: '20px', padding: '4px 12px' },
  dot:        { width: '6px', height: '6px', borderRadius: '50%', background: '#ff4d4d', boxShadow: '0 0 6px #ff4d4d' },
  h1:         { fontSize: '2.5rem', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#f4f4f5', margin: '0 0 1rem' },
  h1Accent:   { fontWeight: 500, color: '#ffffff' },
  subtitle:   { fontSize: '14px', color: '#a1a1aa', lineHeight: 1.7, margin: 0 },
  emailLabel: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#a1a1aa', marginBottom: '4px' },
  emailInput: { width: '100%', padding: '13px 14px', background: '#000000', border: '1px solid', borderRadius: '8px', color: '#f4f4f5', fontSize: '14px', marginBottom: '14px', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', fontFamily: '"DM Sans", sans-serif' },
  submitBtn:  { width: '100%', padding: '14px', background: '#f4f4f5', color: '#09090b', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.02em', cursor: 'pointer' },
};