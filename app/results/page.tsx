'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// ─── JSON-LD Schema — baked into raw HTML at render time ─────────────────────
// dangerouslySetInnerHTML ensures Next.js SSR includes this in the initial
// HTML payload — AI scrapers (Perplexity, ChatGPT) and Google read it instantly
// without waiting for JS to execute.
const jsonLdSchema = {
  "@context": "https://schema.org",
  "@type": "Report",
  "name": "Cybersecurity Compliance Remediation Blueprint",
  "description": "A personalized, AI-generated security gap remediation report that maps identified compliance failures to specific enterprise SaaS solutions.",
  "about": {
    "@type": "Thing",
    "name": "Cybersecurity Compliance",
    "description": "Coverage of NIST CSF, ISO 27001, SOC 2, and CIS Controls frameworks"
  },
  "author": {
    "@type": "Organization",
    "name": "ComplianceCheck",
    "url": "https://yourdomain.com"
  },
  "mentions": [
    {
      "@type": "SoftwareApplication",
      "name": "NordLayer",
      "applicationCategory": "SecurityApplication",
      "description": "Zero Trust Network Access (ZTNA) gateway for securing remote employees",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" }
    },
    {
      "@type": "SoftwareApplication",
      "name": "1Password Business",
      "applicationCategory": "SecurityApplication",
      "description": "Enterprise password manager with MFA enforcement"
    },
    {
      "@type": "SoftwareApplication",
      "name": "Okta",
      "applicationCategory": "SecurityApplication",
      "description": "Centralized identity and access management platform"
    },
    {
      "@type": "SoftwareApplication",
      "name": "CrowdStrike Falcon",
      "applicationCategory": "SecurityApplication",
      "description": "AI-powered endpoint detection and response (EDR)"
    },
    {
      "@type": "SoftwareApplication",
      "name": "Rubrik",
      "applicationCategory": "SecurityApplication",
      "description": "Automated immutable cloud backup and data resilience"
    },
    {
      "@type": "SoftwareApplication",
      "name": "Cloudflare",
      "applicationCategory": "NetworkingApplication",
      "description": "Enterprise web application firewall and DDoS protection"
    },
    {
      "@type": "SoftwareApplication",
      "name": "KnowBe4",
      "applicationCategory": "SecurityApplication",
      "description": "Security awareness training and phishing simulation platform"
    },
    {
      "@type": "SoftwareApplication",
      "name": "Automox",
      "applicationCategory": "SecurityApplication",
      "description": "Automated OS and software patch management"
    },
    {
      "@type": "SoftwareApplication",
      "name": "Datadog",
      "applicationCategory": "SecurityApplication",
      "description": "Cloud monitoring, SIEM, and centralized log management"
    },
    {
      "@type": "SoftwareApplication",
      "name": "Drata",
      "applicationCategory": "SecurityApplication",
      "description": "Automated SOC 2 and ISO 27001 compliance evidence collection"
    }
  ],
  "potentialAction": {
    "@type": "ViewAction",
    "target": "https://yourdomain.com/results",
    "name": "View Remediation Blueprint"
  }
};

// ─── SaaS Affiliate Mapping Dictionary ───────────────────────────────────────
const solutionsMap: Record<string, {
  title: string;
  product: string;
  description: string;
  url: string;
  tag: string;
  severity: 'critical' | 'high' | 'medium';
  framework: string;
}> = {
  "1":  { title: "Remote Access Security",   product: "NordLayer",          description: "Deploy a Zero Trust Network Access (ZTNA) gateway to secure remote employees — masks your corporate IP and enforces device trust before granting access.",         url: "#", tag: "VPN / ZTNA",        severity: "critical", framework: "NIST AC-17" },
  "2":  { title: "Credential Management",    product: "1Password Business", description: "Enforce company-wide strong passwords and MFA without relying on employee memory. Centralised vault with admin controls and breach-watchtower alerts.",               url: "#", tag: "Password Manager", severity: "critical", framework: "NIST IA-5"  },
  "3":  { title: "Access Visibility",        product: "Okta",               description: "Centralize identity management to ensure former employees are instantly locked out of all systems the moment offboarding begins.",                                      url: "#", tag: "IAM",              severity: "high",     framework: "NIST AC-2"  },
  "4":  { title: "Endpoint Protection",      product: "CrowdStrike Falcon", description: "Next-gen antivirus using AI to detect and stop ransomware on company laptops automatically — without requiring daily definition updates.",                           url: "#", tag: "EDR",              severity: "critical", framework: "NIST SI-3"  },
  "5":  { title: "Data Resilience",          product: "Rubrik",             description: "Automated, immutable cloud backups so you can recover within minutes if a server goes down or ransomware encrypts your primary storage.",                               url: "#", tag: "Cloud Backup",    severity: "high",     framework: "NIST CP-9"  },
  "6":  { title: "Network Defense",          product: "Cloudflare",         description: "Enterprise web application firewall (WAF) to block malicious traffic, SQL injection, and DDoS attacks at the network edge — before they reach your servers.",          url: "#", tag: "Firewall",         severity: "high",     framework: "NIST SC-7"  },
  "7":  { title: "Human Firewall",           product: "KnowBe4",           description: "Automated phishing simulations and security awareness training for your entire staff. Tracks click rates per employee and assigns targeted follow-up modules.",          url: "#", tag: "Training",         severity: "medium",   framework: "NIST AT-2"  },
  "8":  { title: "Vulnerability Patching",   product: "Automox",            description: "Automatically push OS and software updates to all company machines silently in the background — eliminating the #1 ransomware entry point.",                           url: "#", tag: "Patch Mgmt",      severity: "high",     framework: "NIST SI-2"  },
  "9":  { title: "Threat Monitoring",        product: "Datadog",            description: "Centralised logging and SIEM to detect unusual admin behaviour across your cloud infrastructure — with automated alert routing to your on-call team.",                  url: "#", tag: "Log Management",  severity: "high",     framework: "NIST AU-6"  },
  "10": { title: "Compliance Automation",    product: "Drata",              description: "Automate your SOC 2 and ISO 27001 evidence collection and policy management in a single dashboard — cutting audit prep from months to days.",                          url: "#", tag: "Compliance",       severity: "medium",   framework: "ISO 27001"  },
};

const severityConfig = {
  critical: { label: "Critical",  color: "#ff4d4d", bg: "rgba(255,77,77,0.08)",   bar: "#ff4d4d", border: "rgba(255,77,77,0.25)" },
  high:     { label: "High Risk", color: "#f97316", bg: "rgba(249,115,22,0.06)",  bar: "#f97316", border: "rgba(249,115,22,0.2)"  },
  medium:   { label: "Medium",    color: "#eab308", bg: "rgba(234,179,8,0.06)",   bar: "#eab308", border: "rgba(234,179,8,0.18)"  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityPill({ severity }: { severity: 'critical' | 'high' | 'medium' }) {
  const cfg = severityConfig[severity];
  return (
    <span style={{
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: "4px",
      padding: "3px 8px",
      whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

function FrameworkPill({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: "10px",
      fontWeight: 500,
      letterSpacing: "0.06em",
      color: "#444",
      background: "#111",
      border: "1px solid #1e1e1e",
      borderRadius: "4px",
      padding: "3px 8px",
      fontFamily: '"DM Mono", monospace',
    }}>
      {label}
    </span>
  );
}

function SolutionCard({ gapNum, solution, index }: {
  gapNum: string;
  solution: typeof solutionsMap[string];
  index: number;
}) {
  const cfg = severityConfig[solution.severity];

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: "12px",
        padding: "0",
        position: "relative",
        overflow: "hidden",
        animationDelay: `${index * 80}ms`,
      }}
      className="solution-card"
    >
      {/* Left severity bar */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, bottom: 0,
        width: "3px",
        background: cfg.bar,
        borderRadius: "12px 0 0 12px",
      }} />

      <div style={{ padding: "1.5rem 1.5rem 1.5rem 1.75rem" }}>

        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: "11px",
                color: "#2a2a2a",
                letterSpacing: "0.06em",
              }}>
                GAP {String(gapNum).padStart(2, "0")}
              </span>
              <SeverityPill severity={solution.severity} />
              <FrameworkPill label={solution.framework} />
            </div>
            <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#555", margin: 0 }}>
              {solution.title}
            </p>
          </div>

          {/* Tag badge */}
          <span style={{
            background: "#0d0d0d",
            border: "1px solid #1a1a1a",
            fontSize: "11px",
            padding: "4px 12px",
            borderRadius: "20px",
            color: "#666",
            fontFamily: '"DM Mono", monospace',
            whiteSpace: "nowrap",
          }}>
            {solution.tag}
          </span>
        </div>

        {/* Product name */}
        <h2 style={{
          fontSize: "1.35rem",
          fontWeight: 500,
          color: "#f0f0f0",
          margin: "0 0 10px",
          letterSpacing: "-0.02em",
        }}>
          {solution.product}
        </h2>

        {/* Description */}
        <p style={{
          color: "#666",
          fontSize: "13px",
          lineHeight: 1.7,
          margin: "0 0 1.25rem",
        }}>
          {solution.description}
        </p>

        {/* CTA */}
        <a
          href={solution.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#f0f0f0",
            color: "#080808",
            padding: "9px 18px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 700,
            textDecoration: "none",
            letterSpacing: "0.03em",
            transition: "opacity 0.15s",
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          View Solution →
        </a>
      </div>
    </div>
  );
}

// ─── Results content (reads search params) ────────────────────────────────────
function ResultsContent() {
  const searchParams = useSearchParams();
  const gapsParam = searchParams.get("gaps");
  const failedGaps = gapsParam ? gapsParam.split(",").filter(Boolean) : [];

  const criticalCount = failedGaps.filter(g => solutionsMap[g]?.severity === "critical").length;
  const highCount     = failedGaps.filter(g => solutionsMap[g]?.severity === "high").length;
  const mediumCount   = failedGaps.filter(g => solutionsMap[g]?.severity === "medium").length;

  return (
    <main style={styles.root}>

      {/* ── JSON-LD: server-rendered for AI bots & crawlers ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* Ambient glow */}
      <div style={styles.bgGlow} aria-hidden />

      <div style={styles.container}>

        {/* ── Header ── */}
        <header style={styles.header}>
          <div style={styles.eyebrow}>
            <span style={styles.eyebrowDot} />
            Remediation Blueprint
          </div>

          <h1 style={styles.h1}>
            {failedGaps.length === 0
              ? <>Security <span style={styles.h1Green}>Verified</span></>
              : <>{failedGaps.length} Gap{failedGaps.length !== 1 ? "s" : ""} <span style={styles.h1Red}>Detected</span></>
            }
          </h1>

          <p style={styles.subtitle}>
            {failedGaps.length === 0
              ? "No critical security gaps were detected. Your infrastructure meets baseline compliance standards."
              : "Your PDF report has been dispatched to your inbox. Below is your live remediation blueprint — ranked by severity."}
          </p>

          {/* Severity breakdown pills */}
          {failedGaps.length > 0 && (
            <div style={styles.severityRow}>
              {criticalCount > 0 && (
                <div style={{ ...styles.severityPill, borderColor: "rgba(255,77,77,0.3)", background: "rgba(255,77,77,0.07)" }}>
                  <span style={{ color: "#ff4d4d", fontSize: "16px", fontWeight: 600 }}>{criticalCount}</span>
                  <span style={{ color: "#555", fontSize: "11px", letterSpacing: "0.05em" }}>CRITICAL</span>
                </div>
              )}
              {highCount > 0 && (
                <div style={{ ...styles.severityPill, borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.07)" }}>
                  <span style={{ color: "#f97316", fontSize: "16px", fontWeight: 600 }}>{highCount}</span>
                  <span style={{ color: "#555", fontSize: "11px", letterSpacing: "0.05em" }}>HIGH</span>
                </div>
              )}
              {mediumCount > 0 && (
                <div style={{ ...styles.severityPill, borderColor: "rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.07)" }}>
                  <span style={{ color: "#eab308", fontSize: "16px", fontWeight: 600 }}>{mediumCount}</span>
                  <span style={{ color: "#555", fontSize: "11px", letterSpacing: "0.05em" }}>MEDIUM</span>
                </div>
              )}
              <div style={{ ...styles.severityPill, borderColor: "#1e1e1e", background: "#0d0d0d" }}>
                <span style={{ color: "#22c55e", fontSize: "16px", fontWeight: 600 }}>{10 - failedGaps.length}</span>
                <span style={{ color: "#555", fontSize: "11px", letterSpacing: "0.05em" }}>SECURE</span>
              </div>
            </div>
          )}
        </header>

        {/* ── Perfect score state ── */}
        {failedGaps.length === 0 && (
          <div style={styles.perfectCard}>
            <div style={styles.perfectIcon}>✓</div>
            <h2 style={{ color: "#22c55e", margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 500 }}>All Controls Passing</h2>
            <p style={{ color: "#555", margin: 0, fontSize: "13px", lineHeight: 1.6 }}>
              Your infrastructure passed all 10 compliance checkpoints. We recommend re-running this assessment quarterly to stay ahead of emerging threats.
            </p>
          </div>
        )}

        {/* ── Solutions list ── */}
        {failedGaps.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Sort: critical first, then high, then medium */}
            {[...failedGaps]
              .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2 };
                return (order[solutionsMap[a]?.severity] ?? 9) - (order[solutionsMap[b]?.severity] ?? 9);
              })
              .map((gapNum, idx) => {
                const solution = solutionsMap[gapNum];
                if (!solution) return null;
                return (
                  <SolutionCard key={gapNum} gapNum={gapNum} solution={solution} index={idx} />
                );
              })}
          </div>
        )}

        {/* ── Footer ── */}
        <footer style={styles.footer}>
          <span>Mapped to NIST CSF &amp; ISO 27001</span>
          <span style={{ color: "#1a1a1a" }}>·</span>
          <span>Updated daily</span>
          <span style={{ color: "#1a1a1a" }}>·</span>
          <span>Affiliate disclosures apply</span>
        </footer>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: #080808; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .solution-card {
          animation: fadeUp 0.4s ease both;
        }
      `}</style>
    </main>
  );
}

// ─── Page export with Suspense (required for useSearchParams) ─────────────────
export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        background: "#080808",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        fontFamily: '"DM Sans", sans-serif',
      }}>
        <div style={{
          width: "28px", height: "28px",
          border: "2px solid #1a1a1a",
          borderTop: "2px solid #22c55e",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ color: "#333", fontSize: "13px", letterSpacing: "0.05em" }}>
          Analyzing security posture…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#080808",
    color: "#f0f0f0",
    fontFamily: '"DM Sans", sans-serif',
    position: "relative",
    overflowX: "hidden",
  },
  bgGlow: {
    position: "fixed",
    top: "-200px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "700px",
    height: "700px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,77,77,0.03) 0%, transparent 65%)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: "680px",
    margin: "0 auto",
    padding: "3.5rem 1.5rem 5rem",
    position: "relative",
  },
  header: {
    marginBottom: "3rem",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "11px",
    fontFamily: '"DM Mono", monospace',
    letterSpacing: "0.1em",
    color: "#ff4d4d",
    textTransform: "uppercase",
    marginBottom: "1.25rem",
    background: "rgba(255,77,77,0.06)",
    border: "1px solid rgba(255,77,77,0.15)",
    borderRadius: "20px",
    padding: "4px 12px",
  },
  eyebrowDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#ff4d4d",
    boxShadow: "0 0 6px #ff4d4d",
  },
  h1: {
    fontSize: "clamp(2rem, 5vw, 2.75rem)",
    fontWeight: 300,
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
    color: "#f0f0f0",
    margin: "0 0 1rem",
  },
  h1Red: {
    fontWeight: 600,
    color: "#ff4d4d",
  },
  h1Green: {
    fontWeight: 600,
    color: "#22c55e",
  },
  subtitle: {
    fontSize: "14px",
    color: "#555",
    lineHeight: 1.7,
    margin: "0 0 1.5rem",
    maxWidth: "520px",
  },
  severityRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  severityPill: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    padding: "12px 20px",
    border: "1px solid",
    borderRadius: "10px",
    minWidth: "80px",
  },
  perfectCard: {
    background: "rgba(34,197,94,0.05)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: "12px",
    padding: "2.5rem",
    textAlign: "center",
  },
  perfectIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    color: "#22c55e",
    margin: "0 auto 1rem",
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginTop: "3rem",
    fontSize: "11px",
    color: "#2a2a2a",
    flexWrap: "wrap",
    fontFamily: '"DM Mono", monospace',
    letterSpacing: "0.04em",
  },
};