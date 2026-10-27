// Utility functions for dates and times

export function getTodayDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(dateStr, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!dateStr) return '';
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', options);
}

export function formatMonthYear(year, month) {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatTime(timeStr, is12Hour = true) {
  if (!timeStr) return '';
  if (!is12Hour) return timeStr;
  
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  return `${h}:${m} ${ampm}`;
}

export function getDayPeriod(timeStr) {
  if (!timeStr) return 'morning';
  const [hStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function isTaskOverdue(task) {
  if (!task || task.status === 'completed' || task.status === 'cancelled') return false;
  
  const todayStr = getTodayDateString();
  if (task.date && task.date < todayStr) return true;
  
  if (task.date === todayStr) {
    let checkTime = task.endTime;
    if (!checkTime && task.timeSlot) {
      if (task.timeSlot.includes('-')) {
        const parts = task.timeSlot.split('-');
        checkTime = (parts[1] || parts[0]).trim();
      } else if (task.timeSlot.toLowerCase().includes(' to ')) {
        const parts = task.timeSlot.toLowerCase().split(' to ');
        checkTime = (parts[1] || parts[0]).trim();
      }
    }
    if (!checkTime) {
      checkTime = task.startTime;
    }

    if (checkTime) {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      
      const cleanTime = String(checkTime).trim().toLowerCase();
      const isPM = cleanTime.includes('pm');
      const isAM = cleanTime.includes('am');
      const nums = cleanTime.replace(/[^\d:]/g, '').split(':').map(Number);
      
      let h = nums[0] !== undefined ? nums[0] : 0;
      let m = nums[1] !== undefined ? nums[1] : 0;
      
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      
      if (currentH > h || (currentH === h && currentM > m)) {
        return true;
      }
    }
  }
  return false;
}

export function getMonthCalendarGrid(year, month, weekStartsOnSunday = true) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const daysInMonth = lastDayOfMonth.getDate();
  let startingDay = firstDayOfMonth.getDay(); // 0 is Sunday
  
  if (!weekStartsOnSunday) {
    // 0 becomes Monday (0), Sunday becomes 6
    startingDay = (startingDay + 6) % 7;
  }
  
  const grid = [];
  
  // Leading spacer slots before Day 1
  for (let i = 0; i < startingDay; i++) {
    grid.push({
      dateStr: null,
      dayNumber: null,
      isCurrentMonth: false,
      isToday: false,
      isEmpty: true,
    });
  }
  
  // Current month days (strictly this month only)
  const todayStr = getTodayDateString();
  for (let day = 1; day <= daysInMonth; day++) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;
    grid.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isEmpty: false,
    });
  }
  
  // Trailing spacer slots to complete the final week row only
  const remainder = grid.length % 7;
  if (remainder !== 0) {
    const trailingNeeded = 7 - remainder;
    for (let i = 0; i < trailingNeeded; i++) {
      grid.push({
        dateStr: null,
        dayNumber: null,
        isCurrentMonth: false,
        isToday: false,
        isEmpty: true,
      });
    }
  }
  
  return grid;
}

export function getWeekDaysGrid(referenceDateStr, weekStartsOnSunday = true) {
  const ref = parseDate(referenceDateStr);
  let dayOfWeek = ref.getDay(); // 0 is Sunday
  if (!weekStartsOnSunday) {
    dayOfWeek = (dayOfWeek + 6) % 7;
  }
  
  const startOfWeek = new Date(ref);
  startOfWeek.setDate(ref.getDate() - dayOfWeek);
  
  const todayStr = getTodayDateString();
  const weekDays = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    weekDays.push({
      dateStr,
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
      isToday: dateStr === todayStr,
      isReference: dateStr === referenceDateStr,
    });
  }
  
  return weekDays;
}
