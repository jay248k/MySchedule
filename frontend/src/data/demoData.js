import { getTodayDateString } from '../utils/dateUtils';

export const initialCategories = [
  {
    id: 'cat-study',
    name: 'Study',
    color: '#8B5CF6', // Purple
    icon: 'BookOpen',
    description: 'Academic reading, research, and coursework',
  },
  {
    id: 'cat-work',
    name: 'Work',
    color: '#1769FF', // Primary Blue
    icon: 'Briefcase',
    description: 'Professional work, client meetings, deliverables',
  },
  {
    id: 'cat-development',
    name: 'Development',
    color: '#06B6D4', // Cyan
    icon: 'Code',
    description: 'Programming, architecture, and tech building',
  },
  {
    id: 'cat-health',
    name: 'Health',
    color: '#10B981', // Emerald
    icon: 'Heart',
    description: 'Workouts, nutrition, sleep, and well-being',
  },
  {
    id: 'cat-learning',
    name: 'Learning',
    color: '#F59E0B', // Amber
    icon: 'GraduationCap',
    description: 'Skill development, languages, and tutorials',
  },
  {
    id: 'cat-personal',
    name: 'Personal',
    color: '#EC4899', // Pink
    icon: 'User',
    description: 'Chores, personal errands, bills, and relaxation',
  },
  {
    id: 'cat-other',
    name: 'Other',
    color: '#64748B', // Slate
    icon: 'Tag',
    description: 'Miscellaneous activities and unclassified items',
  },
];

export function getInitialTasks() {
  const today = getTodayDateString(0);
  const yesterday = getTodayDateString(-1);
  const twoDaysAgo = getTodayDateString(-2);
  const tomorrow = getTodayDateString(1);
  const inTwoDays = getTodayDateString(2);
  const inThreeDays = getTodayDateString(3);
  const inFiveDays = getTodayDateString(5);
  const inEightDays = getTodayDateString(8);

  return [
    {
      id: 'task-1',
      title: 'Morning Exercise',
      description: 'Cardio, core stretches, and light hydration routine',
      date: today,
      startTime: '05:30',
      endTime: '06:30',
      categoryId: 'cat-health',
      priority: 'High',
      goalId: 'goal-3', // Maintain Health & Fitness Routine
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      goalId: 'goal-5', // Learn Digital Electronics Fundamentals
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      goalId: 'goal-4', // Finish Project Documentation & Dev
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'Lunch Break',
      description: 'Healthy nutrient-dense meal and 15 min mindful walk',
      date: today,
      startTime: '12:30',
      endTime: '13:30',
      categoryId: 'cat-personal',
      priority: 'Medium',
      goalId: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-5',
      title: 'Study VLSI Concepts',
      description: 'CMOS inverter delay models and interconnect capacitance analysis',
      date: today,
      startTime: '14:00',
      endTime: '16:00',
      categoryId: 'cat-study',
      priority: 'High',
      goalId: 'goal-1', // Complete VLSI Concepts
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-6',
      title: 'Update Project Documentation',
      description: 'Draft API reference guide and component usage notes',
      date: today,
      startTime: '16:30',
      endTime: '17:30',
      categoryId: 'cat-work',
      priority: 'Medium',
      goalId: 'goal-4', // Finish Project Documentation
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-7',
      title: 'Evening Walk',
      description: 'Unwind in the park with audio podcast',
      date: today,
      startTime: '18:00',
      endTime: '19:00',
      categoryId: 'cat-health',
      priority: 'Low',
      goalId: 'goal-3',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-8',
      title: 'Pay Electricity Bill',
      description: 'Utility payment portal deadline was earlier today',
      date: today,
      startTime: '08:00',
      endTime: '08:30',
      categoryId: 'cat-personal',
      priority: 'Medium',
      goalId: null,
      status: 'overdue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-9',
      title: 'Read English Practice',
      description: 'Review technical vocabulary and editorial essay',
      date: today,
      startTime: '21:00',
      endTime: '22:00',
      categoryId: 'cat-learning',
      priority: 'Low',
      goalId: 'goal-2',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-10',
      title: 'Plan Tomorrow',
      description: 'Review calendar commitments and prepare priorities checklist',
      date: today,
      startTime: '22:00',
      endTime: '22:30',
      categoryId: 'cat-personal',
      priority: 'Low',
      goalId: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // Yesterday tasks
    {
      id: 'task-11',
      title: 'Submit Engineering Lab Report',
      description: 'Finalize measurements table and graphs in LaTeX',
      date: yesterday,
      startTime: '10:00',
      endTime: '12:00',
      categoryId: 'cat-study',
      priority: 'High',
      goalId: 'goal-1',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-12',
      title: 'Client Sprint Sync',
      description: 'Review milestone deliverables with stakeholder team',
      date: yesterday,
      startTime: '14:30',
      endTime: '15:30',
      categoryId: 'cat-work',
      priority: 'High',
      goalId: 'goal-4',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-13',
      title: 'Submit Tax Deductions',
      description: 'Organize receipts for annual filing',
      date: twoDaysAgo,
      startTime: '11:00',
      endTime: '12:00',
      categoryId: 'cat-personal',
      priority: 'High',
      goalId: null,
      status: 'overdue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // Upcoming tasks across the month
    {
      id: 'task-14',
      title: 'Code Review & Refactor',
      description: 'Review pull requests for state management modules',
      date: tomorrow,
      startTime: '10:00',
      endTime: '11:30',
      categoryId: 'cat-development',
      priority: 'High',
      goalId: 'goal-4',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-15',
      title: 'Circuit Simulation Experiments',
      description: 'Run SPICE simulations for transit time calculations',
      date: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
      categoryId: 'cat-study',
      priority: 'Medium',
      goalId: 'goal-1',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-16',
      title: 'Team Retrospective',
      description: 'Discuss sprint wins and improvements for next cycle',
      date: inTwoDays,
      startTime: '11:00',
      endTime: '12:00',
      categoryId: 'cat-work',
      priority: 'Medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-17',
      title: 'Grocery Stock & Meal Prep',
      description: 'Restock fresh produce and prepare healthy mid-week lunches',
      date: inThreeDays,
      startTime: '09:00',
      endTime: '10:30',
      categoryId: 'cat-personal',
      priority: 'Low',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-18',
      title: 'Deep Learning Seminar',
      description: 'Attend invited speaker session on transformer attention mechanisms',
      date: inFiveDays,
      startTime: '15:00',
      endTime: '17:00',
      categoryId: 'cat-learning',
      priority: 'Medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-19',
      title: 'Quarterly Goal Assessment',
      description: 'Review quarterly progress metrics and recalibrate next milestones',
      date: inEightDays,
      startTime: '16:00',
      endTime: '17:30',
      categoryId: 'cat-work',
      priority: 'High',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getInitialEvents() {
  const today = getTodayDateString(0);
  const inTwoDays = getTodayDateString(2);
  const inFourDays = getTodayDateString(4);
  const inFiveDays = getTodayDateString(5);
  const inEightDays = getTodayDateString(8);
  const threeDaysAgo = getTodayDateString(-3);

  return [
    {
      id: 'event-1',
      title: 'Team Sprint Review',
      description: 'Demonstrating feature prototypes to product stakeholders',
      date: inTwoDays,
      startTime: '10:00',
      endTime: '11:30',
      categoryId: 'cat-work',
      location: 'Zoom / Room 402',
    },
    {
      id: 'event-2',
      title: 'VLSI Concepts & System Workshop',
      description: 'Hands-on CAD tool laboratory and timing optimization',
      date: inFiveDays,
      startTime: '14:00',
      endTime: '17:00',
      categoryId: 'cat-study',
      location: 'Main Engineering Auditorium',
    },
    {
      id: 'event-3',
      title: 'Routine Health & Dental Checkup',
      description: 'Annual preventative screening check',
      date: threeDaysAgo,
      startTime: '09:00',
      endTime: '10:00',
      categoryId: 'cat-health',
      location: 'City Wellness Medical Clinic',
    },
    {
      id: 'event-4',
      title: 'Tech Meetup & Networking Night',
      description: 'Modern frontend frameworks panel discussion and mixer',
      date: inEightDays,
      startTime: '18:00',
      endTime: '20:30',
      categoryId: 'cat-learning',
      location: 'Downtown Innovation Hub',
    },
    {
      id: 'event-5',
      title: 'Family Dinner Gathering',
      description: 'Weekend celebration and catching up',
      date: inFourDays,
      startTime: '19:30',
      endTime: '21:30',
      categoryId: 'cat-personal',
      location: 'Bella Vista Bistro',
    },
    {
      id: 'event-6',
      title: 'Project Architecture Sync',
      description: 'Quick check on data flow and state consistency',
      date: today,
      startTime: '11:15',
      endTime: '12:00',
      categoryId: 'cat-development',
      location: 'Google Meet',
    },
  ];
}

export function getInitialGoals() {
  const today = getTodayDateString(0);
  const inFiveDays = getTodayDateString(5);
  const inFifteenDays = getTodayDateString(15);
  const inTwentyFiveDays = getTodayDateString(25);
  const inThirtyDays = getTodayDateString(30);
  const twoDaysAgo = getTodayDateString(-2);

  return [
    {
      id: 'goal-1',
      title: 'Complete VLSI Concepts',
      description: 'Master CMOS logic, propagation delays, dynamic circuits, and layout constraints.',
      targetDate: inFifteenDays,
      progress: 65,
      status: 'in-progress',
      category: 'Study',
      relatedTaskIds: ['task-5', 'task-15'],
    },
    {
      id: 'goal-2',
      title: 'Read Three Books This Month',
      description: 'Read "Designing Data-Intensive Applications", "Atomic Habits", and "Deep Work".',
      targetDate: inTwentyFiveDays,
      progress: 40,
      status: 'in-progress',
      category: 'Learning',
      relatedTaskIds: ['task-9'],
    },
    {
      id: 'goal-3',
      title: 'Maintain Health & Fitness Routine',
      description: 'Hit 20 workout sessions, track daily hydration, and log minimum 8,000 steps daily.',
      targetDate: inThirtyDays,
      progress: 85,
      status: 'in-progress',
      category: 'Health',
      relatedTaskIds: ['task-1', 'task-7'],
    },
    {
      id: 'goal-4',
      title: 'Finish Project Documentation',
      description: 'Complete architecture diagrams, user guides, and integration tests documentation.',
      targetDate: inFiveDays,
      progress: 90,
      status: 'in-progress',
      category: 'Work',
      relatedTaskIds: ['task-6'],
    },
    {
      id: 'goal-5',
      title: 'Learn Digital Electronics Fundamentals',
      description: 'Complete basic boolean algebra, logic gates simplification, and K-maps.',
      targetDate: twoDaysAgo,
      progress: 100,
      status: 'completed',
      category: 'Study',
      relatedTaskIds: ['task-2'],
    },
  ];
}

export const initialUserProfile = {
  name: 'Alex Morgan',
  title: 'Product Engineer',
  email: 'alex.morgan@myschedule.app',
  avatarInitials: 'AM',
  avatarBg: '#1769FF',
};

export const initialSettings = {
  theme: 'light', // 'light', 'dark', 'oled', 'warm'
  colorCombinationId: 'electric-sapphire',
  accentColor: '#1769FF',
  weekStartsOnSunday: true,
  defaultCalendarView: 'month', // 'month', 'week', 'day'
  timeFormat: '12h', // '12h' or '24h'
  layoutComfort: 'comfortable', // 'comfortable' or 'compact'
  enableInAppNotifications: true,
  soundEffects: false,
};

export const initialNotifications = [
  {
    id: 'notif-1',
    title: 'Task Overdue',
    message: '"Pay Electricity Bill" was scheduled for today and is past due.',
    time: '20 mins ago',
    type: 'danger',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Upcoming Meeting',
    message: 'Project Architecture Sync starts in 45 minutes.',
    time: '45 mins ago',
    type: 'warning',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Goal Milestone Achieved',
    message: 'You completed 90% of "Finish Project Documentation"!',
    time: '2 hours ago',
    type: 'success',
    read: true,
  },
];

export function getInitialDailyReports() {
  const yesterday = getTodayDateString(-1);
  const twoDaysAgo = getTodayDateString(-2);

  return [
    {
      id: `report-${yesterday}`,
      date: yesterday,
      title: `Daily Work Report - ${yesterday}`,
      accomplishments:
        "• Submitted Engineering Lab Report with LaTeX measurement graphs and circuit schematics.\n• Conducted Client Sprint Sync meeting; reviewed frontend sprint deliverables.\n• Organized unit test suites and updated component documentation.",
      highlights: "Client sprint review went great. All milestone 2 objectives approved by stakeholders.",
      blockers: "None. Dependencies cleared on time.",
      tomorrowPlan:
        "• Work on Project frontend architecture and navigation styling.\n• Study VLSI CMOS delay equations and interconnect models.\n• Morning exercise routine.",
      hoursLogged: 7.5,
      rating: 5,
      mood: 'productive',
      tasksCompletedCount: 2,
      tasksTotalCount: 2,
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: `report-${twoDaysAgo}`,
      date: twoDaysAgo,
      title: `Daily Work Report - ${twoDaysAgo}`,
      accomplishments:
        "• Completed Digital Electronics Fundamentals chapter and logic gate simplification exercises.\n• Drafted component hierarchy for calendar grid and schedule views.",
      highlights: "Achieved 100% on the Digital Electronics goal milestone.",
      blockers: "Utility billing payment delay due to banking server maintenance.",
      tomorrowPlan:
        "• Submit Engineering Lab Report.\n• Prepare slide deck for Client Sprint Sync.",
      hoursLogged: 6.0,
      rating: 4,
      mood: 'ontrack',
      tasksCompletedCount: 1,
      tasksTotalCount: 2,
      submittedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
}

