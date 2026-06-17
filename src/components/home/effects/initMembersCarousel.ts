// ---------------------------------------------------------------------------
// Members carousel — scrub-driven card flythrough with pin
//
// Adapted from GSAP "Infinite Scrolling Cards" demo's buildSeamlessLoop
// approach.  Cards fly across from right to left; at the midpoint each card
// reaches full scale / opacity (centre-stage).  Multiple cards are visible
// simultaneously — the centred card is largest while neighbours are smaller
// and fading in/out, just like the demo.
//
// The members-sticky container is pinned with ScrollTrigger for enough
// scroll distance to play the full card sequence.
// ---------------------------------------------------------------------------

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Build a seamless card-loop timeline.
 *
 * Each card flies across (xPercent 400 → -400) and peaks at scale 1 /
 * opacity 1 mid-flight.  Stagger creates overlap so 3-5 cards are visible
 * simultaneously.  The centre card (at peak) is largest; neighbours on each
 * side are progressively smaller and more transparent — matching the demo.
 */
function buildSeamlessLoop(
  items: HTMLElement[],
  spacing: number,
): gsap.core.Timeline {
  // Overlap determines how much of each card's fly-across overlaps with
  // neighbours.  A spacing of 0.1 with duration 1 means each card starts
  // 0.1 units after the previous, so ~10 cards overlap at once.
  const overlap = Math.ceil(1 / spacing); // how many cards are visible at once

  const rawSequence = gsap.timeline({ paused: true });

  items.forEach((el, i) => {
    const startPos = i * spacing;

    // Scale/opacity: ramp up 0→1 in first half, ramp down 1→0 in second half
    rawSequence
      .fromTo(
        el,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          zIndex: 100,
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          ease: 'power1.in',
          immediateRender: false,
        },
        startPos,
      )
      .fromTo(
        el,
        { xPercent: 400 },
        {
          xPercent: -400,
          duration: 1,
          ease: 'none',
          immediateRender: false,
        },
        startPos,
      );
  });

  return rawSequence;
}

// ── public entry ───────────────────────────────────────────────────────────

export function initMembersCarousel(membersPanel: HTMLElement) {
  const cards = gsap.utils.toArray<HTMLElement>('.members-card', membersPanel);
  if (!cards.length) return;

  const stickyContainer = membersPanel.querySelector<HTMLElement>('.members-sticky');
  if (!stickyContainer) return;

  // Label
  const label = membersPanel.querySelector<HTMLElement>('.members-panel__label');

  // Initial state — cards invisible, off to the right
  gsap.set(cards, { xPercent: 400, opacity: 0, scale: 0 });
  if (label) gsap.set(label, { autoAlpha: 0, y: 20 });

  const spacing = 0.1; // closer spacing → more cards visible at once
  const seamlessLoop = buildSeamlessLoop(cards, spacing);
  const totalDuration = seamlessLoop.duration();

  // Scroll distance proportional to number of unique cards
  // 3 unique cards × 3 duplicates = 9, each takes `spacing` worth of scroll
  const scrollDistance = Math.round(cards.length * 350);

  // Create a master scrub timeline
  const scrubTl = gsap.timeline({
    scrollTrigger: {
      trigger: stickyContainer,
      start: 'top top',
      end: `+=${scrollDistance}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.4,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  // Reveal the label first
  if (label) {
    scrubTl.to(label, { autoAlpha: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0);
  }

  // Drive the seamless loop with scroll
  scrubTl.to(
    seamlessLoop,
    {
      time: totalDuration,
      duration: 1,
      ease: 'none',
    },
    0,
  );
}
