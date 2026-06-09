import Link from 'next/link';

const categories = [
  {
    slug: 'cybersecurity',
    title: 'Cybersecurity & Compliance',
    desc: 'Audit endpoint security, access controls, data protection, and track your SOC 2 / ISO readiness.',
    icon: '🛡️',
    status: 'Live',
    color: 'border-emerald-500/30 hover:border-emerald-500'
  },
  {
    slug: 'cloud-infrastructure',
    title: 'Cloud Infrastructure & DevOps',
    desc: 'Evaluate AWS/GCP architecture, CI/CD pipeline gaps, cloud backup policies, and server efficiency.',
    icon: '☁️',
    status: 'Coming Soon',
    color: 'border-zinc-800 opacity-60 hover:opacity-100 cursor-not-allowed'
  },
  {
    slug: 'marketing-stack',
    title: 'Marketing Stack & CRM',
    desc: 'Analyze lead attribution gaps, CRM automation health, data privacy compliance, and tool sprawl.',
    icon: '📈',
    status: 'Coming Soon',
    color: 'border-zinc-800 opacity-60 hover:opacity-100 cursor-not-allowed'
  }
];

export default function CategoryHub() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent sm:text-5xl">
            B2B Stack Intelligence Platform
          </h1>
          <p className="mt-4 text-zinc-400 text-lg">
            Select a vertical to run an interactive gap analysis and generate your infrastructure remediation blueprint.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const isLive = cat.status === 'Live';
            const CardWrapper = isLive ? Link : 'div';
            
            return (
              <CardWrapper 
                key={cat.slug} 
                href={isLive ? `/assessment/${cat.slug}` : undefined}
                className={`block p-6 rounded-xl bg-zinc-950 border transition-all duration-300 ${cat.color}`}
              >
                <div className="text-3xl mb-4">{cat.icon}</div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg text-white">{cat.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    isLive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}>
                    {cat.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{cat.desc}</p>
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </div>
  );
}