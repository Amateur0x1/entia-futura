import gsap from 'gsap';

interface AddHeroMediaDriftSegmentOptions {
  heroTimeline: gsap.core.Timeline;
  primaryVisual: HTMLElement;
  notes: HTMLElement[];
}

export const addHeroMediaDriftSegment = ({
  heroTimeline,
  primaryVisual,
  notes,
}: AddHeroMediaDriftSegmentOptions) => {
  heroTimeline
    .to(
      primaryVisual,
      {
        yPercent: 0,
        scale: 1.03,
        duration: 1.2,
      },
      0,
    )
    .to(
      notes,
      {
        y: -42,
        autoAlpha: (index: number) => (index === notes.length - 1 ? 1 : 0.52),
        duration: 0.7,
        stagger: 0.03,
      },
      0.08,
    );
};
