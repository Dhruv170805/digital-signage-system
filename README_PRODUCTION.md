# Nexus Digital Signage - Production Edition

This is a refactored, production-ready version of the Digital Signage System, built with **Node.js, Express, MSSQL (Prisma), and React (Zustand)**.

## Key Upgrades
1. **Clean Architecture:** Strict separation of Controllers, Services, and Repositories.
2. **MSSQL + Prisma:** Type-safe, relational database schema with migrations.
3. **Dynamic Engine:** No hardcoded layouts, styles, or schedules. Everything is DB-driven.
4. **Absolute Coordinate Builder:** Drag-and-resize template engine for pixel-perfect displays.
5. **Real-Time Sync:** Socket.io pushes updates to screens instantly.
6. **Global Error Handling:** All errors are logged to the DB and sanitized for the frontend.
7. **Production Display:** Optimized rendering of multiple concurrent frames (Video, PDF, Image).

## Setup Instructions

### 1. Database Setup
1. Ensure you have an MSSQL instance running.
2. Configure your `DATABASE_URL` in `server/.env`:
   `DATABASE_URL="sqlserver://localhost:1433;database=nexus_signage;user=sa;password=Password123;trustServerCertificate=true"`

### 2. Backend Installation
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm start
```

### 3. Frontend Installation
```bash
cd client
npm install
npm run dev
```

## Environment Variables (.env)

### Server
* `PORT`: Server port (default 5000)
* `DATABASE_URL`: MSSQL connection string
* `JWT_SECRET`: Secret for token signing
* `ADMIN_EMAIL`: Default admin email
* `ADMIN_PASSWORD`: Default admin password

### Client
* `VITE_API_URL`: Backend API URL
* `VITE_SOCKET_URL`: WebSocket URL
* `VITE_UPLOAD_URL`: Base URL for media assets

## Architecture Overview
* **Backend:** `/server/src` follows the Clean Architecture pattern.
* **Database:** `/server/prisma/schema.prisma` defines the relational models.
* **Frontend State:** `/client/src/store` uses Zustand for lightweight, reactive state management.
* **Display Engine:** `/client/src/pages/ProductionDisplay.jsx` renders dynamic content using absolute positioning.
