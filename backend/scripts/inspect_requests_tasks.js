require('dotenv').config();
const { sequelize, Task, WorkRequest } = require('../models');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const totalTasks = await Task.count();
    const pendingTasks = await Task.count({ where: { status: 'pending' } });
    console.log(`Tasks: total = ${totalTasks}, pending = ${pendingTasks}`);

    const totalRequests = await WorkRequest.count();
    const pendingRequests = await WorkRequest.count({ where: { status: 'pending' } });
    console.log(`WorkRequests: total = ${totalRequests}, pending = ${pendingRequests}`);

    const samplePendingTasks = await Task.findAll({
      where: { status: 'pending' },
      limit: 5,
      order: [['date', 'ASC']]
    });
    console.log('Sample pending tasks dates:', samplePendingTasks.map(t => ({ id: t.id, title: t.title, date: t.date })));

    const sampleRequests = await WorkRequest.findAll({
      where: { status: 'pending' },
      limit: 5,
      order: [['date', 'ASC']]
    });
    console.log('Sample pending requests dates:', sampleRequests.map(r => ({ id: r.id, title: r.title, date: r.date })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
