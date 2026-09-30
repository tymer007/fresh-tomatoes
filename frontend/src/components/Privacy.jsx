import React from 'react';
import { CONTACT_EMAIL } from '../lib/api.js';

const Block = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-tomDrkrGreen mb-2">{title}</h2>
    <div className="text-tomDarkGreen space-y-2">{children}</div>
  </div>
);

// Plain-language privacy notice (Nigeria Data Protection Act 2023).
export default function Privacy() {
  return (
    <main className="pt-24 pb-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-tomDrkrGreen mb-2">Privacy</h1>
        <p className="text-tomDarkGreen mb-10">Plain language: what Fresh Tomatoes by FarmGuard keeps, why, and how to ask us to delete it.</p>

        <Block title="What we store">
          <p>For every scan we record the result: the disease name, confidence, health score, the crop (tomato), and your state if you choose it, plus any note you type.</p>
          <p><strong>Your photo is only kept if you tick the consent box.</strong> Without consent, the photo is analysed and then discarded.</p>
          <p>If you join the waitlist or send feedback, we keep the email or WhatsApp number and message you give us.</p>
        </Block>
        <Block title="Why">
          <p>To give you a diagnosis and advice, to measure how accurate we are (for example, your "Was this correct?" answers), and - with your consent - to build Nigerian crop disease datasets that improve detection for local farmers and researchers.</p>
        </Block>
        <Block title="What we don't do">
          <p>We don't ask for your name to scan a plant. Contact details (from the waitlist or feedback) are stored separately from scan photos and are never sold.</p>
          <p>Photos shared with researchers are shared without contact details.</p>
        </Block>
        <Block title="Who processes your data">
          <p>Photos are analysed by our image-detection model and AI services acting on our behalf. Data is stored in a private, access-controlled store.</p>
        </Block>
        <Block title="Your rights">
          <p>Under the Nigeria Data Protection Act 2023 you can ask to see, correct or delete your data, and withdraw consent at any time. Email <a className="text-tomRed underline" href={`mailto:${CONTACT_EMAIL}?subject=Data%20request`}>{CONTACT_EMAIL}</a> with the date of your scan (or the contact you used) and we'll respond within 30 days.</p>
        </Block>
        <a href="/" className="inline-block mt-4 bg-tomRed text-white px-6 py-3 rounded-lg font-semibold">Back to Fresh Tomatoes</a>
      </div>
    </main>
  );
}
