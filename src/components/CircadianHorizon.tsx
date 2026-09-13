import { motion } from 'framer-motion';
import type { CircadianData, QuartileData } from '../lib/telemetry';

interface CircadianHorizonProps {
  hourly: CircadianData[];
  quartiles: QuartileData[];
  peakWindow: string;
}

export function CircadianHorizon({ hourly, quartiles, peakWindow }: CircadianHorizonProps) {
  // Find max for scaling the bars
  const maxFocus = Math.max(...hourly.map((h) => h.focusMinutes), 1); // Avoid division by zero

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Circadian Horizon</h3>
          <p className="text-sm text-zinc-400">Your 24-hour cognitive distribution</p>
        </div>
        <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-md">
          <p className="text-xs text-zinc-500 mb-1">Peak Cognitive Window</p>
          <p className="text-sm font-mono text-white">{peakWindow}</p>
        </div>
      </div>

      {/* 24-Hour Bar Chart */}
      <div className="flex items-end gap-1 h-32 relative mt-4">
        {hourly.map((data, index) => {
          const heightPercent = (data.focusMinutes / maxFocus) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col justify-end group h-full relative">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ duration: 0.5, delay: index * 0.02 }}
                className="bg-white/20 group-hover:bg-white transition-colors rounded-t-sm w-full min-h-[2px]"
              />
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-white/10">
                {data.hour.toString().padStart(2, '0')}:00 - {data.focusMinutes}m
              </div>
            </div>
          );
        })}
      </div>

      {/* Quartile Labels */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {quartiles.map((q, i) => (
          <div key={i} className="flex flex-col gap-1 border-t border-white/10 pt-2">
            <span className="font-semibold text-zinc-300">{q.name}</span>
            <span className="text-zinc-600 hidden md:inline">{q.range}</span>
            <span className="text-white mt-1">{q.focusMinutes}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}
