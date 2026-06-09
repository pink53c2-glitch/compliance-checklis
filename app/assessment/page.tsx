import Link from 'next/link';
import type { Metadata } from 'next';

// ─── Page Metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Choose Your Assessment | StackGap',
  description: 'Select a B2B vertical to run a free interactive gap analysis. Get a personalized SaaS remediation blueprint for cybersecurity, cloud infrastructure, or your marketing stack.',
  keywords: [
    'B2B gap analysis',
    'cybersecurity assessment',
    'cloud infrastructure audit',
    'marketing stack review',
    'SaaS tool recommendations',
    'free IT compliance tool',
  ],
  robots: 'index, follow',
  openGraph: {
    title: 'Choose Your Assessment | StackGap',
    description: 'Free interactive gap analysis across cybersecurity, cloud infrastructure, and marketing. Personalized remediation blueprint in 3 minutes.',
    url: 'https://stackgap.xyz/assessment',
    siteName: 'StackGap',
    type: 'website',
  },
};

// ─── JSON-LD Schema ───────────────────────────────────────────────────────────
// ItemList schema tells AI agents exactly what assessments exist and where.
// Each ListItem links to a WebApplication with full metadata.
const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  'name': 'StackGap B2B Assessment Categories',
  'description': 'A collection of free interactive B2B stack gap analysis tools, each targeting a specific infrastructure vertical.',
  'url': 'https://stackgap.xyz/assessment',
  'numberOfItems': 3,
  'itemListElement': [
    {
      '@type': 'ListItem',
      'position': 1,
      'item': {
        '@type': 'WebApplication',
        'name': 'Cybersecurity & Compliance Assessment',
        'url': 'https://stackgap.xyz/assessment/cybersecurity',
        'applicationCategory': 'SecurityApplication',
        'description': 'Audit endpoint security, access controls, data protection policies, and measure SOC 2 / ISO 27001 compliance readiness.',
        'featureList': [
          'Endpoint protection gap analysis',
          'Access control audit',
          'SOC 2 readiness scoring',
          'ISO 27001 compliance mapping',
          'NIST CSF framework alignment',
          'Personalized SaaS remediation recommendations',
        ],
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'audience': {
          '@type': 'Audience',
          'audienceType': 'IT Managers, CISOs, Security Engineers, Compliance Officers',
        },
      },
    },
    {
      '@type': 'ListItem',
      'position': 2,
      'item': {
        '@type': 'WebApplication',
        'name': 'Cloud Infrastructure & DevOps Assessment',
        'url': 'https://stackgap.xyz/assessment/cloud-infrastructure',
        'applicationCategory': 'DeveloperApplication',
        'description': 'Evaluate AWS and GCP architecture gaps, CI/CD pipeline health, cloud backup policies, disaster recovery readiness, and server cost efficiency.',
        'featureList': [
          'AWS / GCP architecture review',
          'CI/CD pipeline gap analysis',
          'Cloud backup and DR readiness',
          'Infrastructure cost efficiency scoring',
          'DevOps toolchain recommendations',
        ],
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'audience': {
          '@type': 'Audience',
          'audienceType': 'DevOps Engineers, CTOs, Cloud Architects, Platform Engineers',
        },
      },
    },
    {
      '@type': 'ListItem',
      'position': 3,
      'item': {
        '@type': 'WebApplication',
        'name': 'Marketing Stack & CRM Assessment',
        'url': 'https://stackgap.xyz/assessment/marketing-stack',
        'applicationCategory': 'BusinessApplication',
        'description': 'Analyze lead attribution gaps, CRM automation health, GDPR and data privacy compliance, and identify redundant tool sprawl in your marketing stack.',
        'featureList': [
          'Lead attribution gap analysis',
          'CRM automation health check',
          'GDPR compliance readiness',
          'Marketing tool sprawl audit',
          'Revenue operations recommendations',
        ],
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'audience': {
          '@type': 'Audience',
          'audienceType': 'Marketing Managers, Growth Engineers, RevOps, CMOs',
        },
      },
    },
  ],
};

// ─── Category data ────────────────────────────────────────────────────────────
const categories = [
  {
    slug: 'cybersecurity',
    title: 'Cybersecurity & Compliance',
    desc: 'Audit endpoint security, access controls, data protection, and track your SOC 2 / ISO readiness.',
    icon: '🛡️',
    status: 'Live' as const,
    color: 'border-emerald-500/30 hover:border-emerald-500',
  },
  {
    slug: 'cloud-infrastructure',
    title: 'Cloud Infrastructure & DevOps',
    desc: 'Evaluate AWS/GCP architecture, CI/CD pipeline gaps, cloud backup policies, and server efficiency.',
    icon: '☁️',
    status: 'Coming Soon' as const,
    color: 'border-zinc-800 opacity-60 cursor-not-allowed',
  },
  {
    slug: 'marketing-stack',
    title: 'Marketing Stack & CRM',
    desc: 'Analyze lead attribution gaps, CRM automation health, data privacy compliance, and tool sprawl.',
    icon: '📈',
    status: 'Coming Soon' as const,
    color: 'border-zinc-800 opacity-60 cursor-not-allowed',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function CategoryHub() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 py-16 px-4">

      {/* JSON-LD — server-rendered for AI bots and crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          {/* Breadcrumb — helps both users and crawlers understand site structure */}
          <nav className="text-xs text-zinc-600 mb-6 tracking-wide uppercase" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-zinc-400 transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-zinc-500">Assessments</span>
          </nav>

          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent sm:text-5xl">
            B2B Stack Intelligence Platform
          </h1>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
            Select a vertical to run an interactive gap analysis and generate your infrastructure remediation blueprint.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const isLive = cat.status === 'Live';

            if (isLive) {
              return (
                <Link
                  key={cat.slug}
                  href={`/assessment/${cat.slug}`}
                  className={`block p-6 rounded-xl bg-zinc-950 border transition-all duration-300 ${cat.color}`}
                  // aria-label helps screen readers and some AI agents
                  aria-label={`Start ${cat.title} assessment`}
                >
                  <CategoryCardContent cat={cat} />
                </Link>
              );
            }

            return (
              <div
                key={cat.slug}
                className={`block p-6 rounded-xl bg-zinc-950 border transition-all duration-300 ${cat.color}`}
                aria-label={`${cat.title} — coming soon`}
              >
                <CategoryCardContent cat={cat} />
              </div>
            );
          })}
        </div>

        {/* Bottom trust line */}
        <p className="text-center text-zinc-600 text-sm mt-12 tracking-wide">
          All assessments are free · No account required · Results delivered instantly
        </p>

      </div>
    </div>
  );
}

// ─── Card content extracted to avoid repetition ──────────────────────────────
function CategoryCardContent({ cat }: { cat: typeof categories[number] }) {
  const isLive = cat.status === 'Live';
  return (
    <>
      <div className="text-3xl mb-4" role="img" aria-label={cat.title}>{cat.icon}</div>
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="font-semibold text-lg text-white leading-tight">{cat.title}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap flex-shrink-0 ${
          isLive
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
        }`}>
          {cat.status}
        </span>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">{cat.desc}</p>
    </>
  );
}