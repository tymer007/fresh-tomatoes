import React, { useState } from 'react';
import { Leaf, AlertTriangle, Check, X, HelpCircle, MessageCircle, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api.js';

function rating(score) {
  if (score >= 85) return { label: 'Excellent health', color: 'text-tomGreen', bar: 'bg-tomGreen', img: '/tom_rating_1.png' };
  if (score >= 65) return { label: 'Good health', color: 'text-green-600', bar: 'bg-green-500', img: '/tom_rating_2.png' };
  if (score >= 45) return { label: 'Fair health', color: 'text-yellow-600', bar: 'bg-yellow-500', img: '/tom_rating_3.png' };
  return { label: 'Poor health', color: 'text-tomRed', bar: 'bg-tomRed', img: '/tom_rating_4.png' };
}

const NOT_SURE_TEXT = {
  low_confidence: (r) => `Our detection model's best match was ${r.disease}, but only at ${r.confidence}% confidence - too low to give you advice we'd stand behind.`,
  disagreement: (r) => `Our detection model suggested ${r.disease}, but our second check of the photo points to ${r.secondOpinion || 'something else'}. When the two checks disagree, we don't guess.`,
  not_tomato: () => "This photo doesn't look like a tomato leaf, or it's too unclear to judge."
};

export default function Result({ result, onAsk }) {
  const [answered, setAnswered] = useState(null);
  if (!result) return null;

  const answer = async (value) => {
    setAnswered(value);
    try {
      await api.feedback({ type: 'correctness', scanId: result.scanId, answer: value, disease: result.disease });
      toast.success('Thanks - this helps us measure and improve accuracy.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const r = result.sure ? rating(result.healthScore) : null;
  return (
    <section id="result" className="py-14 px-4 bg-tomWhite">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-10">
        <h2 className="text-2xl font-semibold text-tomDrkrGreen mb-8 text-center">Analysis result</h2>

        {result.sure ? (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mb-8 text-center">
              <div className="rounded-xl bg-tomWhite p-5">
                <div className="text-xs uppercase tracking-wide text-tomDarkGreen mb-1">Diagnosis</div>
                <div className="text-2xl font-bold text-tomDrkrGreen">{result.disease}</div>
              </div>
              <div className="rounded-xl bg-tomWhite p-5">
                <div className="text-xs uppercase tracking-wide text-tomDarkGreen mb-1">Confidence</div>
                <div className="text-2xl font-bold text-tomRed">{result.confidence}%</div>
              </div>
              <div className="rounded-xl bg-tomWhite p-5">
                <div className="text-xs uppercase tracking-wide text-tomDarkGreen mb-1">Health score</div>
                <div className={`text-2xl font-bold ${r.color}`}>{result.healthScore}%</div>
              </div>
            </div>

            <div className="text-center mb-8">
              <img src={r.img} alt="" className="w-14 mx-auto mb-2" />
              <div className={`text-xl font-bold ${r.color} mb-3`}>{r.label}</div>
              <div className="w-full bg-tomDarkWhite rounded-full h-3 max-w-md mx-auto">
                <div className={`h-3 rounded-full transition-all duration-700 ${r.bar}`} style={{ width: `${result.healthScore}%` }} />
              </div>
            </div>

            {result.summary && <p className="text-tomDarkGreen text-center mb-8 max-w-2xl mx-auto">{result.summary}</p>}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-tomDrkrGreen mb-3 flex items-center gap-2"><Leaf className="w-5 h-5 text-tomGreen" /> What to do now</h3>
                <ol className="space-y-2">
                  {result.steps.map((s, i) => (
                    <li key={i} className="flex gap-3 text-tomDarkGreen"><span className="flex-none w-6 h-6 rounded-full bg-tomRed text-white text-xs flex items-center justify-center">{i + 1}</span>{s}</li>
                  ))}
                </ol>
              </div>
              <div className="space-y-5">
                {result.treatment && (
                  <div>
                    <h3 className="font-semibold text-tomDrkrGreen mb-2">Treatment</h3>
                    <p className="text-tomDarkGreen">{result.treatment}</p>
                  </div>
                )}
                {result.prevention?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-tomDrkrGreen mb-2">Prevent it next time</h3>
                    <ul className="list-disc pl-5 space-y-1 text-tomDarkGreen">{result.prevention.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-tomDarkGreen/80 mt-8 border-t border-tomDarkWhite pt-4">
              This is guidance, not a lab diagnosis. For serious outbreaks, contact an agricultural extension officer. Only use NAFDAC-registered products from a licensed agro-dealer, and follow the label.
            </p>
          </>
        ) : (
          <div className="text-center max-w-xl mx-auto">
            <AlertTriangle className="w-14 h-14 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-tomDrkrGreen mb-3">We're not sure. Try a clearer photo.</h3>
            <p className="text-tomDarkGreen mb-6">{(NOT_SURE_TEXT[result.reason] || NOT_SURE_TEXT.low_confidence)(result)}</p>
            <div className="bg-tomWhite rounded-xl p-5 text-left text-tomDarkGreen">
              <p className="font-semibold text-tomDrkrGreen mb-2 flex items-center gap-2"><Camera className="w-5 h-5" /> For a better photo:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Photograph one affected leaf, filling most of the frame</li>
                <li>Use daylight - avoid flash and deep shade</li>
                <li>Hold steady so the spots are in focus, with no hand shadows</li>
              </ul>
            </div>
            <p className="text-xs text-tomDarkGreen/80 mt-4">If the problem is spreading fast, contact an agricultural extension officer.</p>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-tomWhite rounded-xl p-4">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="font-semibold text-tomDrkrGreen">Was this correct?</span>
            {[['yes', 'Yes', Check], ['no', 'No', X], ['not_sure', 'Not sure', HelpCircle]].map(([v, label, Icon]) => (
              <button key={v} disabled={!!answered} onClick={() => answer(v)}
                className={`px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1 transition ${answered === v ? 'bg-tomGreen text-white border-tomGreen' : 'bg-white border-tomDarkWhite text-tomDrkrGreen hover:border-tomRed'} disabled:cursor-default`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <button onClick={onAsk} className="text-tomRed font-semibold flex items-center gap-2 hover:underline">
            <MessageCircle className="w-5 h-5" /> Ask FarmGuard about this
          </button>
        </div>
        <p className="text-[11px] text-tomDarkGreen/70 mt-3 text-center">
          {result.engine === 'roboflow+ai' ? 'Detected by our tomato leaf disease image model, double-checked and explained by FarmGuard AI.' : 'Analysed by our vision model and explained by FarmGuard AI.'}
        </p>
      </div>
    </section>
  );
}
