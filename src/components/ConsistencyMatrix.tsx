import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DayData } from '../lib/telemetry';

interface ConsistencyMatrixProps {
  matrix: DayData[];
  onDayClick?: (day: DayData) => void;
  selectedDate?: Date | null;
}

export function ConsistencyMatrix({ matrix, onDayClick, selectedDate }: ConsistencyMatrixProps) {
  const [hoveredDay, setHoveredDay] = useState<{ day: DayData; x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Convert vertical scroll to horizontal scroll
      if (e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    // passive: false is required to preventDefault
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Group matrix by weeks starting on Sunday (0)
  const { weeks, monthLabels } = useMemo(() => {
    if (matrix.length === 0) return { weeks: [], monthLabels: [] };

    const weeksArray: (DayData | null)[][] = [];
    const labels: { month: string; weekIndex: number }[] = [];
    
    let currentWeek: (DayData | null)[] = new Array(7).fill(null);
    
    matrix.forEach((day, index) => {
      const dayOfWeek = day.date.getDay(); // 0 is Sunday, 6 is Saturday
      
      // If it's the very first day, we might need to pad the beginning of the week
      if (index === 0 && dayOfWeek !== 0) {
        currentWeek = new Array(7).fill(null);
      }

      currentWeek[dayOfWeek] = day;

      // Check if it's the first time we see this month
      if (day.date.getDate() === 1 || (index === 0 && day.date.getDate() > 1)) {
        labels.push({
          month: day.date.toLocaleString('default', { month: 'short' }),
          weekIndex: weeksArray.length
        });
      }

      // If it's Saturday, push the week and start a new one
      if (dayOfWeek === 6 || index === matrix.length - 1) {
        weeksArray.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }
    });

    return { weeks: weeksArray, monthLabels: labels };
  }, [matrix]);

  const getTierClasses = (tier: DayData['tier']) => {
    switch (tier) {
      case 'dormant':
        return 'bg-[#18181c] border border-white/5';
      case 'spark':
        return 'bg-[#3f3f46] border border-transparent';
      case 'flow':
        return 'bg-[#a1a1aa] border border-white/20';
      case 'ascended':
        return 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]';
      default:
        return 'bg-[#18181c]';
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, day: DayData) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay({
      day,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  return (
    <div className="flex flex-col gap-2 relative w-full">
      <div 
        ref={scrollRef}
        className="w-full overflow-x-auto pb-4 custom-scrollbar flex flex-col gap-2"
      >
        {/* Month Labels */}
        <div className="flex relative h-4 text-[10px] text-zinc-500 min-w-max" style={{ paddingLeft: '32px' }}>
          {monthLabels.map((label, i) => (
            <div
              key={i}
              className="absolute"
              style={{ left: `calc(32px + ${label.weekIndex * (12 + 4)}px)` }}
            >
              {label.month}
            </div>
          ))}
        </div>

        <div className="flex gap-2 min-w-max">
          {/* Day Labels (Mon, Wed, Fri) */}
          <div className="flex flex-col gap-1 text-[10px] text-zinc-500 pt-[2px] pr-2 shrink-0">
            <div className="h-3"></div>
            <div className="h-3 leading-[12px]">Mon</div>
            <div className="h-3"></div>
            <div className="h-3 leading-[12px]">Wed</div>
            <div className="h-3"></div>
            <div className="h-3 leading-[12px]">Fri</div>
            <div className="h-3"></div>
          </div>

          {/* Matrix Grid */}
          <div className="flex gap-1 shrink-0">
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-1">
                {week.map((day, dIndex) => {
                  if (!day) {
                    return <div key={dIndex} className="w-3 h-3 rounded-sm opacity-0 pointer-events-none" />;
                  }

                  const isSelected =
                    selectedDate &&
                    day.date.getDate() === selectedDate.getDate() &&
                    day.date.getMonth() === selectedDate.getMonth() &&
                    day.date.getFullYear() === selectedDate.getFullYear();

                  return (
                    <div
                      key={dIndex}
                      className={`w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 ${getTierClasses(
                        day.tier
                      )} ${isSelected ? 'ring-[1.5px] ring-white ring-offset-[1.5px] ring-offset-black' : 'hover:scale-[1.15] hover:z-10 relative'}`}
                      onMouseEnter={(e) => handleMouseEnter(e, day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() => onDayClick?.(day)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full bg-zinc-900 border border-white/10 text-white text-xs p-3 rounded-md shadow-xl flex flex-col gap-1 min-w-[140px]"
            style={{ left: hoveredDay.x, top: hoveredDay.y }}
          >
            <div className="font-semibold text-zinc-300 mb-1">
              {hoveredDay.day.date.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Focus</span>
              <span>{hoveredDay.day.focusMinutes}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Tasks</span>
              <span>{hoveredDay.day.completedTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Sessions</span>
              <span>{hoveredDay.day.sessionCount}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end items-center gap-2 text-[10px] text-zinc-500 mt-2">
        <span>Less</span>
        <div className="flex gap-1">
          <div className={`w-[10px] h-[10px] rounded-[1px] ${getTierClasses('dormant')}`} />
          <div className={`w-[10px] h-[10px] rounded-[1px] ${getTierClasses('spark')}`} />
          <div className={`w-[10px] h-[10px] rounded-[1px] ${getTierClasses('flow')}`} />
          <div className={`w-[10px] h-[10px] rounded-[1px] ${getTierClasses('ascended')}`} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
