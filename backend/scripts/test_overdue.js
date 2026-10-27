function getTodayDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isTaskOverdue(task) {
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

console.log('Today:', getTodayDateString());
const now = new Date();
console.log('Now:', now.getHours(), ':', now.getMinutes());

console.log('Task 00:00-01:00:', isTaskOverdue({ date: getTodayDateString(), startTime: '00:00', endTime: '01:00', status: 'pending' }));
console.log('Task 05:00-06:00:', isTaskOverdue({ date: getTodayDateString(), startTime: '05:00', endTime: '06:00', status: 'pending' }));
console.log('Task 11:00-12:00:', isTaskOverdue({ date: getTodayDateString(), startTime: '11:00', endTime: '12:00', status: 'pending' }));
