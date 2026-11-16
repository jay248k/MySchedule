const { sequelize } = require('../config/database');
const { Habit, HabitLog } = require('../models');
const habitController = require('../controllers/habitController');

async function runTestAndClean() {
  try {
    console.log('🔄 Authenticating database connection...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully to Neon DB.');

    console.log('\n--- 1. SEEDING TEST HABITS & 16-DAY STREAK LOGS ---');
    const habit = await Habit.create({
      id: 'test-habit-5am-wakeup',
      name: 'Wake up at 5:00 AM',
      description: 'Daily discipline test habit to verify 16-day streak calculation & full calendar',
      targetTime: '05:00',
      category: 'Discipline',
      color: '#10B981',
      icon: 'sun',
      frequency: 'daily',
    });
    console.log(`✅ Created test habit: "${habit.name}" (ID: ${habit.id})`);

    // Seed 16 consecutive days ending today
    const now = new Date();
    const seededLogs = [];
    for (let i = 0; i < 16; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      seededLogs.push({
        id: `test-log-${habit.id}-${dateStr}`,
        habitId: habit.id,
        date: dateStr,
        completed: true,
        completedAt: new Date(),
      });
    }

    await HabitLog.bulkCreate(seededLogs);
    console.log(`✅ Seeded ${seededLogs.length} consecutive daily logs for 16-day streak verification.`);

    console.log('\n--- 2. VERIFYING STREAK COMPUTATION & HABIT REPORT ---');
    const reloaded = await Habit.findByPk(habit.id, {
      include: [{ model: HabitLog, as: 'logs' }],
    });

    const mockReq = { query: {}, userId: null };
    let capturedData = null;
    const mockRes = {
      json: (payload) => {
        capturedData = payload;
      },
    };

    await habitController.getHabits(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    const testHabitResult = (capturedData.data || []).find((h) => h.id === habit.id);
    console.log('📊 Result for seeded habit:');
    console.log(`   - Current Streak: ${testHabitResult?.currentStreak} days`);
    console.log(`   - Longest Streak: ${testHabitResult?.longestStreak} days`);
    console.log(`   - Total Logs: ${testHabitResult?.totalCompleted} days`);
    console.log(`   - Today Completed: ${testHabitResult?.isCompletedToday}`);

    if (testHabitResult?.currentStreak >= 16) {
      console.log('🎉 Streak logic passed with flying colors! 16-day streak confirmed.');
    } else {
      console.warn('⚠️ Warning: Streak calculated as:', testHabitResult?.currentStreak);
    }

    console.log('\n--- 3. CLEANING UP / REMOVING SEEDED TEST DATA ---');
    await HabitLog.destroy({ where: { habitId: habit.id } });
    await Habit.destroy({ where: { id: habit.id } });
    console.log('🧹 Cleaned up: test habit and test logs removed completely from Neon database.');

    const checkHabit = await Habit.findByPk(habit.id);
    if (!checkHabit) {
      console.log('✅ Verified: Database is clean and ready for user habits!');
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during test & clean:', err);
    await sequelize.close();
    process.exit(1);
  }
}

runTestAndClean();
