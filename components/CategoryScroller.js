'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { resizeImage } from '@/lib/image';

const ACCENT = '#F8D7E3';
const FONT_SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FADE = 'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)';

const SPEED = 40;          // auto-scroll speed, px per second
const TOUCH_RESUME = 2500; // ms before auto-scroll resumes after a touch / wheel / arrow click
const MIN_ITEMS = 20;      // one group must be wider than 2x the screen for a seamless loop

export default function CategoryScroller({ categories }) {
  const scrollerRef = useRef(null);

  // Repeat the list until one group is long enough, and keep its length EVEN
  // so the up/down stagger continues unbroken across the loop seam.
  const catLoop = useMemo(() => {
    if (!categories.length) return [];
    let reps = Math.ceil(MIN_ITEMS / categories.length);
    if ((reps * categories.length) % 2 === 1) reps += 1;
    return Array.from({ length: reps }).flatMap(() => categories);
  }, [categories]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !catLoop.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf;
    let last = 0;
    let pos = 0;
    let hovering = false;
    let dragging = false;
    let visible = true;
    let pausedUntil = 0; // timestamp (ms); Infinity = held until released

    const groupWidth = () => el.scrollWidth / 2;

    // Keep scrollLeft inside the middle band; shifting by exactly one group is invisible.
    const wrap = () => {
      const gw = groupWidth();
      if (!gw) return;
      if (el.scrollLeft >= gw * 1.5) { el.scrollLeft -= gw; pos -= gw; }
      else if (el.scrollLeft < gw * 0.5) { el.scrollLeft += gw; pos += gw; }
    };

    // Start at the beginning of the 2nd group (looks identical to the 1st),
    // so the user can swipe left immediately.
    el.scrollLeft = groupWidth();
    pos = el.scrollLeft;

    const pauseFor = (ms) => { pausedUntil = performance.now() + ms; };

    const tick = (t) => {
      const dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
      last = t;
      const paused = hovering || dragging || !visible || t < pausedUntil;

      if (paused || reduceMotion) {
        pos = el.scrollLeft; // follow whatever the user did
      } else {
        pos += SPEED * dt;
        el.scrollLeft = pos; // pos stays a float, so slow speeds don't stall on rounding
      }
      wrap();
      raf = requestAnimationFrame(tick);
    };

    // ── pause triggers ──
    const onEnter = (e) => { if (e.pointerType === 'mouse') hovering = true; };
    const onLeave = (e) => { if (e.pointerType === 'mouse') hovering = false; };
    const onTouchStart = () => { pausedUntil = Infinity; };
    const onTouchEnd = () => pauseFor(TOUCH_RESUME);
    const onWheel = () => pauseFor(TOUCH_RESUME);
    const onFocusIn = () => { pausedUntil = Infinity; };
    const onFocusOut = () => pauseFor(TOUCH_RESUME);
    const onScroll = () => wrap(); // also wraps during manual / momentum scrolling

    // ── mouse drag-to-scroll ──
    let startX = 0;
    let startLeft = 0;
    let moved = 0;
    const onPointerDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true;
      moved = 0;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.classList.add('is-dragging');
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    };
    const onPointerMove = (e) => {
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      el.scrollLeft = startLeft - dx;
    };
    const onPointerUp = () => {
      dragging = false;
      el.classList.remove('is-dragging');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      // let the click handler below see `moved` first
      setTimeout(() => { moved = 0; }, 0);
    };
    // Dragging shouldn't open the category you started the drag on.
    const onClickCapture = (e) => {
      if (moved > 5) { e.preventDefault(); e.stopPropagation(); }
    };

    // Don't auto-scroll while the band is off screen.
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(el);

    // Arrow buttons dispatch this.
    const onNudge = (e) => {
      pauseFor(TOUCH_RESUME);
      el.scrollBy({ left: e.detail, behavior: 'smooth' });
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('focusin', onFocusIn);
    el.addEventListener('focusout', onFocusOut);
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('click', onClickCapture, true);
    el.addEventListener('cw-nudge', onNudge);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('focusin', onFocusIn);
      el.removeEventListener('focusout', onFocusOut);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('click', onClickCapture, true);
      el.removeEventListener('cw-nudge', onNudge);
    };
  }, [catLoop]);

  const nudge = (dir) => {
    const el = scrollerRef.current;
    if (el) el.dispatchEvent(new CustomEvent('cw-nudge', { detail: dir * 320 }));
  };

  if (!catLoop.length) return null;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="cw-marquee mt-8 pt-3 pb-24"
        style={{ WebkitMaskImage: FADE, maskImage: FADE }}
      >
        <div className="cw-track">
          {[0, 1].map((g) => (
            <div key={g} className="cw-group" aria-hidden={g === 1 ? true : undefined}>
              {catLoop.map((c, i) => (
                <Link
                  key={`${g}-${i}`}
                  href={`/category/${c.slug}`}
                  draggable={false}
                  className="cw-item w-[132px] sm:w-[160px] md:w-[184px]"
                  style={{ marginTop: i % 2 ? 'var(--stagger)' : 0 }}
                  tabIndex={g === 1 ? -1 : undefined}
                >
                  <div className="cw-bob" style={{ '--i': i }}>
                    <div className="cw-pill">
                      <div className="cw-photo">
                        {c.image ? (
                          <img
                            src={resizeImage(c.image, 360, 450)}
                            alt={g === 1 ? '' : c.name}
                            width={180}
                            height={225}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                          />
                        ) : (
                          <div className="cw-ph" style={{ background: ACCENT }} />
                        )}
                      </div>

                      <span className="cw-name line-clamp-2" style={{ fontFamily: FONT_SANS }}>
                        {c.name}
                      </span>
                      <ArrowRight size={18} strokeWidth={1.6} className="cw-arrow" />

                      <span className="cw-water" aria-hidden="true" />
                      <span className="cw-water cw-water-b" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Manual arrows (desktop) */}
      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => nudge(-1)}
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
        style={{ border: '1px solid rgba(212,160,23,.45)', color: '#2D1028' }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => nudge(1)}
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
        style={{ border: '1px solid rgba(212,160,23,.45)', color: '#2D1028' }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}