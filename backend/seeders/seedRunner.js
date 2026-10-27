require('dotenv').config();
const db = require('../models');

const categoriesData = [
  {
    id: 'cat-study',
    name: 'Study',
    color: '#8B5CF6',
    icon: 'BookOpen',
    description: 'Academic reading, research, and coursework',
  },
  {
    id: 'cat-work',
    name: 'Work',
    color: '#1769FF',
    icon: 'Briefcase',
    description: 'Professional work, client meetings, deliverables',
  },
  {
    id: 'cat-development',
    name: 'Development',
    color: '#06B6D4',
    icon: 'Code',
    description: 'Programming, architecture, and tech building',
  },
  {
    id: 'cat-health',
    name: 'Health',
    color: '#10B981',
    icon: 'Heart',
    description: 'Workouts, nutrition, sleep, and well-being',
  },
  {
    id: 'cat-learning',
    name: 'Learning',
    color: '#F59E0B',
    icon: 'GraduationCap',
    description: 'Skill development, languages, and tutorials',
  },
  {
    id: 'cat-personal',
    name: 'Personal',
    color: '#EC4899',
    icon: 'User',
    description: 'Chores, personal errands, bills, and relaxation',
  },
  {
    id: 'cat-other',
    name: 'Other',
    color: '#64748B',
    icon: 'Tag',
    description: 'Miscellaneous activities and unclassified items',
  },
];

const getTodayDateString = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const runSeed = async () => {
  try {
    console.log('🌱 Starting database seeding on Neon PostgreSQL...');
    await db.sequelize.authenticate();

    // 1. Categories
    for (const cat of categoriesData) {
      await db.Category.findOrCreate({
        where: { id: cat.id },
        defaults: cat,
      });
    }
    console.log(`✅ Seeded ${categoriesData.length} categories.`);

    // 2. Goals
    const today = getTodayDateString(0);
    const inFiveDays = getTodayDateString(5);
    const inFifteenDays = getTodayDateString(15);
    const inTwentyFiveDays = getTodayDateString(25);
    const inThirtyDays = getTodayDateString(30);

    const goalsData = [
      {
        id: 'goal-1',
        title: 'Complete VLSI Concepts',
        description: 'Master CMOS logic, propagation delays, dynamic circuits, and layout constraints.',
        targetDate: inFifteenDays,
        progress: 65,
        status: 'in-progress',
        category: 'Study',
        relatedTaskIds: ['task-5'],
      },
      {
        id: 'goal-2',
        title: 'Read Three Books This Month',
        description: 'Read "Designing Data-Intensive Applications", "Atomic Habits", and "Deep Work".',
        targetDate: inTwentyFiveDays,
        progress: 40,
        status: 'in-progress',
        category: 'Learning',
        relatedTaskIds: [],
      },
      {
        id: 'goal-3',
        title: 'Maintain Health & Fitness Routine',
        description: 'Hit 20 workout sessions, track daily hydration, and log minimum 8,000 steps daily.',
        targetDate: inThirtyDays,
        progress: 85,
        status: 'in-progress',
        category: 'Health',
        relatedTaskIds: ['task-1'],
      },
      {
        id: 'goal-4',
        title: 'Finish Project Documentation',
        description: 'Complete architecture diagrams, user guides, and integration tests documentation.',
        targetDate: inFiveDays,
        progress: 90,
        status: 'in-progress',
        category: 'Work',
        relatedTaskIds: ['task-3'],
      },
      {
        id: 'goal-5',
        title: 'Learn Digital Electronics Fundamentals',
        description: 'Complete basic boolean algebra, logic gates simplification, and K-maps.',
        targetDate: today,
        progress: 100,
        status: 'completed',
        category: 'Study',
        relatedTaskIds: ['task-2'],
      },
    ];

    for (const g of goalsData) {
      await db.Goal.findOrCreate({
        where: { id: g.id },
        defaults: g,
      });
    }
    console.log(`✅ Seeded ${goalsData.length} goals.`);

    // 3. Tasks
    const tasksData = [
      {
        id: 'task-1',
        title: 'Morning Exercise',
        description: 'Cardio, core stretches, and light hydration routine',
        date: today,
        startTime: '05:30',
        endTime: '06:30',
        categoryId: 'cat-health',
        priority: 'High',
        goalId: 'goal-3',
        status: 'completed',
      },
      {
        id: 'task-2',
        title: 'Read Electronics Chapter 1',
        description: 'Semiconductor physics basics and diode circuits',
        date: today,
        startTime: '06:30',
        endTime: '08:00',
        categoryId: 'cat-study',
        priority: 'High',
        goalId: 'goal-5',
        status: 'completed',
      },
      {
        id: 'task-3',
        title: 'Work on Project',
        description: 'Implement frontend dashboard layout and navigation bar',
        date: today,
        startTime: '09:00',
        endTime: '11:00',
        categoryId: 'cat-development',
        priority: 'High',
        goalId: 'goal-4',
        status: 'completed',
      },
      {
        id: 'task-4',
        title: 'Lunch Break & Mindful Walk',
        description: 'Healthy nutrient-dense meal and 15 min walk',
        date: today,
        startTime: '12:30',
        endTime: '13:30',
        categoryId: 'cat-personal',
        priority: 'Medium',
        goalId: null,
        status: 'pending',
      },
      {
        id: 'task-5',
        title: 'Circuit Simulation Testing',
        description: 'Run SPICE simulations for CMOS inverter transient delay',
        date: today,
        startTime: '14:00',
        endTime: '16:00',
        categoryId: 'cat-study',
        priority: 'High',
        goalId: 'goal-1',
        status: 'pending',
      },
    ];

    for (const t of tasksData) {
      await db.Task.findOrCreate({
        where: { id: t.id },
        defaults: t,
      });
    }
    console.log(`✅ Seeded ${tasksData.length} initial tasks.`);

    // 4. Events
    const eventsData = [
      {
        id: 'event-1',
        title: 'Team Sprint Review',
        description: 'Demonstrating feature prototypes to product stakeholders',
        date: getTodayDateString(2),
        startTime: '10:00',
        endTime: '11:30',
        categoryId: 'cat-work',
        location: 'Zoom / Room 402',
      },
      {
        id: 'event-2',
        title: 'VLSI Concepts Workshop',
        description: 'Hands-on CAD tool laboratory and timing optimization',
        date: getTodayDateString(5),
        startTime: '14:00',
        endTime: '17:00',
        categoryId: 'cat-study',
        location: 'Main Engineering Auditorium',
      },
    ];

    for (const ev of eventsData) {
      await db.Event.findOrCreate({
        where: { id: ev.id },
        defaults: ev,
      });
    }
    console.log(`✅ Seeded ${eventsData.length} events.`);

    // 5. Settings
    await db.Setting.findOrCreate({
      where: { id: 1 },
      defaults: {
        theme: 'light',
        accentColor: '#1769FF',
        weekStartsOnSunday: true,
        defaultCalendarView: 'week',
        timeFormat: '12h',
        layoutComfort: 'comfortable',
        enableInAppNotifications: true,
        soundEffects: false,
      },
    });
    console.log('✅ Seeded user settings.');

    // 6. Daily Reports
    const reportsData = [
      {
        id: `report-${getTodayDateString(0)}`,
        date: getTodayDateString(0),
        title: `Daily Work Report - ${getTodayDateString(0)}`,
        accomplishments: '• Build task dashboard (01) (06:00 - 06:30) [Development]\n• Morning Workout (06:00 - 06:45) [Health]\n• Review task status flow (08) (07:00 - 08:00) [Development]',
        highlights: 'Delivered initial schedule sequences on schedule.',
        blockers: 'None. Steady progress without major impediments.',
        tomorrowPlan: '• Review dashboard layout (01) (06:00 - 06:30)\n• Architecture Review & Planning (09:00 - 10:30)',
        hoursLogged: 7.5,
        rating: 5,
        mood: 'fire',
        tasksCompletedCount: 3,
        tasksTotalCount: 5,
        submittedAt: new Date(),
      },
      {
        id: `report-${getTodayDateString(-1)}`,
        date: getTodayDateString(-1),
        title: `Daily Work Report - ${getTodayDateString(-1)}`,
        accomplishments: '• Submitted Engineering Lab Report with LaTeX measurement graphs.\n• Conducted Client Sprint Sync meeting.',
        highlights: 'Cleared all high priority sprint deliverables.',
        blockers: 'None. Dependencies cleared on time.',
        tomorrowPlan: '• Plan next sprint tasks.',
        hoursLogged: 7.0,
        rating: 5,
        mood: 'rocket',
        tasksCompletedCount: 4,
        tasksTotalCount: 4,
        submittedAt: new Date(Date.now() - 86400000),
      },
    ];

    for (const r of reportsData) {
      await db.DailyReport.findOrCreate({
        where: { id: r.id },
        defaults: r,
      });
    }
    console.log(`✅ Seeded ${reportsData.length} daily reports.`);

    console.log('🎉 Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

/**
 * Remove all data seeded by seedRunner from the database
 */
const cleanSeed = async () => {
  const transaction = await db.sequelize.transaction();
  try {
    console.log('🧹 Removing all seeder data from Neon PostgreSQL database...');
    await db.sequelize.authenticate();

    const taskIds = ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'];
    const eventIds = ['event-1', 'event-2'];
    const goalIds = ['goal-1', 'goal-2', 'goal-3', 'goal-4', 'goal-5'];
    const categoryIds = categoriesData.map((c) => c.id);

    // 1. Remove Tasks (foreign keys to goals and categories)
    const deletedTasks = await db.Task.destroy({
      where: { id: taskIds },
      transaction,
    });
    console.log(`🗑️ Removed ${deletedTasks} seeded tasks.`);

    // 2. Remove Events (foreign key to categories)
    const deletedEvents = await db.Event.destroy({
      where: { id: eventIds },
      transaction,
    });
    console.log(`🗑️ Removed ${deletedEvents} seeded events.`);

    // 3. Remove Goals
    const deletedGoals = await db.Goal.destroy({
      where: { id: goalIds },
      transaction,
    });
    console.log(`🗑️ Removed ${deletedGoals} seeded goals.`);

    // 4. Remove Categories seeded by seedRunner
    const deletedCategories = await db.Category.destroy({
      where: { id: categoryIds },
      transaction,
    });
    console.log(`🗑️ Removed ${deletedCategories} seeded categories.`);

    // 5. Remove Settings seeded by seedRunner
    const deletedSettings = await db.Setting.destroy({
      where: { id: 1 },
      transaction,
    });
    console.log(`🗑️ Removed ${deletedSettings} seeded settings.`);

    await transaction.commit();
    console.log('✨ All seeder data successfully removed from database!');
    return {
      deletedTasks,
      deletedEvents,
      deletedGoals,
      deletedCategories,
      deletedSettings,
    };
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Failed to remove seeder data:', error);
    throw error;
  }
};

if (require.main === module) {
  const isUndo =
    process.argv.includes('--undo') ||
    process.argv.includes('--clean') ||
    process.argv.includes('--remove') ||
    process.argv.includes('clean') ||
    process.argv.includes('undo');

  if (isUndo) {
    cleanSeed()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    runSeed()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = {
  runSeed,
  cleanSeed,
};
