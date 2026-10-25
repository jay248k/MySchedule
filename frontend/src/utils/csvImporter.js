/**
 * CSV & JSON Bulk Import Utility for MySchedule
 * Handles parsing, validation, template generation, and download
 */

// Robust RFC 4180-compliant CSV parser
export function parseCSV(text) {
  if (!text || !text.trim()) return [];

  const lines = [];
  let row = [''];
  let inQuotes = false;
  let char = '';

  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push('');
    } else if (char === '\n' && !inQuotes) {
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }

  // Push last row if non-empty
  if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) {
    lines.push(row);
  }

  if (lines.length < 2) return [];

  const rawHeaders = lines[0].map((h) =>
    h.toLowerCase().trim().replace(/['"]/g, '').replace(/[\s-_]+/g, '')
  );

  const results = [];
  for (let r = 1; r < lines.length; r++) {
    const values = lines[r];
    // skip completely empty rows
    if (values.every((v) => !v || v.trim() === '')) continue;

    const entry = {};
    rawHeaders.forEach((header, idx) => {
      const val = values[idx] ? values[idx].trim() : '';
      entry[header] = val;
    });
    results.push(entry);
  }

  return results;
}

// Parse either CSV or JSON text
export function parseImportText(text, formatHint = 'auto') {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Check if it's JSON
  if (formatHint === 'json' || (formatHint === 'auto' && (trimmed.startsWith('[') || trimmed.startsWith('{')))) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.categories && Array.isArray(parsed.categories)) return parsed.categories;
      if (parsed.goals && Array.isArray(parsed.goals)) return parsed.goals;
      if (parsed.tasks && Array.isArray(parsed.tasks)) return parsed.tasks;
      if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
      if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
      return [parsed];
    } catch (e) {
      if (formatHint === 'json') throw new Error(`Invalid JSON format: ${e.message}`);
    }
  }

  return parseCSV(trimmed);
}

const todayStr = new Date().toISOString().split('T')[0];

// Templates definition
export const TEMPLATES = {
  categories: {
    headers: ['name', 'color', 'icon', 'description'],
    csv: `name,color,icon,description
Deep Work,#1769FF,Code,Focused programming and technical development
Health & Fitness,#10B981,Heart,Daily workouts and nutrition
Learning & Books,#F59E0B,BookOpen,Reading technical books and courses
Meetings & Syncs,#8B5CF6,Users,Sprint reviews and client calls
Personal & Admin,#EC4899,Smile,Personal finances and errands`,
    json: [
      {
        name: 'Deep Work',
        color: '#1769FF',
        icon: 'Code',
        description: 'Focused programming and technical development',
      },
      {
        name: 'Health & Fitness',
        color: '#10B981',
        icon: 'Heart',
        description: 'Daily workouts and nutrition',
      },
      {
        name: 'Learning & Books',
        color: '#F59E0B',
        icon: 'BookOpen',
        description: 'Reading technical books and courses',
      },
    ],
  },
  goals: {
    headers: ['title', 'targetDate', 'progress', 'status', 'category', 'description'],
    csv: `title,targetDate,progress,status,category,description
Launch Full-Stack Web App,2026-11-30,45,in-progress,Deep Work,Deploy completed frontend and backend services
Complete 10km Marathon,2026-12-15,60,in-progress,Health & Fitness,Cardio training and long runs
Master System Architecture,2026-12-31,20,in-progress,Learning & Books,Finish microservices design patterns`,
    json: [
      {
        title: 'Launch Full-Stack Web App',
        targetDate: '2026-11-30',
        progress: 45,
        status: 'in-progress',
        category: 'Deep Work',
        description: 'Deploy completed frontend and backend services',
      },
      {
        title: 'Complete 10km Marathon',
        targetDate: '2026-12-15',
        progress: 60,
        status: 'in-progress',
        category: 'Health & Fitness',
        description: 'Cardio training and long runs',
      },
    ],
  },
  tasks: {
    headers: ['title', 'date', 'startTime', 'endTime', 'category', 'goal', 'priority', 'status', 'description'],
    csv: `title,date,startTime,endTime,category,goal,priority,status,description
Architecture Review & Planning,${todayStr},09:00,10:30,Deep Work,Launch Full-Stack Web App,High,pending,Review database schemas and endpoints
Daily Standup & Sync,${todayStr},11:00,11:30,Meetings & Syncs,,Medium,pending,Discuss blockers and daily commitments
Implement Bulk Import UI,${todayStr},13:30,15:30,Deep Work,Launch Full-Stack Web App,High,in-progress,Add modal and CSV/JSON drag and drop
Evening Gym Workout,${todayStr},18:00,19:15,Health & Fitness,Complete 10km Marathon,Medium,pending,Leg day and cardio warmup`,
    json: [
      {
        title: 'Architecture Review & Planning',
        date: todayStr,
        startTime: '09:00',
        endTime: '10:30',
        category: 'Deep Work',
        goal: 'Launch Full-Stack Web App',
        priority: 'High',
        status: 'pending',
        description: 'Review database schemas and endpoints',
      },
      {
        title: 'Daily Standup & Sync',
        date: todayStr,
        startTime: '11:00',
        endTime: '11:30',
        category: 'Meetings & Syncs',
        goal: '',
        priority: 'Medium',
        status: 'pending',
        description: 'Discuss blockers and daily commitments',
      },
    ],
  },
};

// Download template file trigger
export function downloadTemplate(type, format = 'csv') {
  const config = TEMPLATES[type];
  if (!config) return;

  let content = '';
  let mimeType = '';
  let filename = `myschedule_${type}_template.${format}`;

  if (format === 'json') {
    content = JSON.stringify(config.json, null, 2);
    mimeType = 'application/json';
  } else {
    content = config.csv;
    mimeType = 'text/csv;charset=utf-8;';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Normalization & Validation Helper
export function validateAndPrepareImport(type, rawRows, context = {}) {
  const { categories = [], goals = [] } = context;
  const todayStr = new Date().toISOString().split('T')[0];

  const categoryMap = new Map();
  categories.forEach((c) => {
    categoryMap.set(c.name.toLowerCase().trim(), c.id);
    categoryMap.set(c.id, c.id);
  });

  const goalMap = new Map();
  goals.forEach((g) => {
    goalMap.set(g.title.toLowerCase().trim(), g.id);
    goalMap.set(g.id, g.id);
  });

  const validItems = [];
  const invalidItems = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;
    const errors = [];

    // Clean keys: normalize standard keys
    const item = {};
    Object.keys(row).forEach((k) => {
      const cleanKey = k.toLowerCase().replace(/[\s-_]+/g, '');
      item[cleanKey] = row[k];
    });

    if (type === 'categories') {
      const name = item.name || item.title || item.categoryname || '';
      if (!name.trim()) {
        errors.push('Category Name is required');
      }

      let color = item.color || item.colour || '#1769FF';
      if (!color.startsWith('#')) {
        color = `#${color}`;
      }
      if (!/^#[0-9A-Fa-f]{3,8}$/.test(color)) {
        color = '#1769FF';
      }

      const icon = item.icon || 'Tag';
      const description = item.description || item.desc || '';

      const validRecord = {
        name: name.trim(),
        color,
        icon,
        description: description.trim() || null,
      };

      if (errors.length > 0) {
        invalidItems.push({ rowNum, raw: row, errors });
      } else {
        validItems.push(validRecord);
      }
    } else if (type === 'goals') {
      const title = item.title || item.name || item.goaltitle || '';
      if (!title.trim()) {
        errors.push('Goal Title is required');
      }

      let targetDate = item.targetdate || item.date || item.duedate || '';
      if (!targetDate) {
        // Default to 30 days from today
        const d = new Date();
        d.setDate(d.getDate() + 30);
        targetDate = d.toISOString().split('T')[0];
      }

      const progressVal = Number(item.progress ?? 0);
      const progress = isNaN(progressVal) ? 0 : Math.min(100, Math.max(0, Math.round(progressVal)));

      let status = (item.status || '').toLowerCase().trim();
      if (!['in-progress', 'completed', 'behind'].includes(status)) {
        status = progress >= 100 ? 'completed' : 'in-progress';
      }

      const category = item.category || item.categoryname || null;
      const description = item.description || item.desc || '';

      const validRecord = {
        title: title.trim(),
        targetDate,
        progress,
        status,
        category: category ? String(category).trim() : null,
        description: description.trim() || null,
        relatedTaskIds: [],
      };

      if (errors.length > 0) {
        invalidItems.push({ rowNum, raw: row, errors });
      } else {
        validItems.push(validRecord);
      }
    } else if (type === 'tasks') {
      const title = item.title || item.taskname || item.name || '';
      if (!title.trim()) {
        errors.push('Task Title is required');
      }

      let date = item.date || item.taskdate || item.duedate || todayStr;
      // Simple date normalization
      if (date && date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) {
          // If YYYY/MM/DD
          if (parts[0].length === 4) {
            date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else {
            // Assume MM/DD/YYYY or DD/MM/YYYY
            date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }
      }

      // Priority normalization
      let priority = 'Medium';
      const rawPriority = String(item.priority || '').toLowerCase();
      if (rawPriority.includes('hi')) priority = 'High';
      else if (rawPriority.includes('lo')) priority = 'Low';

      // Status normalization
      let status = 'pending';
      const rawStatus = String(item.status || '').toLowerCase().trim();
      if (rawStatus === 'completed' || rawStatus === 'done' || rawStatus === 'true') {
        status = 'completed';
      } else if (rawStatus === 'in-progress' || rawStatus === 'working') {
        status = 'in-progress';
      } else if (rawStatus === 'overdue') {
        status = 'overdue';
      }

      // Time formatting (HH:mm)
      const formatTime = (t) => {
        if (!t) return null;
        const str = String(t).trim();
        if (/^\d{1,2}:\d{2}$/.test(str)) {
          const [h, m] = str.split(':');
          return `${h.padStart(2, '0')}:${m}`;
        }
        return str;
      };

      const startTime = formatTime(item.starttime || item.start || '09:00');
      const endTime = formatTime(item.endtime || item.end || '10:00');

      // Resolve category
      let categoryId = item.categoryid || null;
      const catKey = String(item.category || item.categoryname || '').toLowerCase().trim();
      if (!categoryId && catKey && categoryMap.has(catKey)) {
        categoryId = categoryMap.get(catKey);
      }
      if (!categoryId && categories.length > 0) {
        categoryId = categories[0].id;
      }

      // Resolve goal
      let goalId = item.goalid || null;
      const goalKey = String(item.goal || item.goaltitle || '').toLowerCase().trim();
      if (!goalId && goalKey && goalMap.has(goalKey)) {
        goalId = goalMap.get(goalKey);
      }

      const description = item.description || item.desc || '';

      const validRecord = {
        title: title.trim(),
        date,
        startTime,
        endTime,
        categoryId,
        goalId,
        priority,
        status,
        description: description.trim() || null,
      };

      if (errors.length > 0) {
        invalidItems.push({ rowNum, raw: row, errors });
      } else {
        validItems.push(validRecord);
      }
    }
  });

  return {
    validItems,
    invalidItems,
    total: rawRows.length,
    validCount: validItems.length,
    invalidCount: invalidItems.length,
  };
}
