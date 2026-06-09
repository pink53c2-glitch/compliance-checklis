'use client'; 

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  
  return (
    <nav className="border-b border-zinc-900 bg-black/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-white hover:opacity-80 transition-opacity">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          StackGap
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <Link href="/assessment" className="hover:text-emerald-400 transition-colors">Assessments</Link>
          <Link href="/blog" className="hover:text-white transition-colors">Resources</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/assessment" className="px-4 py-1.5 bg-white text-black font-semibold rounded-lg text-xs hover:bg-zinc-200 transition-colors">
            Start Free &rarr;
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-zinc-400 hover:text-white transition-colors text-xl"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-zinc-900 bg-black px-4 py-4 flex flex-col gap-4 text-sm font-medium text-zinc-400 shadow-xl">
          <Link href="/assessment" onClick={() => setOpen(false)} className="hover:text-emerald-400 transition-colors">Assessments</Link>
          <Link href="/blog" onClick={() => setOpen(false)} className="hover:text-white transition-colors">Resources</Link>
          <Link href="/about" onClick={() => setOpen(false)} className="hover:text-white transition-colors">About</Link>
          <Link href="/assessment" onClick={() => setOpen(false)} className="w-full text-center py-2.5 bg-white text-black font-semibold rounded-lg text-xs hover:bg-zinc-200 transition-colors mt-2">
            Start Free Assessment &rarr;
          </Link>
        </div>
      )}
    </nav>
  );
}