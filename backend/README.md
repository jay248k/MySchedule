# MySchedule Express & Sequelize Backend

Production-ready backend built with **Node.js, Express, Sequelize ORM, and Neon Serverless PostgreSQL**.

---

## 🚀 Features

- **Express.js API**: Modular architecture with routes, controllers, and middlewares.
- **Neon PostgreSQL**: Serverless PostgreSQL with SSL connection pooling.
- **Sequelize ORM**: Full models for Categories, Tasks, Events, Goals, Daily Reports, Notifications, Settings, and User Profiles.
- **Migrations**: Standard Sequelize migrations in `/migrations` for schema versioning.
- **Auto-Seeding**: Automatically seeds initial categories, tasks, goals, and settings when tables are empty.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Your `.env` is already configured with your Neon database URL:
```env
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_gjp3UbVuT0rQ@ep-little-heart-b5fmqxzj-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Run Migrations
Run the migrations to create all database tables in Neon:
```bash
npm run migrate
```

### 4. Seed Database (Optional / Automatic)
Populate initial demo data:
```bash
npm run seed
```

### 5. Start the Server
Development with nodemon:
```bash
npm run dev
```

Production:
```bash
npm start
```

---

## 📡 API Endpoints

| Resource | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/api/health` | Server uptime & status |
| **DB Status** | `GET` | `/api/db-status` | Neon database connection test |
| **Categories** | `GET, POST` | `/api/categories` | List / Create categories |
| | `GET, PUT, DELETE`| `/api/categories/:id` | Read / Update / Delete category |
| **Tasks** | `GET, POST` | `/api/tasks` | List (with filters) / Create tasks |
| | `GET, PUT, DELETE`| `/api/tasks/:id` | Read / Update / Delete task |
| | `PATCH` | `/api/tasks/:id/toggle-complete` | Toggle task completion |
| **Events** | `GET, POST` | `/api/events` | List / Create calendar events |
| | `GET, PUT, DELETE`| `/api/events/:id` | Read / Update / Delete event |
| **Goals** | `GET, POST` | `/api/goals` | List / Create goals |
| | `GET, PUT, DELETE`| `/api/goals/:id` | Read / Update / Delete goal |
| **Reports** | `GET, POST` | `/api/reports` | List / Save daily reports |
| | `GET, DELETE` | `/api/reports/:date` | Get / Delete report for date |
| **Notifications** | `GET` | `/api/notifications` | List notifications |
| | `PATCH` | `/api/notifications/mark-all-read` | Mark all notifications read |
| **Settings** | `GET, PUT` | `/api/settings` | Get / Update user settings |
| **User Profile**| `GET, PUT` | `/api/user` | Get / Update user profile |
