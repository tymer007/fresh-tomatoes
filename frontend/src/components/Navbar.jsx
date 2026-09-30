import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const LINKS = [
  ['home', 'Home'],
  ['how-it-works', 'How to Use'],
  ['plans', 'Plans'],
  ['feedback', 'Feedback'],
  ['faq', 'FAQ'],
];

export function goTo(id) {
  if (window.location.pathname !== '/') {
    window.location.href = `/#${id}`;
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function Brand({ light = true }) {
  return (
    <a href="/" className="flex items-center gap-2" aria-label="Fresh Tomatoes by FarmGuard - home">
      <img src="/frsh_tom_logo.png" alt="Fresh Tomatoes" className="w-32 sm:w-36" />
      <span className={`text-[11px] leading-tight font-semibold uppercase tracking-wider ${light ? 'text-tomWhite/90' : 'text-tomDarkGreen'}`}>
        by<br />FarmGuard
      </span>
    </a>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const click = (id) => {
    setOpen(false);
    goTo(id);
  };
  return (
    <nav className="fixed top-0 inset-x-0 bg-tomRed text-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Brand />
          <div className="hidden md:flex items-center space-x-7">
            {LINKS.map(([id, label]) => (
              <button key={id} onClick={() => click(id)} className="hover:text-tomWhite/80 transition-colors">{label}</button>
            ))}
            <button onClick={() => click('home')} className="bg-white text-tomRed px-4 py-2 rounded-lg font-semibold hover:bg-tomDarkWhite transition-colors">
              Analyze a Plant
            </button>
          </div>
          <button className="md:hidden p-2 -mr-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <div className="md:hidden py-4 border-t border-white/20 flex flex-col space-y-4">
            {LINKS.map(([id, label]) => (
              <button key={id} onClick={() => click(id)} className="text-tomWhite text-left">{label}</button>
            ))}
            <button onClick={() => click('home')} className="bg-white text-tomRed px-4 py-2 rounded-lg font-semibold w-fit">Analyze a Plant</button>
          </div>
        )}
      </div>
    </nav>
  );
}
