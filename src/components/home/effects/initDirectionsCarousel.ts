// ---------------------------------------------------------------------------
// Directions carousel — scrub-driven card flythrough with category switching
//
// Modelled after the Members carousel (initMembersCarousel.ts) but extended
// with three category groups.  As the user scrolls, cards fly across from
// right to left; the currently centred card's group determines which category
// label is shown at the top.  Progress dots also update per-group.
//
// The directions-sticky container is pinned with ScrollTrigger for enough
// scroll distance to play all 17 cards.
// ---------------------------------------------------------------------------

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ── helpers ────────────────────────────────────────────────────────────────

/** Build a linear card-flythrough timeline. */
function buildCardSequence(
  items: HTMLElement[],
  spacing: number,
): gsap.core.Timeline {
  const seq = gsap.timeline({ paused: true });

  items.forEach((el, i) => {
    const start = i * spacing;

    // Scale + opacity: ramp up 0→1 then back 1→0 (yoyo)
    seq.fromTo(
      el,
      { scale: 0.45, opacity: 0 },
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
      start,
    );

    // Horizontal sweep: right → left
    seq.fromTo(
      el,
      { xPercent: 350 },
      {
        xPercent: -350,
        duration: 1,
        ease: 'none',
        immediateRender: false,
      },
      start,
    );
  });

  return seq;
}

/**
 * Work out which group index is "active" at a given progress through the
 * card sequence.  Each card reaches centre-stage (peak scale/opacity) at
 * the midpoint of its individual 1-unit animation, i.e. at
 *   peakTime = cardIndex * spacing + 0.5
 *
 * We find the card whose peak is closest to `currentTime` and return its
 * group attribute.
 */
function getActiveGroup(
  cards: HTMLElement[],
  spacing: number,
  currentTime: number,
): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  cards.forEach((card, i) => {
    const peak = i * spacing + 0.5;
    const d = Math.abs(currentTime - peak);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  });
  const groupAttr = cards[bestIdx]?.getAttribute('data-card-group');
  return groupAttr ? parseInt(groupAttr, 10) : 0;
}

// ── public entry ───────────────────────────────────────────────────────────

export function initDirectionsCarousel(panel: HTMLElement) {
  const cards = gsap.utils.toArray<HTMLElement>(
    '[data-directions-card]',
    panel,
  );
  if (!cards.length) return;

  const sticky = panel.querySelector<HTMLElement>('[data-directions-sticky]');
  if (!sticky) return;

  // Category labels & dots
  const categoryEls = gsap.utils.toArray<HTMLElement>(
    '[data-directions-category]',
    panel,
  );
  const dotEls = gsap.utils.toArray<HTMLElement>(
    '[data-directions-dot]',
    panel,
  );

  // ── Initial state ──
  gsap.set(cards, { xPercent: 350, opacity: 0, scale: 0.45 });

  // Hide all categories except first
  categoryEls.forEach((el, i) => {
    if (i === 0) {
      gsap.set(el, { autoAlpha: 1, y: 0 });
    } else {
      gsap.set(el, { autoAlpha: 0, y: 12 });
    }
  });

  const spacing = 0.08;
  const sequence = buildCardSequence(cards, spacing);
  const totalDuration = sequence.duration();
  const scrollDistance = Math.round(cards.length * 420);

  // Track current active group for category switching
  let currentGroup = 0;

  // ── ScrollTrigger ──
  const scrubTl = gsap.timeline({
    scrollTrigger: {
      trigger: sticky,
      start: 'top top',
      end: `+=${scrollDistance}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Determine which group is currently centred
        const currentTime = self.progress * totalDuration;
        const newGroup = getActiveGroup(cards, spacing, currentTime);

        if (newGroup !== currentGroup) {
          // Animate category switch
          const outEl = categoryEls[currentGroup];
          const inEl = categoryEls[newGroup];

          if (outEl) {
            gsap.to(outEl, {
              autoAlpha: 0,
              y: -12,
              duration: 0.3,
              ease: 'power2.in',
              overwrite: true,
            });
          }
          if (inEl) {
            gsap.fromTo(
              inEl,
              { autoAlpha: 0, y: 12 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.35,
                ease: 'power2.out',
                overwrite: true,
              },
            );
          }

          // Update dots
          dotEls.forEach((dot, i) => {
            if (i === newGroup) {
              dot.classList.add('directions-progress__dot--active');
            } else {
              dot.classList.remove('directions-progress__dot--active');
            }
          });

          currentGroup = newGroup;
        }
      },
    },
  });

  // Drive the card sequence
  scrubTl.to(
    sequence,
    {
      time: totalDuration,
      duration: 1,
      ease: 'none',
    },
    0,
  );
}
