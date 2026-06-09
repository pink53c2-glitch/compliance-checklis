import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import Navbar from './components/Navbar';

// ─── Font ─────────────────────────────────────────────────────────────────────
const dmSans = DM_Sans({ subsets: ['latin'] });

// ─── Page Metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'StackGap — B2B Stack Intelligence Platform',
  description: 'Free interactive gap analysis across cybersecurity, cloud infrastructure, and marketing. Get a personalized SaaS remediation blueprint in 3 minutes.',
  keywords: [
    'B2B SaaS assessment',
    'stack gap analysis',
    'cybersecurity compliance checker',
    'cloud infrastructure audit',
    'free IT assessment tool',
    'SaaS remediation blueprint',
    'NIST compliance tool',
    'SOC 2 readiness checker',
  ],
  authors: [{ name: 'StackGap', url: 'https://stackgap.xyz' }],
  robots: 'index, follow',
  openGraph: {
    title: 'StackGap — B2B Stack Intelligence Platform',
    description: 'Free interactive gap analysis across cybersecurity, cloud infrastructure, and marketing stack.',
    url: 'https://stackgap.xyz',
    siteName: 'StackGap',
    type: 'website',
  },
};

// ─── JSON-LD — Organization schema ───────────────────────────────────────────
// Lives in layout so it appears on every page of the site.
// Tells AI agents and Google exactly what StackGap is as an entity —
// critical for building long-term citation trust across all pages.
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'StackGap',
  'url': 'https://stackgap.xyz',
  'description': 'A free B2B stack intelligence platform that runs interactive compliance and architecture assessments, identifies infrastructure gaps, and recommends specific SaaS tools to close them.',
  'foundingDate': '2026',
  'knowsAbout': [
    'Cybersecurity Compliance',
    'SOC 2 Certification',
    'ISO 27001',
    'NIST Cybersecurity Framework',
    'Cloud Infrastructure',
    'B2B SaaS Tools',
    'IT Gap Analysis',
    'DevOps Security',
  ],
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'USD',
    'description': 'All assessments and remediation blueprints are completely free.',
  },
  'sameAs': [
    'https://www.stackgap.xyz',
  ],
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black text-zinc-100">
      <body className={`${dmSans.className} min-h-screen flex flex-col antialiased`}>

        {/* Organization JSON-LD — server-rendered on every page */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        {/* ── Global Navigation ── */}
<Navbar />
        {/* ── Page Content ── */}
        <main className="flex-grow">
          {children}
        </main>

        {/* ── Global Footer ── */}
        <footer className="border-t border-zinc-900 bg-black py-8 text-xs text-zinc-600 mt-auto">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
              <p>© {new Date().getFullYear()} StackGap. All rights reserved.</p>
            </div>
            <div className="flex gap-6">
              <Link href="/blog" className="hover:text-zinc-400 transition-colors">Resources</Link>
              <Link href="/assessment" className="hover:text-zinc-400 transition-colors">Assessments</Link>
              <Link href="/about" className="hover:text-zinc-400 transition-colors">About</Link>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}