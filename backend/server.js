import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://abobby-nwa-hotel-frontend.vercel.app',
  'https://abobby-nwa-hotel-frontend-3v5j.vercel.app',
  'https://abobby-nwa-hotel-frontend-x83e.onrender.com',
  process.env.FRONTEND_URL,
  process.env.RENDER_EXTERNAL_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com');

    if (isAllowed) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/admin-assets', express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/inventory', inventoryRoutes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-tabbed.html'));
});

app.get('/staff', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff-dashboard.html'));
});

app.get('/admin-clean', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-clean.html'));
});

app.get('/admin-old', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-core.js'));
});

app.get('/admin-core.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-core.js'));
});

app.get('/api/health', (req, res) => {
  res.json({
    message: '🏨 Abobby Hotel API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      rooms: '/api/rooms',
      bookings: '/api/bookings',
      payments: '/api/payments',
      contact: '/api/contact',
      staff: '/api/staff',
      expenses: '/api/expenses',
      inventory: '/api/inventory',
      admin: '/admin',
      staffPortal: '/staff'
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🏨 Welcome to Abobby Hotel API',
    status: 'healthy',
    endpoints: {
      api: '/api/health',
      admin: '/admin',
      staff: '/staff'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Uploaded file is too large. Please upload a smaller image.'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`Staff Portal: http://localhost:${PORT}/staff`);
  console.log(`API Health: http://localhost:${PORT}/api/health`);
});
