import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 py-24 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
            Democratizing Enterprise Intelligence
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            StackGap was built to help growing businesses identify critical vulnerabilities in their architecture without paying tens of thousands of dollars for consulting firms.
          </p>
        </div>

        {/* How It Works - The 3 Steps */}
        <div className="mb-24">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">How The Engine Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 hover:border-zinc-800 transition-colors">
              <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-emerald-400 font-bold text-xl mb-6">1</div>
              <h3 className="text-xl font-semibold text-white mb-3">Run the Diagnostic</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Select your vertical and run through our interactive framework. Our assessments are mapped to industry standards like SOC 2, ISO 27001, and NIST.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 hover:border-zinc-800 transition-colors">
              <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-emerald-400 font-bold text-xl mb-6">2</div>
              <h3 className="text-xl font-semibold text-white mb-3">Get Benchmarked</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Our engine processes your answers to generate a 0-100 StackGap Health Score, benchmarking your current architecture against industry peers.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 hover:border-zinc-800 transition-colors">
              <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-emerald-400 font-bold text-xl mb-6">3</div>
              <h3 className="text-xl font-semibold text-white mb-3">Patch the Gaps</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                We automatically generate a PDF blueprint and on-screen remediation plan, recommending the exact enterprise SaaS tools needed to secure your infrastructure.
              </p>
            </div>

          </div>
        </div>

        {/* Transparency / Affiliate Reviewer Trust Signal */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Why is StackGap 100% Free?</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            We believe fundamental security and compliance intelligence should be accessible to everyone. To keep our diagnostic engine completely free for users, StackGap operates on a partner-supported model. When our engine identifies a gap in your infrastructure and you deploy a recommended SaaS solution through our remediation links, we may earn a B2B referral commission from our technology partners.
          </p>
          <p className="text-zinc-500 text-sm italic">
            This allows us to maintain the platform, update our frameworks, and keep the data flowing without putting our users behind a paywall.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link 
            href="/assessment" 
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors duration-200"
          >
            Run Your First Assessment &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}