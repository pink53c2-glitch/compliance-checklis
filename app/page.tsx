'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── JSON-LD Schema ───────────────────────────────────────────────────────────
const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': 'StackGap',
  'url': 'https://stackgap.xyz',
  'description': 'A free B2B stack intelligence platform that runs interactive compliance and architecture assessments across cybersecurity, cloud infrastructure, and marketing verticals.',
  'potentialAction': {
    '@type': 'SearchAction',
    'target': {
      '@type': 'EntryPoint',
      'urlTemplate': 'https://stackgap.xyz/assessment/{category}',
    },
    'query-input': 'required name=category',
  },
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'USD',
    'description': 'All assessments are completely free to use.',
  },
  'audience': {
    '@type': 'Audience',
    'audienceType': 'IT Managers, CTOs, DevOps Engineers, Security Engineers, Compliance Officers, Startup Founders',
  },
  'hasPart': [
    {
      '@type': 'WebApplication',
      'name': 'Cybersecurity & Compliance Assessment',
      'url': 'https://stackgap.xyz/assessment/cybersecurity',
      'applicationCategory': 'SecurityApplication',
      'description': 'Audit endpoint security, access controls, data protection, and track SOC 2 / ISO 27001 readiness.',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
    },
    {
      '@type': 'WebApplication',
      'name': 'Cloud Infrastructure & DevOps Assessment',
      'url': 'https://stackgap.xyz/assessment/cloud-infrastructure',
      'applicationCategory': 'DeveloperApplication',
      'description': 'Evaluate AWS/GCP architecture, CI/CD pipeline gaps, cloud backup policies, and server efficiency.',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
    },
    {
      '@type': 'WebApplication',
      'name': 'Marketing Stack & CRM Assessment',
      'url': 'https://stackgap.xyz/assessment/marketing-stack',
      'applicationCategory': 'BusinessApplication',
      'description': 'Analyze lead attribution gaps, CRM automation health, data privacy compliance, and tool sprawl.',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
    },
  ],
};

// ─── Metadata cannot be exported from a 'use client' file ────────────────────
// Move metadata to a separate layout or keep it in a server wrapper.
// See note at bottom of file.

// ─── Animated particle grid ───────────────────────────────────────────────────
function ParticleGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const mouse = { x: -999, y: -999 };
    const N = 80, CONN = 130, MOUSE_R = 150;
    let pts: {
      x: number; y: number;
      vx: number; vy: number;
      r: number; pulse: number;
    }[] = [];

    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      pts = Array.from({ length: N }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 0.5,
        pulse: Math.random() * Math.PI * 2,
      }));
    }

    function draw() {
      const W = canvas!.width;
      const H = canvas!.height;
      ctx!.clearRect(0, 0, W, H);

      // Update + draw dots
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.02;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const near = Math.sqrt(dx * dx + dy * dy) < MOUSE_R;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, near ? p.r * 2.5 : p.r, 0, Math.PI * 2);
        ctx!.fillStyle = near
          ? 'rgba(16,185,129,0.95)'
          : `rgba(63,63,70,${0.35 + Math.sin(p.pulse) * 0.1})`;
        ctx!.fill();
      });

      // Draw connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONN) {
            const nearMouse =
              Math.hypot(pts[i].x - mouse.x, pts[i].y - mouse.y) < MOUSE_R ||
              Math.hypot(pts[j].x - mouse.x, pts[j].y - mouse.y) < MOUSE_R;
            const alpha = (1 - d / CONN) * (nearMouse ? 0.6 : 0.12);
            ctx!.beginPath();
            ctx!.moveTo(pts[i].x, pts[i].y);
            ctx!.lineTo(pts[j].x, pts[j].y);
            ctx!.strokeStyle = nearMouse
              ? `rgba(16,185,129,${alpha})`
              : `rgba(63,63,70,${alpha})`;
            ctx!.lineWidth = nearMouse ? 0.8 : 0.4;
            ctx!.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => { mouse.x = -999; mouse.y = -999; };

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'auto' }}
      aria-hidden="true"
    />
  );
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center relative overflow-hidden">

      {/* JSON-LD — server-rendered, first thing AI bots read */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

  {/* Animated particle grid background */}
<div className="absolute inset-0 w-full h-full z-0 pointer-events-auto">
  <ParticleGrid />
</div>

      {/* Soft ambient glows layered on top of the grid */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 text-center z-10 py-24">

        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs font-medium tracking-wide uppercase mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          Stack Intelligence Platform
        </div>

        {/* Hero Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
          Audit your infrastructure.<br />
          <span className="text-white">Discover your gaps.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Run an interactive compliance and architecture assessment. We generate a custom diagnostic score, pinpoint critical vulnerabilities, and build your personalized SaaS remediation blueprint.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/assessment"
            className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Start Free Assessment &rarr;
          </Link>
          <Link
            href="/about"
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white font-medium rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-colors duration-200"
          >
            How it works
          </Link>
        </div>

        {/* Trust Signals */}
        <div className="mt-20 pt-10 border-t border-zinc-900 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: '3 Mins', label: 'Average Audit Time' },
            { stat: 'NIST',   label: 'Framework Aligned' },
            { stat: 'SOC 2',  label: 'Compliance Ready' },
            { stat: '100%',   label: 'Free to Use' },
          ].map(({ stat, label }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-white mb-1">{stat}</div>
              <div className="text-sm text-zinc-500">{label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}