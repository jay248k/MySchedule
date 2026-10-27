require('dotenv').config();
const { sequelize, Task, WorkRequest, Sequelize } = require('../models');
const { Op } = Sequelize;

async function checkToday() {
  try {
    await sequelize.authenticate();
    const todayStr = '2026-10-28';
    
    // Check tasks on todayStr
    const todayTasks = await Task.findAll({
      where: { date: todayStr },
      order: [['startTime', 'ASC']]
    });
    console.log(`Tasks on ${todayStr}: count = ${todayTasks.length}`);
    console.log(todayTasks.map(t => ({ id: t.id, title: t.title, time: `${t.startTime}-${t.endTime}`, status: t.status })));

    // Check past pending tasks (date < todayStr)
    const pastPendingTasks = await Task.count({
      where: {
        date: { [Op.lt]: todayStr },
        status: 'pending'
      }
    });
    console.log(`Past pending tasks (date < ${todayStr}): ${pastPendingTasks}`);

    // Check work_requests
    const allRequests = await WorkRequest.findAll();
    console.log(`All WorkRequests count: ${allRequests.length}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkToday();
