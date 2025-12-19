import React from 'react';
import * as RadixSlider from '@radix-ui/react-slider';
import '../../styles.css';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Slider Component using Radix UI
 * 
 * A styled slider with track, range (filled portion), and thumb.
 * Uses CSS custom properties for theming.
 * 
 * CSS Classes (see styles.css for customization):
 * - .radix-slider-root: Main container
 * - .radix-slider-track: Background track
 * - .radix-slider-range: Filled/active portion
 * - .radix-slider-thumb: Draggable knob
 */
export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = '',
}) => {
  return (
    <RadixSlider.Root
      className={`radix-slider-root ${className}`}
      value={[value]}
      onValueChange={(values) => onChange(values[0])}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
    >
      <RadixSlider.Track className="radix-slider-track">
        <RadixSlider.Range className="radix-slider-range" />
      </RadixSlider.Track>
      <RadixSlider.Thumb className="radix-slider-thumb" />
    </RadixSlider.Root>
  );
};

export default Slider;