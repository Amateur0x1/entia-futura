import gsap from 'gsap';

interface AddResearchTrackPanelMotionOptions {
  track: HTMLElement;
  panels: HTMLElement[];
}

export const addResearchTrackPanelMotion = ({
  track,
  panels,
}: AddResearchTrackPanelMotionOptions) => {
  gsap.to(panels, {
    y: 0,
    ease: 'none',
    stagger: {
      each: 0.22,
    },
    scrollTrigger: {
      trigger: track,
      start: 'top top+=6%',
      end: '+=220%',
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
};
