import React, { useEffect, useState } from 'react';

// Stages shown while a photo is analysed. They type out one after another.
export function stagesFor(engine) {
  return engine === 'roboflow+ai'
    ? [
        'Uploading your photo securely...',
        'Scanning the leaf with our image-detection model...',
        'Identifying plant disease patterns...',
        'Checking detection confidence...',
        'Writing your advice with FarmGuard AI...',
      ]
    : [
        'Uploading your photo securely...',
        'Scanning the leaf with our vision model...',
        'Identifying plant disease patterns...',
        'Checking confidence before answering...',
        'Preparing your advice...',
      ];
}

export const MIN_LOADING_MS = 3800; // long enough for the first stages to be read

export default function AnalysisLoader({ engine }) {
  const stages = stagesFor(engine);
  const [stage, setStage] = useState(0);
  const [chars, setChars] = useState(0);

  useEffect(() => {
    const text = stages[stage];
    if (chars < text.length) {
      const t = setTimeout(() => setChars((c) => c + 1), 22);
      return () => clearTimeout(t);
    }
    if (stage < stages.length - 1) {
      const t = setTimeout(() => { setStage((s) => s + 1); setChars(0); }, 420);
      return () => clearTimeout(t);
    }
  }, [chars, stage, stages]);

  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden bg-tomDrkrGreen/70 backdrop-blur-[2px] flex flex-col justify-end" role="status" aria-live="polite">
      <div className="scan-line" />
      <div className="m-4 rounded-xl bg-black/55 text-white p-4 font-mono text-sm">
        {stages.slice(0, stage).map((s) => (
          <div key={s} className="text-tomWhite/70 flex gap-2"><span className="text-green-400">✓</span>{s}</div>
        ))}
        <div className="flex gap-2">
          <span className="text-yellow-300 animate-pulse">›</span>
          <span>{stages[stage].slice(0, chars)}<span className="typing-caret">▍</span></span>
        </div>
      </div>
    </div>
  );
}
