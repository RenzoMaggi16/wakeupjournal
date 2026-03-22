import { useState, useRef, useCallback } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

export const InfoTooltip = ({ text }: InfoTooltipProps) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 150);
  }, []);

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <span className="info-tooltip-wrapper" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Info className="info-tooltip-icon" />
      <span
        className={`info-tooltip-bubble ${visible ? 'info-tooltip-visible' : ''}`}
        role="tooltip"
      >
        {text}
      </span>
    </span>
  );
};
