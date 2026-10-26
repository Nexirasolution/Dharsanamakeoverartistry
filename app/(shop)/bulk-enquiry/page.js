'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

// Design tokens — keep in sync with the homepage, ProductPage, Navbar and Footer.
//   Primary    #C2185B  focus, checkbox, button hover
//   Secondary  #D4A017  thin divider (decorative only)
//   Background #FFFFFF  pure white page and form card
//   Text       #2D1028  headings, inputs, dark button
//   Accent     #F8D7E3  focus ring, soft washes
const PRIMARY = '#C2185B';
const GOLD = '#D4A017';
const INK = '#2D1028';
const ACCENT = '#F8D7E3';
const WHITE = '#FFFFFF';

const INK_SOFT = 'rgba(45, 16, 40, 0.68)';
const HAIRLINE = 'rgba(45, 16, 40, 0.18)';
const CARD_LINE = 'rgba(45, 16, 40, 0.12)';
const ERROR = '#B00020';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || '919842410186';

const SERVICES = [
  'Bridal Makeup',
  'Engagement / Reception Makeup',
  'Party Makeup',
  'Pre-wedding / Photoshoot Makeup',
  'Hairstyling & Saree Draping',
  'Makeup Trial',
  'Other',
];

const LOCATIONS = ['At the boutique (Erode)', 'At my venue'];

// Fully rounded inputs; the multi-line message box gets a softer 20px radius.
const inputBase =
  'w-full px-5 py-3 text-sm font-medium bg-white outline-none transition-all placeholder:font-medium focus:border-[#C2185B] focus:ring-4 focus:ring-[#F8D7E3]';
const inputClass = `${inputBase} rounded-full`;
const textareaClass = `${inputBase} rounded-[20px] resize-none`;

const inputStyle = { color: INK, border: `1px solid ${HAIRLINE}` };

// Defined OUTSIDE the page component so it isn't re-created on every render
// (re-creating it caused inputs to lose focus after each keystroke).
function Field({ error, label, children }) {
  return (
    <div>
      {label && (
        <label className="block text-[12px] font-bold tracking-wide px-5 mb-1.5" style={{ color: INK_SOFT }}>
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-[11px] font-bold mt-1.5 px-5" style={{ color: ERROR }}>
          {error}
        </p>
      )}
    </div>
  );
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

export default function MakeupEnquiryPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    date: '',
    time: '',
    people: '1',
    location: '',
    venue: '',
    message: '',
    agree: false,
  });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Please enter your name';
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, '').slice(-10)))
      e.phone = 'Enter a valid 10-digit phone number';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      e.email = 'Enter a valid email';
    if (!form.service) e.service = 'Select a makeup service';
    if (!form.date) e.date = 'Choose your event date';
    else if (form.date < todayISO()) e.date = 'Date cannot be in the past';
    if (!form.people || Number(form.people) < 1) e.people = 'Enter how many people';
    if (!form.location) e.location = 'Choose where you want the makeup done';
    if (form.location === 'At my venue' && !form.venue.trim())
      e.venue = 'Please enter the venue address';
    if (!form.agree) e.agree = 'Please accept the Terms & Conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;

    const lines = [
      '*Makeup Enquiry*',
      '',
      `*Name:* ${form.name.trim()}`,
      `*Phone:* ${form.phone.trim()}`,
    ];
    if (form.email.trim()) lines.push(`*Email:* ${form.email.trim()}`);
    lines.push(
      `*Service:* ${form.service}`,
      `*Event Date:* ${formatDate(form.date)}`
    );
    if (form.time) lines.push(`*Ready By:* ${form.time}`);
    lines.push(
      `*No. of People:* ${form.people}`,
      `*Location:* ${form.location}`
    );
    if (form.location === 'At my venue') lines.push(`*Venue Address:* ${form.venue.trim()}`);
    if (form.message.trim()) lines.push('', `*Message:* ${form.message.trim()}`);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="min-h-screen" style={{ background: WHITE }}>
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
        <h1
          className="text-2xl sm:text-3xl font-bold text-center tracking-[2px] uppercase mb-3"
          style={{ color: INK }}
        >
          Makeup Enquiry
        </h1>
        <div className="w-12 h-[2px] rounded-full mx-auto mb-6" style={{ background: GOLD }} />
        <p className="text-center text-sm font-medium mb-8" style={{ color: INK_SOFT }}>
          Tell us about your occasion and we&apos;ll get back to you on WhatsApp.
        </p>

        <form
          onSubmit={onSubmit}
          noValidate
          className="space-y-4 p-5 sm:p-8 rounded-[24px]"
          style={{
            background: WHITE,
            border: `1px solid ${CARD_LINE}`,
            boxShadow: '0 18px 40px rgba(45, 16, 40, 0.07)',
          }}
        >
          <Field error={errors.name}>
            <input
              className={inputClass}
              style={inputStyle}
              placeholder="Your Name*"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </Field>

          <Field error={errors.phone}>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={13}
              className={inputClass}
              style={inputStyle}
              placeholder="Phone Number*"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value.replace(/[^\d+\s]/g, ''))}
            />
          </Field>

          <Field error={errors.email}>
            <input
              type="email"
              className={inputClass}
              style={inputStyle}
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </Field>

          <Field error={errors.service}>
            <select
              className={inputClass}
              style={{ ...inputStyle, color: form.service ? INK : INK_SOFT }}
              value={form.service}
              onChange={(e) => update('service', e.target.value)}
            >
              <option value="">Makeup Service*</option>
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Event Date*" error={errors.date}>
              <input
                type="date"
                min={todayISO()}
                className={inputClass}
                style={inputStyle}
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
              />
            </Field>

            <Field label="Ready By (optional)">
              <input
                type="time"
                className={inputClass}
                style={inputStyle}
                value={form.time}
                onChange={(e) => update('time', e.target.value)}
              />
            </Field>
          </div>

          <Field error={errors.people}>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              className={inputClass}
              style={inputStyle}
              placeholder="Number of People*"
              value={form.people}
              onChange={(e) => update('people', e.target.value)}
            />
          </Field>

          <Field error={errors.location}>
            <select
              className={inputClass}
              style={{ ...inputStyle, color: form.location ? INK : INK_SOFT }}
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
            >
              <option value="">Where should we do the makeup?*</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          {form.location === 'At my venue' && (
            <Field error={errors.venue}>
              <input
                className={inputClass}
                style={inputStyle}
                placeholder="Venue Address*"
                value={form.venue}
                onChange={(e) => update('venue', e.target.value)}
              />
            </Field>
          )}

          <textarea
            rows={5}
            className={textareaClass}
            style={inputStyle}
            placeholder="Message (look you want, skin type, anything else)"
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
          />

          <Field error={errors.agree}>
            <label
              className="flex items-start gap-2.5 text-[13px] font-bold cursor-pointer px-1"
              style={{ color: INK }}
            >
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded shrink-0 accent-[#C2185B]"
                checked={form.agree}
                onChange={(e) => update('agree', e.target.checked)}
              />
              <span>I agree to the Terms &amp; Conditions and Privacy Policy.*</span>
            </label>
          </Field>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold tracking-[1.5px] uppercase transition-all active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(194,24,91,0.25)] bg-[#2D1028] text-white hover:bg-[#C2185B]"
          >
            <MessageCircle size={16} strokeWidth={2} />
            Send Enquiry
          </button>
        </form>
      </div>
    </main>
  );
}