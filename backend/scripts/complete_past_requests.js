require('dotenv').config();
const { sequelize, Task, WorkRequest, Sequelize } = require('../models');
const { Op } = Sequelize;

async function updateDB() {
  try {
    await sequelize.authenticate();
    const todayStr = '2026-10-28';

    console.log(`--- Running DB Update for ${todayStr} ---`);

    // 1. Mark ALL past tasks (date < todayStr) as completed
    const [pastUpdatedCount] = await Task.update(
      { status: 'completed' },
      {
        where: {
          date: { [Op.lt]: todayStr },
          status: { [Op.ne]: 'completed' }
        }
      }
    );
    console.log(`Past tasks marked as completed: ${pastUpdatedCount}`);

    // 2. For TODAY (date = todayStr): keep exactly 3-4 as uncomplete (pending), mark the rest completed
    const todayTasks = await Task.findAll({
      where: { date: todayStr },
      order: [['startTime', 'ASC']]
    });

    console.log(`Found ${todayTasks.length} tasks for today.`);

    // Keep first 3 as uncomplete (pending), mark others completed
    let uncompleteCount = 0;
    for (let i = 0; i < todayTasks.length; i++) {
      const task = todayTasks[i];
      if (i < 3) {
        // Keep as pending
        await task.update({ status: 'pending' });
        uncompleteCount++;
        console.log(`Kept today task [${i + 1}/3] UNCOMPLETE: "${task.title}" (${task.startTime}-${task.endTime})`);
      } else {
        // Mark completed
        await task.update({ status: 'completed' });
        console.log(`Marked today task [${i + 1}] COMPLETED: "${task.title}"`);
      }
    }

    // 3. Check WorkRequest table
    const [pastRequestsUpdated] = await WorkRequest.update(
      { status: 'completed' },
      {
        where: {
          date: { [Op.lt]: todayStr },
          status: { [Op.ne]: 'completed' }
        }
      }
    );
    console.log(`Past work_requests marked as completed: ${pastRequestsUpdated}`);

    // Verification
    const remainingOverdueTasks = await Task.count({
      where: {
        date: { [Op.lt]: todayStr },
        status: { [Op.ne]: 'completed' }
      }
    });

    const todayUncompleteTasks = await Task.count({
      where: {
        date: todayStr,
        status: { [Op.ne]: 'completed' }
      }
    });

    console.log(`\nVerification:`);
    console.log(`Past uncompleted tasks remaining: ${remainingOverdueTasks}`);
    console.log(`Today's uncompleted tasks remaining: ${todayUncompleteTasks}`);

    process.exit(0);
  } catch (err) {
    console.error('Error updating DB:', err);
    process.exit(1);
  }
}

updateDB();
