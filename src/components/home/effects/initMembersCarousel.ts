// ---------------------------------------------------------------------------
// Members carousel — scroll-driven stacked card deck with synced info panel
// + Flair cursor follower (shared pool of shaped decorative images)
//
// Cards are stacked like a deck.  As the user scrolls through the pinned
// section, the front card slides away and the next card takes its place.
// The right-side info panel updates in sync.  A shared pool of shaped flair
// images trails the mouse cursor throughout the section.
//
// Unlike the previous Flip-based approach, this version directly animates
// card transforms / opacity based on scroll progress, making it fully
// reversible (scroll back works correctly) and immune to DOM-mutation bugs.
// ---------------------------------------------------------------------------

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Flair cursor follower ──────────────────────────────────────────────────

interface FlairState {
  images: HTMLElement[];
  index: number;
  mousePos: { x: number; y: number };
  lastMousePos: { x: number; y: number };
  gap: number;
  tickerCallback: (() => void) | null;
  isActive: boolean;
}

function createFlairState(membersPanel: HTMLElement): FlairState | null {
  const flairContainer = membersPanel.querySelector<HTMLElement>('[data-members-flair]');
  if (!flairContainer) return null;

  const images = gsap.utils.toArray<HTMLElement>('[data-flair-img]', flairContainer);
  if (!images.length) return null;

  return {
    images,
    index: 0,
    mousePos: { x: 0, y: 0 },
    lastMousePos: { x: 0, y: 0 },
    gap: 80,
    tickerCallback: null,
    isActive: false,
  };
}

function playFlairAnimation(img: HTMLElement) {
  const tl = gsap.timeline();

  // Phase 1: Elastic pop-in (0 → 0.8s)
  tl.from(img, {
    opacity: 0,
    scale: 0,
    duration: 0.8,
    ease: 'elastic.out(1, 0.3)',
  })
    .to(img, {
      rotation: `random([-360, 360])`,
      duration: 0.8,
    }, '<');

  // Phase 2: Hold — let the image linger in place so it's actually visible.
  // This is just a tiny spacer; the gravity fall starts after it.
  tl.to(img, { duration: 0.45 });

  // Phase 3: Fade-fall with gentle gravity
  tl.to(img, {
    y: '120vh',
    opacity: 0,
    ease: 'back.in(0.4)',
    duration: 1.1,
  });
}

function startFlairTracker(flair: FlairState, stickyContainer: HTMLElement) {
  if (flair.isActive) return;

  const onMouseMove = (e: MouseEvent) => {
    flair.mousePos = { x: e.clientX, y: e.clientY };
  };

  stickyContainer.addEventListener('mousemove', onMouseMove);

  const tickerCallback = () => {
    const dx = flair.lastMousePos.x - flair.mousePos.x;
    const dy = flair.lastMousePos.y - flair.mousePos.y;
    const travelDistance = Math.hypot(dx, dy);

    if (travelDistance > flair.gap) {
      const wrappedIndex = flair.index % flair.images.length;
      const img = flair.images[wrappedIndex];

      gsap.killTweensOf(img);
      gsap.set(img, { clearProps: 'all' });
      gsap.set(img, {
        opacity: 1,
        left: flair.mousePos.x,
        top: flair.mousePos.y,
        xPercent: -50,
        yPercent: -50,
      });

      playFlairAnimation(img);
      flair.index++;
      flair.lastMousePos = { ...flair.mousePos };
    }
  };

  gsap.ticker.add(tickerCallback);
  flair.tickerCallback = tickerCallback;
  flair.isActive = true;

  // Store cleanup reference
  (stickyContainer as any).__flairCleanup = () => {
    stickyContainer.removeEventListener('mousemove', onMouseMove);
    if (flair.tickerCallback) {
      gsap.ticker.remove(flair.tickerCallback);
      flair.tickerCallback = null;
    }
    flair.isActive = false;
  };
}

// ── Card deck helpers ──────────────────────────────────────────────────────

/** CSS stacking offsets (matches the CSS nth-child rules). */
const STACK_OFFSETS = [
  { top: 0, left: 0 },
  { top: -20, left: 20 },
  { top: -40, left: 40 },
  { top: -60, left: 60 },
  { top: -80, left: 80 },
];

/**
 * For a given "active member index", compute each card's visual state.
 *
 * Cards are rendered in DOM order 0→N-1.  At any point, one member is "front"
 * (fully visible, highest z-index), cards "behind" it are stacked underneath
 * with decreasing offsets, and cards that have already been shown are off-screen.
 */
function getCardStates(totalMembers: number, activeMember: number) {
  const states: Array<{
    memberIndex: number;
    zIndex: number;
    opacity: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
  }> = [];

  for (let i = 0; i < totalMembers; i++) {
    const distFromFront = i - activeMember;

    if (distFromFront < 0) {
      // Already flipped away — off to the left
      states.push({
        memberIndex: i,
        zIndex: 0,
        opacity: 0,
        x: -120,
        y: -40,
        rotation: -12,
        scale: 0.9,
      });
    } else {
      // In the stack
      const offset = STACK_OFFSETS[distFromFront] || STACK_OFFSETS[STACK_OFFSETS.length - 1];
      states.push({
        memberIndex: i,
        zIndex: totalMembers - distFromFront,
        opacity: distFromFront <= 2 ? 1 : 0,
        x: offset.left,
        y: offset.top,
        rotation: 0,
        scale: 1,
      });
    }
  }

  return states;
}

// ── public entry ───────────────────────────────────────────────────────────

export function initMembersCarousel(membersPanel: HTMLElement) {
  const deck = membersPanel.querySelector<HTMLElement>('[data-members-deck]');
  if (!deck) return;

  const stickyContainer = membersPanel.querySelector<HTMLElement>('.members-sticky');
  if (!stickyContainer) return;

  const cards = gsap.utils.toArray<HTMLElement>('[data-members-flip-card]', deck);
  if (!cards.length) return;

  const infoItems = gsap.utils.toArray<HTMLElement>('[data-members-info-item]', membersPanel);
  const totalMembers = cards.length;

  // Sort cards by their data-member-index to ensure consistent mapping
  const cardsByMember: HTMLElement[] = [];
  cards.forEach(card => {
    const idx = parseInt(card.getAttribute('data-member-index') || '0', 10);
    cardsByMember[idx] = card;
  });

  let currentMemberIndex = 0;

  // Scroll distance per member transition
  const scrollPerFlip = 800;
  const scrollDistance = totalMembers * scrollPerFlip;

  // ── Flair setup (shared pool, no per-member grouping) ──
  const flairState = createFlairState(membersPanel);
  if (flairState) {
    startFlairTracker(flairState, stickyContainer);
  }

  // ── Apply visual state to all cards ──
  function applyDeckState(activeMember: number, progress?: number) {
    const states = getCardStates(totalMembers, activeMember);

    // Sub-progress within the current card transition (0→1)
    let subProgress = 0;
    if (progress !== undefined) {
      const rawIndex = progress * totalMembers;
      subProgress = rawIndex - Math.floor(rawIndex);
    }

    states.forEach((state) => {
      const card = cardsByMember[state.memberIndex];
      if (!card) return;

      const distFromFront = state.memberIndex - activeMember;

      if (distFromFront === -1 && subProgress > 0) {
        // Being flipped away — interpolate
        const prevOffset = STACK_OFFSETS[0] || { top: 0, left: 0 };
        gsap.set(card, {
          zIndex: totalMembers + 1,
          opacity: 1 - subProgress,
          x: gsap.utils.interpolate(prevOffset.left, -120, subProgress),
          y: gsap.utils.interpolate(prevOffset.top, -40, subProgress),
          rotation: gsap.utils.interpolate(0, -12, subProgress),
          scale: gsap.utils.interpolate(1, 0.9, subProgress),
        });
      } else if (distFromFront === 0 && subProgress > 0) {
        // Becoming the front — interpolate from position 1 to position 0
        const fromOffset = STACK_OFFSETS[1] || STACK_OFFSETS[0];
        const toOffset = STACK_OFFSETS[0];
        gsap.set(card, {
          zIndex: totalMembers,
          opacity: 1,
          x: gsap.utils.interpolate(fromOffset.left, toOffset.left, subProgress),
          y: gsap.utils.interpolate(fromOffset.top, toOffset.top, subProgress),
          rotation: 0,
          scale: 1,
        });
      } else {
        // Static position
        gsap.set(card, {
          zIndex: state.zIndex,
          opacity: state.opacity,
          x: state.x,
          y: state.y,
          rotation: state.rotation,
          scale: state.scale,
        });
      }
    });
  }

  // ── Update info panel ──
  function showMemberInfo(index: number) {
    const safeIndex = ((index % totalMembers) + totalMembers) % totalMembers;

    infoItems.forEach((item, i) => {
      if (i === safeIndex) {
        gsap.to(item, {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true,
        });
      } else {
        gsap.to(item, {
          autoAlpha: 0,
          y: 16,
          duration: 0.25,
          ease: 'power2.in',
          overwrite: true,
        });
      }
    });
  }

  // ── Clear CSS positioning — we take full control via GSAP ──
  cards.forEach(card => {
    card.style.top = '0';
    card.style.left = '0';
  });

  // ── Initial state ──
  applyDeckState(0);
  showMemberInfo(0);

  // ── Pinned ScrollTrigger ──
  ScrollTrigger.create({
    trigger: stickyContainer,
    start: 'top top',
    end: `+=${scrollDistance}`,
    pin: true,
    pinSpacing: true,
    scrub: 0.3,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const progress = self.progress;

      // Which member should be front?
      const targetIndex = Math.min(
        Math.floor(progress * totalMembers),
        totalMembers - 1,
      );

      // Apply deck visual state with sub-progress for smooth interpolation
      applyDeckState(targetIndex, progress);

      // Update info panel only when member actually changes
      if (targetIndex !== currentMemberIndex) {
        currentMemberIndex = targetIndex;
        showMemberInfo(currentMemberIndex);
      }
    },
  });
}
