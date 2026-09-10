import { useRef, useState, useEffect } from 'react';

export default function ScrollingTitle({ title, className = 'creation-title' }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [overflows, setOverflows] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [duration, setDuration] = useState(6);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        const diff = textWidth - containerWidth;
        if (diff > 2) {
          setOverflows(true);
          setScrollDistance(diff);
          // Velocidad constante suave (~30px/s) con 4 segundos de pausa total
          const calcDuration = Math.max(5, diff / 30 + 4);
          setDuration(calcDuration);
        } else {
          setOverflows(false);
          setScrollDistance(0);
        }
      }
    };

    checkOverflow();

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => checkOverflow());
      resizeObserver.observe(containerRef.current);
    } else {
      window.addEventListener('resize', checkOverflow);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', checkOverflow);
    };
  }, [title]);

  return (
    <div
      ref={containerRef}
      className={`scrolling-title-container ${overflows ? 'is-overflowing' : ''}`}
      title={title}
    >
      <h3
        ref={textRef}
        className={`${className} ${overflows ? 'scrolling-title-anim' : ''}`}
        style={
          overflows
            ? {
                '--scroll-dist': `-${scrollDistance + 8}px`,
                '--scroll-dur': `${duration}s`,
              }
            : undefined
        }
      >
        {title}
      </h3>
    </div>
  );
}
