require('dotenv').config();
const { sequelize, Task } = require('../models');

async function setTodayTimes() {
  try {
    await sequelize.authenticate();
    const todayStr = '2026-10-28';

    // Get today's tasks
    const todayTasks = await Task.findAll({
      where: { date: todayStr },
      order: [['startTime', 'ASC']]
    });

    console.log(`Found ${todayTasks.length} tasks for ${todayStr}`);

    if (todayTasks.length >= 1) {
      // Task 1: 00:00 - 01:00 (Already ended before 01:15 AM -> Missed / Overdue!)
      await todayTasks[0].update({
        startTime: '00:00',
        endTime: '01:00',
        status: 'pending'
      });
      console.log(`Updated Task 1: "${todayTasks[0].title}" to 00:00 - 01:00 (ENDED -> OVERDUE/MISSED)`);
    }

    if (todayTasks.length >= 2) {
      // Task 2: 00:30 - 01:10 (Already ended before 01:15 AM -> Missed / Overdue!)
      await todayTasks[1].update({
        startTime: '00:30',
        endTime: '01:10',
        status: 'pending'
      });
      console.log(`Updated Task 2: "${todayTasks[1].title}" to 00:30 - 01:10 (ENDED -> OVERDUE/MISSED)`);
    }

    if (todayTasks.length >= 3) {
      // Task 3: 05:00 - 06:00 (Upcoming later today)
      await todayTasks[2].update({
        startTime: '05:00',
        endTime: '06:00',
        status: 'pending'
      });
      console.log(`Updated Task 3: "${todayTasks[2].title}" to 05:00 - 06:00 (UPCOMING)`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

setTodayTimes();
