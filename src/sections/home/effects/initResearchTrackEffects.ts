import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const initResearchTrackEffects = (prefersReducedMotion: boolean) => {
  const track = document.querySelector<HTMLElement>('[data-research-track]');
  const rail = track?.querySelector<HTMLElement>('[data-research-rail]');
  const panels = rail ? Array.from(rail.querySelectorAll<HTMLElement>('[data-research-panel]')) : [];
  const nextPreview = document.querySelector<HTMLElement>('[data-next-preview]');

  if (!track || !rail || panels.length === 0) {
    return;
  }

  if (prefersReducedMotion) {
    gsap.set([track, ...panels], { clearProps: 'all' });
    return;
  }

  gsap.set(track, {
    y: 54,
  });
  gsap.set(panels, { y: 36 });

  const handoffTimeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: track,
      start: 'top 98%',
      end: 'top 56%',
      scrub: true,
      onLeaveBack: () => {
        if (!nextPreview) return;
        gsap.set(nextPreview, {
          y: 0,
          visibility: 'visible',
        });
      },
    },
  });

  if (nextPreview) {
    handoffTimeline.to(
      nextPreview,
      {
        y: -28,
        duration: 0.72,
      },
      0,
    );
  }

  handoffTimeline.to(
    track,
    {
      y: 0,
      duration: 0.78,
    },
    0.18,
  );

  panels.forEach((panel, index) => {
    gsap.to(panel, {
      y: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: panel,
        start: 'top 90%',
        end: 'top 62%',
        scrub: true,
      },
      delay: index * 0.02,
    });
  });

  ScrollTrigger.create({
    trigger: track,
    start: 'top 98%',
    end: 'top 56%',
    scrub: true,
    onUpdate: ({ progress }) => {
      if (!nextPreview) return;
      gsap.set(nextPreview, { visibility: progress > 0.98 ? 'hidden' : 'visible' });
    },
  });
};
