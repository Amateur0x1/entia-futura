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
    autoAlpha: 0,
    y: 54,
    scale: 1.06,
    filter: 'blur(8px)',
  });
  gsap.set(panels, { autoAlpha: 0, y: 36 });

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
          autoAlpha: 1,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          visibility: 'visible',
        });
      },
    },
  });

  if (nextPreview) {
    handoffTimeline.to(
      nextPreview,
      {
        autoAlpha: 0,
        scale: 0.9,
        y: -28,
        filter: 'blur(6px)',
        duration: 0.72,
      },
      0,
    );
  }

  handoffTimeline.to(
    track,
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.78,
    },
    0.18,
  );

  panels.forEach((panel, index) => {
    gsap.to(panel, {
      autoAlpha: 1,
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
