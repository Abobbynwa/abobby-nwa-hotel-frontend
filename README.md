# Abobby Nwa Hotel & Suites

Full-stack hotel booking application with a Vite React frontend, Express backend, PostgreSQL database, and Paystack payment flow.

## Project structure

```txt
.
├── src/                 # Vite React frontend
├── backend/             # Express API backend
├── backend/config       # PostgreSQL connection and init script
├── backend/database     # SQL schema and seed file
├── render.yaml          # Render backend deployment config
├── .env.example         # Frontend environment example
└── backend/.env.example # Backend environment example
```

## Frontend deployment

Recommended host: Vercel.

Frontend environment variable:

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

Frontend commands:

```bash
npm install
npm run build
```

## Backend deployment

Recommended host: Render.

The repo includes `render.yaml`, which deploys the backend from the `backend` folder.

Backend environment variables:

```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
FRONTEND_URL=https://your-frontend-url.vercel.app
PAYSTACK_SECRET_KEY=sk_live_or_test_xxxxxxxxxxxxx
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
```

Backend commands:

```bash
cd backend
npm install
npm run init-db
npm start
```

## Database setup

Recommended database: Neon PostgreSQL.

The backend connects through `DATABASE_URL` in `backend/config/db.js`.

You can initialize the database in either of these ways:

```bash
cd backend
npm run init-db
```

Or run the SQL file manually in your PostgreSQL console:

```txt
backend/database/schema.sql
```

The database setup creates:

```txt
users
rooms
bookings
```

It also seeds sample rooms for Standard, Deluxe, Executive, and Presidential categories.

## API endpoints

```txt
GET  /api/health
GET  /api/rooms
GET  /api/rooms/:id
POST /api/bookings
POST /api/payments/initialize
GET  /api/payments/verify/:reference
POST /api/contact
```

## Deployment flow

```txt
Frontend on Vercel
        ↓
VITE_API_BASE_URL
        ↓
Backend on Render
        ↓
Neon PostgreSQL + Paystack
```

## Important notes

Do not commit real secrets. Use `.env.example` files as templates only.

After the backend is deployed, copy the backend URL into Vercel as `VITE_API_BASE_URL` and redeploy the frontend.
