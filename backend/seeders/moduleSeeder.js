require('dotenv').config();
const db = require('../models');

const sampleThoughts = [
  {
    id: 'thought-1',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'Motivation',
    tags: 'perseverance,courage',
    isFavorite: true,
  },
  {
    id: 'thought-2',
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    category: 'Productivity',
    tags: 'focus,action',
    isFavorite: true,
  },
  {
    id: 'thought-3',
    text: 'Small daily improvements over time lead to stunning results.',
    author: 'Robin Sharma',
    category: 'Consistency',
    tags: 'habits,growth',
    isFavorite: false,
  },
];

const sampleKnowledge = [
  {
    id: 'know-folder-react',
    title: 'React Fundamentals',
    type: 'folder',
    parentId: null,
    content: 'Complete React engineering topics, hooks, performance, and state management.',
    orderIndex: 1,
    icon: 'Folder',
    color: '#3B82F6',
    tags: 'frontend,react,javascript',
  },
  {
    id: 'know-lesson-hooks',
    title: 'Core Hooks & Rules',
    type: 'lesson',
    parentId: 'know-folder-react',
    content: `# React Hooks: In-Depth Guide

### 1. useState
Manages local component state:
\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

### 2. useEffect
Handles side-effects like data fetching, subscriptions, and DOM updates:
\`\`\`javascript
useEffect(() => {
  const timer = setInterval(() => tick(), 1000);
  return () => clearInterval(timer);
}, []);
\`\`\`

### 3. useCallback & useMemo
Optimizes rendering performance by memoizing callbacks and calculated values.
`,
    orderIndex: 1,
    icon: 'FileText',
    color: '#06B6D4',
    tags: 'react,hooks,state',
  },
  {
    id: 'know-subfolder-advanced',
    title: 'Advanced Architecture',
    type: 'folder',
    parentId: 'know-folder-react',
    content: 'Subfolder for design patterns, concurrency, and custom hooks.',
    orderIndex: 2,
    icon: 'Folder',
    color: '#8B5CF6',
    tags: 'architecture,patterns',
  },
  {
    id: 'know-table-roadmap',
    title: 'React 19 Feature Sequence',
    type: 'table',
    parentId: 'know-subfolder-advanced',
    content: JSON.stringify({
      columns: [
        { key: 'seq', label: 'Seq #', type: 'number' },
        { key: 'feature', label: 'Feature Name', type: 'text' },
        { key: 'status', label: 'Status', type: 'badge' },
        { key: 'priority', label: 'Priority', type: 'badge' },
        { key: 'notes', label: 'Notes', type: 'text' },
      ],
      rows: [
        { seq: 1, feature: 'React Server Actions', status: 'Stable', priority: 'High', notes: 'Native form & async mutations' },
        { seq: 2, feature: 'useActionState hook', status: 'Stable', priority: 'High', notes: 'Tracks pending and action status' },
        { seq: 3, feature: 'Asset Loading (Scripts, Styles)', status: 'Active', priority: 'Medium', notes: 'Preload in component body' },
        { seq: 4, feature: 'Document Metadata (title, meta)', status: 'Stable', priority: 'Medium', notes: 'Hoists to head tag natively' },
      ],
    }),
    orderIndex: 1,
    icon: 'Table',
    color: '#10B981',
    tags: 'react19,roadmap,table',
  },
];

const seedNewModules = async () => {
  try {
    console.log('🌱 Checking Thoughts and Knowledge Items tables...');

    const thoughtCount = await db.Thought.count();
    if (thoughtCount === 0) {
      console.log('📝 Seeding initial thoughts...');
      await db.Thought.bulkCreate(sampleThoughts);
      console.log(`✅ Seeded ${sampleThoughts.length} initial thoughts.`);
    } else {
      console.log(`ℹ️ Thoughts table already has ${thoughtCount} records.`);
    }

    const knowledgeCount = await db.KnowledgeItem.count();
    if (knowledgeCount === 0) {
      console.log('📚 Seeding initial knowledge base (folders, lessons, tables)...');
      // Create root items first, then nested items
      for (const item of sampleKnowledge) {
        await db.KnowledgeItem.create(item);
      }
      console.log(`✅ Seeded ${sampleKnowledge.length} knowledge items.`);
    } else {
      console.log(`ℹ️ KnowledgeItems table already has ${knowledgeCount} records.`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error seeding new modules:', error);
    return false;
  }
};

if (require.main === module) {
  seedNewModules()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedNewModules };
