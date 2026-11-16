import { useLayoutEffect, useRef } from 'react';
import { animate, createScope, createTimeline, stagger, svg, utils, type Target } from 'animejs';
import { LOGO_CENTER, LOGO_CORE_R, LOGO_DOTS, LOGO_WORDMARK } from './logoPaths';

export function AnimatedLogo({ wordmark = true, className = '' }: { wordmark?: boolean; className?: string }) {
  const root = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const scope = createScope({ root, mediaQueries: { reduce: '(prefers-reduced-motion: reduce)' } }).add((self) => {
      if (self?.matches.reduce || !root.current?.getClientRects().length) return;

      const core = utils.$('.alogo-core');
      const dots = utils.$('.alogo-dot');
      const fromCenter = (axis: 'x' | 'y') => (el?: Target) =>
        LOGO_CENTER[axis] - Number((el as SVGCircleElement).getAttribute(axis === 'x' ? 'cx' : 'cy'));
      const ringDelay = (el?: Target) => {
        const { classList } = el as SVGCircleElement;
        return classList.contains('ring-2') ? 260 : classList.contains('ring-1') ? 130 : 0;
      };

      utils.set(core, { scale: 0 });
      utils.set(dots, { x: fromCenter('x'), y: fromCenter('y'), scale: 0 });

      const tl = createTimeline({ defaults: { ease: 'outExpo' } })
        .add(core, { scale: 1, duration: 900, ease: 'outElastic(1, .55)' })
        .add('.alogo-dot.ring-1', { x: 0, y: 0, scale: 1, duration: 900, delay: stagger(55) }, 150)
        .add('.alogo-dot.ring-2', { x: 0, y: 0, scale: 1, duration: 1000, delay: stagger(55) }, 420);

      if (wordmark) {
        const [word] = svg.createDrawable('.alogo-word', 0, 0);
        utils.set(word, { fillOpacity: 0, strokeOpacity: 1 });
        tl.add(word, { draw: '0 1', duration: 1600, ease: 'inOutSine' }, 700)
          .add(word, { fillOpacity: 1, duration: 700, ease: 'outQuad' }, 1900)
          .add(word, { strokeOpacity: 0, duration: 500, ease: 'outQuad' }, 2200);
      }

      tl.then(() => {
        self?.register(
          animate([...core, ...dots], {
            scale: [
              { to: 1.12, duration: 380, ease: 'outQuad' },
              { to: 1, duration: 700, ease: 'inOutQuad' },
            ],
            delay: ringDelay,
            loop: true,
            loopDelay: 2400,
          }),
        );
      });
    });
    return () => scope.revert();
  }, [wordmark]);

  return (
    <svg
      ref={root}
      className={`alogo ${className}`}
      viewBox={wordmark ? '0 0 1786 430' : '0 0 439 430'}
      role="img"
      aria-label="Enzitech"
    >
      <circle className="alogo-core" cx={LOGO_CENTER.x} cy={LOGO_CENTER.y} r={LOGO_CORE_R} />
      {LOGO_DOTS.map(([cx, cy, r, ring], i) => (
        <circle key={i} className={`alogo-dot ring-${ring}`} cx={cx} cy={cy} r={r} />
      ))}
      {wordmark && <path className="alogo-word" fillRule="evenodd" clipRule="evenodd" d={LOGO_WORDMARK} />}
    </svg>
  );
}
