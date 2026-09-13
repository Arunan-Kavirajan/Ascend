import type { Session } from '../context/SessionContext';

export interface DayData {
  date: Date;
  focusMinutes: number;
  completedTasks: number;
  sessionCount: number;
  tier: 'dormant' | 'spark' | 'flow' | 'ascended';
}

export function generateMatrix(sessions: Session[], startDate: Date, endDate: Date): DayData[] {
  const matrix: DayData[] = [];
  
  // Calculate total days between startDate and endDate
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  for (let i = 0; i < days; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    matrix.push({
      date: d,
      focusMinutes: 0,
      completedTasks: 0,
      sessionCount: 0,
      tier: 'dormant',
    });
  }

  // Aggregate sessions
  sessions.forEach(session => {
    const sessionDate = new Date(session.createdAt);
    // Find matching day in matrix (ignoring time)
    const day = matrix.find(
      (m) =>
        m.date.getDate() === sessionDate.getDate() &&
        m.date.getMonth() === sessionDate.getMonth() &&
        m.date.getFullYear() === sessionDate.getFullYear()
    );

    if (day) {
      const minutes = Math.floor((session.totalFocusTime || 0) / 60);
      day.focusMinutes += minutes;
      day.sessionCount += 1;
      const completedTasks = session.tasks?.filter((t) => t.completed).length || 0;
      day.completedTasks += completedTasks;
    }
  });

  // Calculate tiers
  matrix.forEach(day => {
    if (day.focusMinutes === 0) day.tier = 'dormant';
    else if (day.focusMinutes < 45) day.tier = 'spark';
    else if (day.focusMinutes < 120) day.tier = 'flow';
    else day.tier = 'ascended';
  });

  return matrix;
}

export interface CircadianData {
  hour: number;
  focusMinutes: number;
}

export interface QuartileData {
  name: 'Dawn' | 'Noon' | 'Dusk' | 'Deep Night';
  range: string;
  focusMinutes: number;
}

export function calculateCircadian(sessions: Session[]): {
  hourly: CircadianData[];
  quartiles: QuartileData[];
  peakWindow: string;
} {
  const hourly = Array.from({ length: 24 }).map((_, i) => ({
    hour: i,
    focusMinutes: 0,
  }));

  sessions.forEach(session => {
    const sessionDate = new Date(session.createdAt);
    const hour = sessionDate.getHours();
    hourly[hour].focusMinutes += Math.floor((session.totalFocusTime || 0) / 60);
  });

  const quartiles: QuartileData[] = [
    { name: 'Dawn', range: '05:00-11:00', focusMinutes: 0 },
    { name: 'Noon', range: '11:00-17:00', focusMinutes: 0 },
    { name: 'Dusk', range: '17:00-22:00', focusMinutes: 0 },
    { name: 'Deep Night', range: '22:00-05:00', focusMinutes: 0 },
  ];

  hourly.forEach(data => {
    if (data.hour >= 5 && data.hour < 11) quartiles[0].focusMinutes += data.focusMinutes;
    else if (data.hour >= 11 && data.hour < 17) quartiles[1].focusMinutes += data.focusMinutes;
    else if (data.hour >= 17 && data.hour < 22) quartiles[2].focusMinutes += data.focusMinutes;
    else quartiles[3].focusMinutes += data.focusMinutes; // 22-05
  });

  // Find Peak Cognitive Window (highest quartile)
  let peakQuartile = quartiles[0];
  quartiles.forEach(q => {
    if (q.focusMinutes > peakQuartile.focusMinutes) {
      peakQuartile = q;
    }
  });

  // Calculate actual peak 2-3 hour window by finding the sliding window of 3 hours with max focus
  let maxWindowSum = -1;
  let peakStartHour = 0;
  for (let i = 0; i < 24; i++) {
    const sum =
      hourly[i].focusMinutes +
      hourly[(i + 1) % 24].focusMinutes +
      hourly[(i + 2) % 24].focusMinutes;
    if (sum > maxWindowSum) {
      maxWindowSum = sum;
      peakStartHour = i;
    }
  }
  
  let peakWindowStr = "Not enough data";
  if (maxWindowSum > 0) {
    const startStr = peakStartHour.toString().padStart(2, '0') + ':00';
    const endStr = ((peakStartHour + 3) % 24).toString().padStart(2, '0') + ':00';
    peakWindowStr = `${startStr} — ${endStr}`;
  }

  return { hourly, quartiles, peakWindow: peakWindowStr };
}

export function calculateVelocity(sessions: Session[]) {
  let totalMinutes = 0;
  let totalTasks = 0;
  let completedCount = 0;
  
  sessions.forEach(session => {
    totalMinutes += Math.floor((session.totalFocusTime || 0) / 60);
    totalTasks += session.tasks?.filter(t => t.completed).length || 0;
    if (session.status === 'completed') {
      completedCount++;
    }
  });

  const minutesPerTask = totalTasks > 0 ? Math.round(totalMinutes / totalTasks) : 0;
  const sessionIntegrity = sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : 0;

  return {
    minutesPerTask,
    sessionIntegrity,
  };
}
