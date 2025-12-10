import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL || '*'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for admin dashboard
app.use('/admin-assets', express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// Admin Dashboard Route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve admin.js
app.get('/admin.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.js'));
});

// Health check
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
      admin: '/admin'
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '🏨 Welcome to Abobby Hotel API',
    status: 'healthy',
    endpoints: {
      api: '/api/health',
      admin: '/admin',
      docs: 'https://github.com/yourusername/abobby-hotel-backend'
    }
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🌐 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔌 API Base: http://localhost:${PORT}/api`);
});