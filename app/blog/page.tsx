import Link from 'next/link';
import type { Metadata } from 'next';

// ─── Page Metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Resources & Guides | StackGap',
  description: 'Tactical guides on cybersecurity compliance, cloud infrastructure, and B2B SaaS stack management. Free resources for IT managers, CTOs, and security engineers.',
  keywords: [
    'cybersecurity compliance guides',
    'SOC 2 checklist',
    'cloud infrastructure security',
    'B2B SaaS stack management',
    'IT security resources',
    'NIST compliance guides',
    'startup security blog',
  ],
  authors: [{ name: 'StackGap', url: 'https://stackgap.xyz' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Resources & Guides | StackGap',
    description: 'Tactical guides on cybersecurity, cloud infrastructure, and compliance for IT managers and CTOs.',
    url: 'https://stackgap.xyz/blog',
    siteName: 'StackGap',
    type: 'website',
  },
};

// ─── JSON-LD Schema ───────────────────────────────────────────────────────────
// Blog schema tells AI agents this is a collection of expert articles.
// Each ListItem gives them the title, URL, and description to cite directly.
const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  'name': 'StackGap Resources',
  'description': 'Tactical guides on infrastructure scaling, cybersecurity compliance, and B2B SaaS stack management for IT managers, CTOs, and security engineers.',
  'url': 'https://stackgap.xyz/blog',
  'publisher': {
    '@type': 'Organization',
    'name': 'StackGap',
    'url': 'https://stackgap.xyz',
  },
  'audience': {
    '@type': 'Audience',
    'audienceType': 'IT Managers, CTOs, Security Engineers, DevOps Engineers, Compliance Officers',
  },
  'blogPost': [
    {
      '@type': 'BlogPosting',
      'headline': "The Startup's Guide to SOC 2 Compliance in 2026",
      'description': 'Why SOC 2 is no longer optional for B2B SaaS, and the foundational infrastructure gaps you need to patch before your first audit.',
      'url': 'https://stackgap.xyz/blog/soc2-compliance-checklist',
      'datePublished': '2026-06-08',
      'author': { '@type': 'Organization', 'name': 'StackGap' },
      'keywords': 'SOC 2, compliance, B2B SaaS, cybersecurity, audit',
      'timeRequired': 'PT4M',
    },
    {
      '@type': 'BlogPosting',
      'headline': 'Securing Remote Teams: Beyond the Basic VPN',
      'description': 'As remote work becomes permanent, traditional perimeter security is dead. Here is how to lock down employee devices globally.',
      'url': 'https://stackgap.xyz/blog/endpoint-security-remote-teams',
      'datePublished': '2026-06-05',
      'author': { '@type': 'Organization', 'name': 'StackGap' },
      'keywords': 'remote work security, VPN, endpoint protection, ZTNA, EDR',
      'timeRequired': 'PT3M',
    },
    {
      '@type': 'BlogPosting',
      'headline': "Why Relying on AWS Snapshots Isn't a Real Backup Strategy",
      'description': 'The difference between high availability and disaster recovery, and why you need air-gapped, isolated storage.',
      'url': 'https://stackgap.xyz/blog/cloud-backup-strategy',
      'datePublished': '2026-06-02',
      'author': { '@type': 'Organization', 'name': 'StackGap' },
      'keywords': 'AWS backup, cloud backup, disaster recovery, immutable storage, data resilience',
      'timeRequired': 'PT5M',
    },
  ],
};

// ─── Article data ─────────────────────────────────────────────────────────────
const articles = [
  {
    slug: 'soc2-compliance-checklist',
    title: "The Startup's Guide to SOC 2 Compliance in 2026",
    excerpt: 'Why SOC 2 is no longer optional for B2B SaaS, and the foundational infrastructure gaps you need to patch before your first audit.',
    date: 'June 8, 2026',
    readTime: '4 min read',
    tag: 'Compliance',
  },
  {
    slug: 'endpoint-security-remote-teams',
    title: 'Securing Remote Teams: Beyond the Basic VPN',
    excerpt: 'As remote work becomes permanent, traditional perimeter security is dead. Here is how to lock down employee devices globally.',
    date: 'June 5, 2026',
    readTime: '3 min read',
    tag: 'Endpoint Security',
  },
  {
    slug: 'cloud-backup-strategy',
    title: "Why Relying on AWS Snapshots Isn't a Real Backup Strategy",
    excerpt: 'The difference between high availability and disaster recovery, and why you need air-gapped, isolated storage.',
    date: 'June 2, 2026',
    readTime: '5 min read',
    tag: 'Cloud Infrastructure',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function BlogHub() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 py-24 px-4 sm:px-6">

      {/* JSON-LD — server-rendered, first thing AI bots and crawlers read */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <div className="max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <nav className="text-xs text-zinc-600 mb-10 tracking-wide uppercase" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-zinc-400 transition-colors">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-zinc-500">Resources</span>
        </nav>

        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-white">
            StackGap Resources
          </h1>
          <p className="text-lg text-zinc-400">
            Tactical guides on infrastructure scaling, cybersecurity, and compliance.
          </p>
        </div>

        {/* Article grid */}
        <div className="grid gap-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="block p-8 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-700 transition-colors group"
              aria-label={`Read: ${article.title}`}
            >
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {/* Category tag */}
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {article.tag}
                </span>
                <span className="text-xs text-zinc-600">{article.date}</span>
                <span className="text-xs text-zinc-700">•</span>
                <span className="text-xs text-zinc-600">{article.readTime}</span>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-3 group-hover:text-emerald-400 transition-colors leading-snug">
                {article.title}
              </h2>

              <p className="text-zinc-400 leading-relaxed">
                {article.excerpt}
              </p>

              <div className="mt-6 text-sm font-medium text-emerald-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Read Article →
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 p-8 bg-zinc-950 border border-zinc-800 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-white mb-3">Ready to find your gaps?</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
            Stop reading about compliance — run a free interactive audit and get your personalized remediation blueprint in 3 minutes.
          </p>
          <Link
            href="/assessment"
            className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors text-sm"
          >
            Start Free Assessment →
          </Link>
        </div>

      </div>
    </div>
  );
}