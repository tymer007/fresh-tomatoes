import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar.jsx';
import Analyzer from './components/Analyzer.jsx';
import Result from './components/Result.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import Privacy from './components/Privacy.jsx';
import { HowItWorks, Coming, Plans, Labs, Team, Faq, Feedback, Footer } from './components/Sections.jsx';
import { api } from './lib/api.js';

export default function App() {
  const [status, setStatus] = useState({ engine: 'roboflow+ai', waitlistCount: 0 });
  const [result, setResult] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const isPrivacy = window.location.pathname.replace(/\/$/, '') === '/privacy';

  useEffect(() => {
    api.status().then((s) => s && setStatus(s));
  }, []);

  useEffect(() => {
    if (!isPrivacy && window.location.hash) {
      setTimeout(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, [isPrivacy]);

  return (
    <div className="min-h-screen bg-white font-sora">
      <Navbar />
      {isPrivacy ? (
        <Privacy />
      ) : (
        <>
          <Analyzer engine={status.engine} result={result} onResult={setResult} />
          <Result key={result?.scanId || "none"} result={result} onAsk={() => setChatOpen(true)} />
          <HowItWorks engine={status.engine} />
          <Coming waitlistCount={status.waitlistCount} />
          <Plans />
          <Labs />
          <Team />
          <Faq engine={status.engine} />
          <Feedback />
        </>
      )}
      <Footer engine={status.engine} />
      <ChatWidget open={chatOpen} setOpen={setChatOpen} scan={result} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: { background: '#CA1B2B', color: '#ECEDEB' },
          success: { style: { background: '#19643A', color: '#ECEDEB' } },
        }}
      />
    </div>
  );
}
