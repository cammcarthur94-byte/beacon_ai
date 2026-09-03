'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Gauge } from 'lucide-react';

interface SentimentRangeSliderProps {
  value: [number, number]; // e.g. [-100, 100]
  onChange: (value: [number, number]) => void;
  className?: string;
}

export function SentimentRangeSlider({ value, onChange, className }: SentimentRangeSliderProps) {
  const [minVal, maxVal] = value;
  const min = -100;
  const max = 100;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextMin = Math.min(Number(e.target.value), maxVal - 5);
    onChange([nextMin, maxVal]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextMax = Math.max(Number(e.target.value), minVal + 5);
    onChange([minVal, nextMax]);
  };

  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  const formatSentiment = (val: number) => {
    if (val > 0) return `+${val}`;
    return `${val}`;
  };

  const isFiltered = minVal !== min || maxVal !== max;

  return (
    <div className={cn('flex flex-col gap-1.5 min-w-[200px] sm:min-w-[240px]', className)}>
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="flex items-center gap-1 text-zinc-500 font-medium">
          <Gauge className="h-3.5 w-3.5 text-zinc-400" />
          Sentiment:
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono border transition-colors',
              isFiltered
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
            )}
          >
            {formatSentiment(minVal)} to {formatSentiment(maxVal)}
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={() => onChange([-100, 100])}
              className="text-[10px] text-zinc-400 hover:text-zinc-900 underline cursor-pointer"
              title="Reset Sentiment Range"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Slider Track and Thumbs */}
      <div className="relative w-full h-5 flex items-center">
        {/* Background Track */}
        <div className="absolute w-full h-1.5 bg-zinc-200 rounded-full" />

        {/* Selected Range Fill with subtle gradient */}
        <div
          className="absolute h-1.5 rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500 opacity-90"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Range Input for Min */}
        <input
          type="range"
          min={min}
          max={max}
          step={5}
          value={minVal}
          onChange={handleMinChange}
          aria-label="Minimum brand sentiment"
          className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-900 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
        />

        {/* Range Input for Max */}
        <input
          type="range"
          min={min}
          max={max}
          step={5}
          value={maxVal}
          onChange={handleMaxChange}
          aria-label="Maximum brand sentiment"
          className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-900 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400 px-0.5">
        <span className="text-red-500">-100 Critical</span>
        <span className="text-zinc-400">0 Neutral</span>
        <span className="text-emerald-600">+100 Positive</span>
      </div>
    </div>
  );
}
