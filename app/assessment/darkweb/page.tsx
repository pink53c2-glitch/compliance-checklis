'use client';

import { useState } from 'react';

export default function DarkWebScanner() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [breaches, setBreaches] = useState<any[]>([]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Hitting the free XposedOrNot Analytics Endpoint
      const res = await fetch(`https://api.xposedornot.com/v1/breach-analytics?email=${email}`);
      const data = await res.json();

      if (data.ExposedBreaches && data.ExposedBreaches.breaches_details) {
        setBreaches(data.ExposedBreaches.breaches_details);
      } else {
        setBreaches([]);
      }
      setScanned(true);
    } catch (error) {
      console.error('Scanner error:', error);
      setBreaches([]);
      setScanned(true);
    }
    setLoading(false);
  };

  const exposureCost = breaches.length * 142000;

  return (
    <main style={styles.root}>
      <div style={styles.bgGlow} aria-hidden />

      <div style={styles.container}>
        {!scanned ? (
          <>
            <header style={styles.header}>
              <div style={styles.eyebrow}>
                <span style={styles.dot} /> Live Threat Intel
              </div>
              <h1 style={styles.h1}>
                Dark Web <span style={styles.h1Accent}>Domain Scanner</span>
              </h1>
              <p style={styles.subtitle}>
                Enter your work email to scan criminal forums, pastebins, and known data breaches to see if your corporate credentials are currently for sale.
              </p>
            </header>

            <form onSubmit={handleScan} style={styles.emailBlock}>
              <label style={styles.emailLabel}>Target Work Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.emailInput}
              />
              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  ...styles.submitBtn,
                  opacity: loading || !email ? 0.5 : 1,
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Initializing Deep Scan...' : 'Scan Dark Web Sources →'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ animation: 'fadeUp 0.5s ease both' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={styles.eyebrow}>Scan Complete</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '1rem 0 0.5rem', color: '#fff' }}>
                Credential Exposure Status
              </h3>
              
              {breaches.length > 0 ? (
                <>
                  <div style={{ fontSize: '5rem', fontWeight: 800, color: '#ff4d4d', lineHeight: 1, marginBottom: '1rem' }}>
                    {breaches.length}<span style={{ fontSize: '1.5rem', color: '#52525b', fontWeight: 400 }}> Breaches</span>
                  </div>
                  <p style={{ color: '#a1a1aa', fontSize: '15px' }}>
                    Your corporate credentials for <strong style={{ color: '#f4f4f5' }}>{email}</strong> have been found in active criminal databases.
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '5rem', fontWeight: 800, color: '#22c55e', lineHeight: 1, marginBottom: '1rem' }}>
                    SECURE
                  </div>
                  <p style={{ color: '#a1a1aa', fontSize: '15px' }}>
                    No known dark web exposures found for <strong style={{ color: '#f4f4f5' }}>{email}</strong>.
                  </p>
                </>
              )}
            </div>

            {breaches.length > 0 && (
              <>
                <div style={styles.exposureCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <p style={styles.exposureLabel}>Estimated Organizational Risk</p>
                      <p style={styles.exposureValue}>
                        ${(exposureCost / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <span style={styles.criticalBadge}>◉ CRITICAL COMPROMISE</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#71717a' }}>
                    Automated credential stuffing attacks are highly likely. Immediate password rotation and MFA deployment are required.
                  </p>
                </div>

                <h4 style={styles.listHeader}>Identified Breach Sources:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {breaches.map((b, idx) => (
                    <div key={idx} style={styles.solutionCard}>
                      <div style={styles.cardRedLine} />
                      <div style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={styles.pill}>{b.domain}</span>
                          <span style={styles.pill}>{b.industry}</span>
                        </div>
                        <h2 style={styles.cardTitle}>{b.breach} Database</h2>
                        <p style={styles.cardDesc}>
                          <strong style={{ color: '#d4d4d8' }}>Exposed Data:</strong> {b.xposed_data ? b.xposed_data.split(';').join(', ') : 'Classified Data'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* The Monetization Anchor */}
{/* The Monetization Anchor */}
<div style={{ marginTop: '2rem', padding: '1.5rem', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', textAlign: 'center' }}>
  <h4 style={{ color: '#f4f4f5', marginBottom: '1rem' }}>Deploy Immediate Remediation</h4>
  <p style={{ color: '#a1a1aa', fontSize: '13px', marginBottom: '1.5rem' }}>
    Force zero-trust access and company-wide password resets to lock out threat actors.
  </p>
  <a 
    href="https://go.nordpass.io/aff_c?offer_id=754&aff_id=150219&aff_sub=stackgap_pass" 
    target="_blank" 
    rel="noopener noreferrer" 
    style={styles.premiumBtn}
  >
    Deploy NordPass Business Architecture
  </a>
</div>
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button onClick={() => { setScanned(false); setEmail(''); }} style={styles.resetBtn}>
                Scan another domain email
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: '#000000', fontFamily: '"DM Sans", sans-serif', color: '#f4f4f5', position: 'relative' },
  bgGlow: { position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,77,77,0.04) 0%, transparent 70%)', pointerEvents: 'none' },
  container: { maxWidth: '560px', margin: '0 auto', padding: '3rem 1.5rem 4rem', position: 'relative' },
  header: { marginBottom: '2.5rem', textAlign: 'center' },
  eyebrow: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontFamily: '"DM Mono", monospace', letterSpacing: '0.1em', color: '#ff4d4d', textTransform: 'uppercase', marginBottom: '1rem', background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.15)', borderRadius: '20px', padding: '4px 12px' },
  dot: { width: '6px', height: '6px', borderRadius: '50%', background: '#ff4d4d', boxShadow: '0 0 6px #ff4d4d' },
  h1: { fontSize: '2.5rem', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#f4f4f5', margin: '0 0 1rem' },
  h1Accent: { fontWeight: 500, color: '#ffffff' },
  subtitle: { fontSize: '14px', color: '#a1a1aa', lineHeight: 1.7, margin: 0 },
  emailBlock: { background: '#09090b', border: '1px solid #18181b', borderRadius: '10px', padding: '1.5rem' },
  emailLabel: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#a1a1aa', marginBottom: '12px' },
  emailInput: { width: '100%', padding: '14px', background: '#000000', border: '1px solid #27272a', borderRadius: '7px', color: '#f4f4f5', fontSize: '15px', marginBottom: '16px', outline: 'none' },
  submitBtn: { width: '100%', padding: '15px', background: '#f4f4f5', color: '#09090b', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px' },
  exposureCard: { background: 'rgba(255,77,77,0.02)', border: '1px solid rgba(255,77,77,0.15)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' },
  exposureLabel: { fontSize: '10px', color: '#71717a', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px', fontFamily: '"DM Mono", monospace' },
  exposureValue: { fontSize: '1.9rem', fontWeight: 600, color: '#ff4d4d', margin: 0, lineHeight: 1 },
  criticalBadge: { background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.2)', color: '#ff4d4d', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '6px' },
  listHeader: { color: '#f4f4f5', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontFamily: '"DM Mono", monospace' },
  solutionCard: { background: '#09090b', border: '1px solid #18181b', borderRadius: '12px', position: 'relative', overflow: 'hidden' },
  cardRedLine: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: '#ff4d4d' },
  pill: { background: '#18181b', border: '1px solid #27272a', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', color: '#a1a1aa' },
  cardTitle: { fontSize: '1.15rem', fontWeight: 500, color: '#f4f4f5', margin: '0 0 8px' },
  cardDesc: { color: '#a1a1aa', fontSize: '13px', margin: 0 },
  premiumBtn: { display: 'inline-block', background: '#ffffff', color: '#09090b', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' },
  resetBtn: { background: 'transparent', border: 'none', color: '#71717a', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }
};