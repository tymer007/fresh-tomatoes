import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Star, Check, Smartphone, Languages, Sprout, FlaskConical, Mail, Quote, ScanSearch, ShieldCheck, MessageSquareText } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, FREE_LIMITS, PRO_PRICE, CONTACT_EMAIL, SAMPLES } from '../lib/api.js';
import { Brand, goTo } from './Navbar.jsx';

const H2 = ({ children, light }) => <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${light ? 'text-white' : 'text-tomDrkrGreen'}`}>{children}</h2>;

/* ---------------- How it works ---------------- */
export function HowItWorks({ engine }) {
  const steps = [
    { img: '/samples/healthy.jpg', title: '1. Take a clear photo', text: 'Photograph one tomato leaf in daylight. Fill the frame with the leaf.' },
    { img: '/samples/early-blight.jpg', title: '2. Upload it', text: 'Add a short note on what you noticed, then tap Analyze Plant.' },
    { img: '/samples/late-blight.jpg', title: '3. Read your result', text: 'See the disease, how confident we are, a health score and simple steps.' },
  ];
  const pipeline = engine === 'roboflow+ai'
    ? [
        [ScanSearch, 'Image-detection model', 'A computer-vision model trained only on tomato leaf disease photos scans your leaf and scores each disease it recognises.'],
        [ShieldCheck, 'Confidence & second check', "If the model isn't confident, or a second AI check of the photo disagrees with it, we tell you we're not sure instead of guessing."],
        [MessageSquareText, 'Plain-language advice', 'FarmGuard AI turns the confirmed result into short steps, treatment and prevention tips you can act on the same day.'],
      ]
    : [
        [ScanSearch, 'Vision model scan', 'A vision model examines the leaf in your photo and scores how confident it is about the problem it sees.'],
        [ShieldCheck, 'Confidence check', "If confidence is below our threshold, or the photo isn't a tomato leaf, we tell you we're not sure instead of guessing."],
        [MessageSquareText, 'Plain-language advice', 'FarmGuard AI turns the result into short steps, treatment and prevention tips you can act on the same day.'],
      ];
  return (
    <section id="how-it-works" className="py-16 bg-gradient-to-r from-tomRed to-red-900">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <H2 light>How to use it</H2>
        <p className="text-lg text-tomWhite mb-10">Quick. Clear. Local.</p>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {steps.map((s) => (
            <div key={s.title} className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden text-white text-left">
              <img src={s.img} alt="" className="h-40 w-full object-cover" loading="lazy" />
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
                <p className="text-tomWhite">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white/10 rounded-xl p-5 text-tomWhite text-sm max-w-3xl mx-auto mb-12">
          <strong className="text-white">What makes a good photo:</strong> one leaf, in focus, in daylight, with no hand shadows. Blurry or dark photos lower the confidence score.
        </div>

        <h3 className="text-2xl font-bold text-white mb-8">What happens to your photo</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {pipeline.map(([Icon, title, text], i) => (
            <div key={title} className="bg-white rounded-xl p-6 text-left">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-full bg-tomRed text-white flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                <span className="text-xs font-semibold text-tomRed uppercase tracking-wide">Step {i + 1}</span>
              </div>
              <h4 className="font-semibold text-tomDrkrGreen mb-1">{title}</h4>
              <p className="text-tomDarkGreen text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- What's coming + waitlist ---------------- */
export function Coming({ waitlistCount }) {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const crops = [['Tomato', true], ['Cassava'], ['Maize'], ['Rice'], ['Yam'], ['Okra']];
  const join = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.feedback({ type: 'waitlist', email, whatsapp, interests: ['crops', 'mobile app', 'languages'] });
      setDone(true);
      toast.success("You're on the list - we'll let you know when new crops launch.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section id="coming" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <H2>What's coming</H2>
          <p className="text-tomDarkGreen mb-6">Tomato is live now. Next on FarmGuard:</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {crops.map(([c, live]) => (
              <span key={c} className={`px-4 py-2 rounded-full text-sm font-medium ${live ? 'bg-tomGreen text-white' : 'bg-tomWhite text-tomDrkrGreen'}`}>
                <Sprout className="w-4 h-4 inline mr-1" />{c}{live ? ' · live' : ''}
              </span>
            ))}
          </div>
          <div className="space-y-3 text-tomDarkGreen">
            <p className="flex items-center gap-3"><Smartphone className="w-5 h-5 text-tomRed" /> A mobile app that works on low-cost phones</p>
            <p className="flex items-center gap-3"><Languages className="w-5 h-5 text-tomRed" /> Advice in Hausa, Yoruba and Igbo</p>
          </div>
        </div>
        <form onSubmit={join} className="bg-tomWhite rounded-2xl p-8 border border-tomDarkWhite">
          <h3 className="text-2xl font-bold text-tomDrkrGreen mb-2">Join the waitlist</h3>
          <p className="text-tomDarkGreen mb-5">Get an email when your crop, the app or your language launches.</p>
          {done ? (
            <p className="text-tomGreen font-semibold flex items-center gap-2"><Check className="w-5 h-5" /> Thanks - you're on the list.</p>
          ) : (
            <>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" autoComplete="email"
                className="w-full p-3 rounded-lg border border-tomDarkWhite mb-3 focus:ring-2 focus:ring-tomRed" />
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number (optional)" autoComplete="tel"
                className="w-full p-3 rounded-lg border border-tomDarkWhite mb-3 focus:ring-2 focus:ring-tomRed" />
              <button disabled={busy} className="w-full bg-tomRed text-white py-3 rounded-lg font-semibold hover:bg-tomDarkRed disabled:opacity-60">{busy ? 'Joining...' : 'Join waitlist'}</button>
            </>
          )}
          {waitlistCount > 0 && <p className="text-sm text-tomDarkGreen mt-4">{waitlistCount.toLocaleString()} {waitlistCount === 1 ? 'person has' : 'people have'} joined so far.</p>}
        </form>
      </div>
    </section>
  );
}

/* ---------------- Plans ---------------- */
export function Plans() {
  const free = [`${FREE_LIMITS.scans} plant scans a day`, `${FREE_LIMITS.chats} "Ask FarmGuard" chat messages a day`, 'Sample photos to try it out', 'Disease, confidence, health score & advice'];
  const pro = ['More scans every day', 'Unlimited "Ask FarmGuard" chat', 'Scan history for your farm', 'Advice in Hausa, Yoruba and Igbo', 'New crops as they launch'];
  return (
    <section id="plans" className="py-16 px-4 bg-tomWhite">
      <div className="max-w-5xl mx-auto text-center">
        <H2>Plans</H2>
        <p className="text-tomDarkGreen mb-10">Start free. Pro is on the way.</p>
        <div className="grid md:grid-cols-2 gap-6 text-left">
          <div className="bg-white rounded-2xl p-8 border border-tomDarkWhite flex flex-col">
            <h3 className="text-xl font-bold text-tomDrkrGreen">Free</h3>
            <p className="text-tomDarkGreen text-sm mb-4">Limited daily use</p>
            <div className="text-4xl font-bold text-tomGreen mb-6">₦0</div>
            <ul className="space-y-2 mb-8 flex-1">{free.map((f) => <li key={f} className="flex gap-2 text-tomDarkGreen"><Check className="w-5 h-5 text-tomGreen flex-none" />{f}</li>)}</ul>
            <button onClick={() => goTo('home')} className="w-full py-3 rounded-lg border-2 border-tomGreen text-tomGreen font-semibold hover:bg-tomGreen hover:text-white transition">Analyze a plant</button>
          </div>
          <div className="bg-white rounded-2xl p-8 border-2 border-tomRed flex flex-col relative">
            <span className="absolute -top-3 left-8 bg-tomRed text-white text-xs font-semibold px-3 py-1 rounded-full">Coming soon</span>
            <h3 className="text-xl font-bold text-tomDrkrGreen">Pro</h3>
            <p className="text-tomDarkGreen text-sm mb-4">For active farmers and extension workers</p>
            <div className="text-4xl font-bold text-tomRed mb-6">{PRO_PRICE}<span className="text-base font-normal text-tomDarkGreen"> / month</span></div>
            <ul className="space-y-2 mb-8 flex-1">{pro.map((f) => <li key={f} className="flex gap-2 text-tomDarkGreen"><Check className="w-5 h-5 text-tomRed flex-none" />{f}</li>)}</ul>
            <button disabled className="w-full py-3 rounded-lg bg-tomDarkWhite text-tomDrkrGreen font-semibold cursor-not-allowed">Subscription coming soon</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Labs & researchers ---------------- */
export function Labs() {
  return (
    <section id="labs" className="py-14 px-4 bg-tomDrkrGreen text-white">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
        <FlaskConical className="w-16 h-16 text-tomWhite flex-none" />
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">For labs and researchers</h2>
          <p className="text-tomWhite">Plant pathologists and researchers: we're building bulk upload and Nigerian crop disease datasets, collected with farmer consent. Get in touch.</p>
        </div>
        <a href={`mailto:${CONTACT_EMAIL}?subject=FarmGuard%20-%20labs%20and%20research`} className="flex-none bg-white text-tomDrkrGreen px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-tomWhite"><Mail className="w-5 h-5" /> Contact us</a>
      </div>
    </section>
  );
}

/* ---------------- Team ---------------- */
const TEAM = [
  {
    name: 'Prof. Charity A. Amienyo',
    role: 'PhD, Professor of Mycology / Plant Pathology',
    quote: "Early blight, late blight and Septoria can look alike to the untrained eye, yet they call for different responses. A farmer who acts in the first week of an outbreak can save most of the crop. I value that this tool is willing to say \"we're not sure, take a clearer photo\" - in plant pathology, a confident wrong answer does more harm than no answer at all.",
  },
  {
    name: 'Dr. Thomas Godwin A.',
    role: 'PhD, Associate Professor, Information Technology / Cybersecurity / Artificial Intelligence',
    quote: "We deliberately separated the two jobs: a vision model that only knows tomato leaf diseases makes the call, and a language model only explains it. If the checks don't agree, the system stops. That design, together with collecting photos only when the farmer consents, is what makes it trustworthy enough to put in front of farmers.",
  },
  {
    name: 'Deborah Dawen Ezekiel',
    role: 'BSc, MSc, Postgraduate (Plant Pathology)',
    quote: "In the field, farmers often wait until half the plot is affected before anyone can look at it. Being able to photograph one leaf and get clear next steps the same day closes that gap. Every consented photo also helps us build the Nigerian disease data our research has been missing.",
  },
];

export function Team() {
  return (
    <section id="team" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto text-center">
        <H2>From the FarmGuard team</H2>
        <p className="text-tomDarkGreen mb-10">The plant health and AI experts behind the models.</p>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {TEAM.map((t) => (
            <figure key={t.name} className="bg-tomWhite rounded-xl p-6 border border-tomDarkWhite flex flex-col">
              <Quote className="w-8 h-8 text-tomRed mb-3" />
              <blockquote className="text-tomDarkGreen mb-5 flex-1">{t.quote}</blockquote>
              <figcaption>
                <div className="font-semibold text-tomDrkrGreen">{t.name}</div>
                <div className="text-sm text-tomDarkGreen">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
export function Faq({ engine }) {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q: 'What crops does it work on?', a: 'Tomato leaves for now. Cassava, maize, rice, yam and okra are next - join the waitlist to hear when they launch.' },
    {
      q: 'Why should I trust FarmGuard more than asking a general AI chatbot like ChatGPT?',
      a: engine === 'roboflow+ai'
        ? "General chatbots are language models built to always produce an answer, so they can sound confident even when they are wrong about a photo. FarmGuard works differently. First, an image-detection model trained only on tomato leaf disease photos makes the diagnosis and gives it a confidence score. Then a second AI check looks at the same photo. If the model isn't confident enough, or the two checks disagree, we tell you we're not sure and ask for a clearer photo - we don't guess. The language AI is only used to explain the confirmed result in plain words."
        : "General chatbots are built to always produce an answer, so they can sound confident even when they are wrong about a photo. FarmGuard runs every photo through a vision model with a confidence check: if confidence is below our threshold, or the photo isn't a tomato leaf, we tell you we're not sure and ask for a clearer photo instead of guessing. The advice is written to FarmGuard's rules - simple steps, NAFDAC-registered products only, and a pointer to your extension officer for serious outbreaks.",
    },
    { q: 'How accurate is it?', a: "Our detection model scores 93.8% accuracy on its own test data. Real farm photos are harder than test photos, so expect it to do worse on blurry, dark or unusual photos - that's why we show a confidence score and say \"not sure\" rather than guess. Tapping \"Was this correct?\" after a result helps us measure real-world accuracy." },
    { q: 'What happens to my photo?', a: "Your photo is analysed and the result is recorded (disease, confidence, and your state if you choose it). We only keep the photo itself if you tick the consent box - it then helps us build Nigerian crop disease datasets. See our privacy page for details and how to ask for deletion." },
    { q: 'Is it free?', a: `Yes. The free plan gives you ${FREE_LIMITS.scans} scans and ${FREE_LIMITS.chats} chat messages a day. A Pro plan (${PRO_PRICE}/month) with more scans, chat and local languages is coming soon.` },
    { q: 'Does it replace a lab test or extension officer?', a: "No. It's a fast first step. For serious outbreaks, contact your agricultural extension officer or a plant pathologist." },
    { q: 'Can I use it offline?', a: 'Not yet - analysis needs an internet connection. An app that works better on weak connections is on our roadmap.' },
  ];
  return (
    <section id="faq" className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center"><H2>Frequently asked questions</H2></div>
        <div className="space-y-3 mt-8">
          {faqs.map((f, i) => (
            <div key={f.q} className="border border-tomDarkWhite rounded-lg">
              <button className="w-full flex justify-between items-center gap-4 p-5 text-left hover:bg-tomWhite" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span className="font-semibold text-tomDrkrGreen">{f.q}</span>
                {open === i ? <ChevronUp className="h-5 w-5 text-tomRed flex-none" /> : <ChevronDown className="h-5 w-5 text-tomRed flex-none" />}
              </button>
              {open === i && <p className="px-5 pb-5 text-tomDarkGreen">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Feedback ---------------- */
export function Feedback() {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await api.feedback({ type: 'feedback', rating, message });
      toast.success('Thank you for your feedback!');
      setRating(0);
      setMessage('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section id="feedback" className="py-16 px-4 bg-tomWhite">
      <div className="max-w-2xl mx-auto text-center">
        <H2>Feedback</H2>
        <p className="text-tomDarkGreen mb-8">Tried it? Tell us how it went - it shapes what we build next.</p>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} aria-label={`${s} star${s > 1 ? 's' : ''}`} className={`${s <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}>
                <Star className="h-8 w-8 fill-current" />
              </button>
            ))}
          </div>
          <textarea className="w-full p-4 rounded-lg border border-tomDarkWhite focus:ring-2 focus:ring-tomRed resize-none mb-5" rows={4} maxLength={1000}
            placeholder="What worked? What should we improve? (optional)" value={message} onChange={(e) => setMessage(e.target.value)} />
          <button onClick={submit} disabled={!rating || busy} className={`w-full py-3 rounded-lg font-semibold ${!rating || busy ? 'bg-tomDarkWhite text-tomDrkrGreen cursor-not-allowed' : 'bg-tomRed text-white hover:bg-tomDarkRed'}`}>
            {busy ? 'Sending...' : 'Submit feedback'}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
export function Footer({ engine }) {
  return (
    <footer className="bg-tomDrkrGreen text-white pt-12 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-3">
            <Brand />
            <p className="text-tomWhite text-sm">AI plant disease detection and advice for Nigerian crops.</p>
            <p className="text-tomWhite text-sm">Built in Jos, Nigeria.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Contact</h3>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-tomWhite hover:text-white">{CONTACT_EMAIL}</a>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Links</h3>
            <div className="flex flex-col gap-2 text-tomWhite items-center md:items-start">
              <button onClick={() => goTo('how-it-works')} className="hover:text-white">How to use</button>
              <button onClick={() => goTo('plans')} className="hover:text-white">Plans</button>
              <button onClick={() => goTo('faq')} className="hover:text-white">FAQ</button>
              <a href="/privacy" className="hover:text-white">Privacy</a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 pt-6 text-xs text-tomWhite/80 space-y-2 text-center">
          {engine === 'roboflow+ai' && (
            <p>
              Disease detection powered by the{' '}
              <a className="underline" href="https://universe.roboflow.com/search?q=tomato%20leaf%20diseases%20detection" target="_blank" rel="noreferrer">Tomato Leaf Diseases Detection model on Roboflow Universe</a>{' '}
              (CC BY 4.0), by abdullah.
            </p>
          )}
          <p>
            Sample photos from Wikimedia Commons:{' '}
            {SAMPLES.map((s, i) => (
              <span key={s.id}><a className="underline" href={s.link} target="_blank" rel="noreferrer">{s.label}</a> ({s.credit}){i < SAMPLES.length - 1 ? '; ' : '.'}</span>
            ))}
          </p>
          <p>© {new Date().getFullYear()} Fresh Tomatoes by FarmGuard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
