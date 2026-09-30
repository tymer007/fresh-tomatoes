import React, { useRef, useState } from 'react';
import { Upload, Camera, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import AnalysisLoader, { MIN_LOADING_MS } from './AnalysisLoader.jsx';
import { api, usage, fileToDataUrl, urlToFile, SAMPLES, NIGERIAN_STATES, FREE_LIMITS, PRO_PRICE } from '../lib/api.js';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Analyzer({ engine, result, onResult }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sample, setSample] = useState(null);
  const [context, setContext] = useState('');
  const [state, setState] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [left, setLeft] = useState(usage.left('scans'));
  const cameraRef = useRef(null);

  const choose = (f, sampleId = null) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return toast.error('Please use a JPEG, PNG or WebP photo.');
    if (f.size > MAX_BYTES) return toast.error(`That photo is ${(f.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB - try a smaller photo.`);
    setFile(f);
    setSample(sampleId);
    setPreview(URL.createObjectURL(f));
    onResult(null);
  };

  const analyze = async (f = file, sampleId = sample) => {
    if (!f || loading) return;
    if (usage.left('scans') <= 0) {
      toast.error(`You've used today's ${FREE_LIMITS.scans} free scans. Come back tomorrow - Pro (${PRO_PRICE}/month) is coming soon.`);
      return;
    }
    setLoading(true);
    onResult(null);
    try {
      const image = await fileToDataUrl(f);
      // Keep the loading stages on screen for a few seconds even if the answer is quick.
      const [data] = await Promise.all([api.detect({ image, context, state, consent, sample: sampleId }), sleep(MIN_LOADING_MS)]);
      usage.add('scans');
      onResult({ ...data, preview: URL.createObjectURL(f) });
      setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 150);
    } catch (err) {
      if (err.limit) usage.exhaust('scans');
      toast.error(err.message);
    } finally {
      setLeft(usage.left('scans'));
      setLoading(false);
    }
  };

  const trySample = async (s) => {
    if (loading) return;
    const f = await urlToFile(s.src, `${s.id}.jpg`);
    choose(f, s.id);
    analyze(f, s.id);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    choose(e.dataTransfer.files?.[0]);
  };

  return (
    <section id="home" className="pt-24 pb-16 px-4 bg-gradient-to-br from-tomWhite to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <img src="/frsh_tom_clrd_crvd.png" alt="Fresh Tomatoes" className="w-56 mx-auto mb-3" />
          <h1 className="text-4xl sm:text-5xl font-bold text-tomDrkrGreen mb-4">Analyze your tomato plant</h1>
          <p className="text-lg sm:text-xl text-tomDarkGreen max-w-3xl mx-auto">
            FarmGuard is an AI plant disease detection and advice platform for Nigerian crops. Fresh Tomatoes is our first prototype. More crops are coming.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Upload panel */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-tomDarkWhite">
            <label
              className={`relative block border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-4 ${drag ? 'border-tomRed bg-tomWhite' : 'border-tomDarkWhite hover:border-tomRed hover:bg-tomWhite'}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
            >
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
              <Upload className="w-12 h-12 text-tomDarkGreen mx-auto mb-3" />
              <p className="text-lg font-medium text-tomDrkrGreen mb-1">{file ? 'Photo ready - click to change' : 'Drop a photo or click to upload'}</p>
              <p className="text-sm text-tomDarkGreen">JPEG or PNG, up to 5 MB · one leaf, in daylight</p>
            </label>

            <button type="button" onClick={() => cameraRef.current?.click()} className="w-full bg-tomDarkWhite text-tomDrkrGreen py-3 rounded-lg font-medium mb-4 md:hidden flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" /> Use camera
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />

            <div className="mb-5">
              <p className="text-sm font-semibold text-tomDrkrGreen mb-2">No diseased leaf nearby? Try a sample photo:</p>
              <div className="grid grid-cols-4 gap-2">
                {SAMPLES.map((s) => (
                  <button key={s.id} type="button" onClick={() => trySample(s)} disabled={loading}
                    className={`group rounded-lg overflow-hidden border-2 text-left transition ${sample === s.id ? 'border-tomRed' : 'border-transparent hover:border-tomRed'} disabled:opacity-60`}>
                    <img src={s.src} alt={s.label} className="h-16 w-full object-cover" loading="lazy" />
                    <span className="block text-[11px] leading-tight font-medium text-tomDrkrGreen bg-tomWhite px-1.5 py-1">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <textarea className="w-full p-3 rounded-lg border border-tomDarkWhite focus:ring-2 focus:ring-tomRed focus:border-tomRed resize-none mb-3"
              rows={2} maxLength={500} placeholder="Tell us what you've noticed (optional) - e.g. 'yellow spots on lower leaves after rain'"
              value={context} onChange={(e) => setContext(e.target.value)} />

            <select className="w-full p-3 rounded-lg border border-tomDarkWhite mb-4 text-tomDrkrGreen bg-white" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Your state (optional)</option>
              {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>

            <label className="flex items-start gap-3 text-sm text-tomDarkGreen mb-5 cursor-pointer">
              <input type="checkbox" className="mt-1 accent-tomRed" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>Allow FarmGuard to keep this photo to improve disease detection and build Nigerian crop datasets. (Optional - <a href="/privacy" className="text-tomRed underline">privacy</a>)</span>
            </label>

            <button onClick={() => analyze()} disabled={!file || loading || left <= 0}
              className={`w-full py-4 rounded-lg font-semibold transition ${!file || loading || left <= 0 ? 'bg-tomDarkWhite cursor-not-allowed text-tomDrkrGreen' : 'bg-tomRed hover:bg-tomDarkRed text-white shadow-lg'}`}>
              {loading ? 'Checking your plant...' : left <= 0 ? 'Daily free scans used - come back tomorrow' : 'Analyze Plant'}
            </button>
            <p className="text-xs text-tomDarkGreen mt-3 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Free plan: {left} of {FREE_LIMITS.scans} scans left today
            </p>
          </div>

          {/* Preview / loader */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-lg">
              {preview ? (
                <img src={preview} alt="Your tomato leaf" className="w-full h-auto max-h-[520px] object-cover rounded-2xl shadow-lg" />
              ) : (
                <img src="/tom_wreath.webp" alt="Healthy tomato plant" className="w-full h-auto" />
              )}
              {loading && <AnalysisLoader engine={engine} />}
              {!loading && result && preview && (
                <div className={`absolute top-4 right-4 rounded-xl px-4 py-2 text-white shadow-lg ${result.sure ? 'bg-tomRed' : 'bg-yellow-600'}`}>
                  <div className="text-xs font-medium">{result.sure ? result.disease : 'Not sure'}</div>
                  <div className="text-lg font-bold">{result.sure ? `${result.confidence}% confidence` : 'Try a clearer photo'}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
