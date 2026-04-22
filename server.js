require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./backend/config/db');
const seedDefaultUsers = require('./backend/utils/seedDefaultUsers');
const { error } = require('./backend/utils/apiResponse');

const app = express();

const normalizeOriginValue = (value) => String(value).trim().replace(/\/$/, '');

const parseAllowedOrigins = () => [...new Set(
  [process.env.FRONTEND_URL || '', process.env.ALLOWED_ORIGINS || '']
    .flatMap((value) => String(value).split(','))
    .map(normalizeOriginValue)
    .filter(Boolean)
)];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const wildcardToRegex = (pattern) => new RegExp(
  `^${escapeRegex(pattern).replace(/\\\*/g, '.*')}$`,
  'i'
);

const isLocalDevOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(hostname);
  } catch {
    return false;
  }
};

const allowedOrigins = parseAllowedOrigins();
const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = String(origin).trim().replace(/\/$/, '');
    const hasMatch = allowedOrigins.some((allowedOrigin) => (
      allowedOrigin.includes('*')
        ? wildcardToRegex(allowedOrigin).test(normalizedOrigin)
        : allowedOrigin === normalizedOrigin
    ));

    if (
      !allowedOrigins.length ||
      hasMatch ||
      (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(normalizedOrigin))
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${normalizedOrigin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

connectDB()
  .then(() => seedDefaultUsers())
  .catch((err) => console.error('User seed error:', err.message));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Aabhushan backend is live',
    data: {
      status: 'ok',
      docsHint: 'Use /api/health to verify API availability'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API healthy',
    data: {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

app.use('/api/auth', require('./backend/routes/authRoutes'));
app.use('/api/customers', require('./backend/routes/customerRoutes'));
app.use('/api/raw-materials', require('./backend/routes/rawMaterialRoutes'));
app.use('/api/products', require('./backend/routes/productRoutes'));
app.use('/api/sales', require('./backend/routes/saleRoutes'));
app.use('/api/users', require('./backend/routes/userRoutes'));
app.use('/api/notifications', require('./backend/routes/notificationRoutes'));
app.use('/api/reports', require('./backend/routes/reportRoutes'));
app.use('/api/metal-rates', require('./backend/routes/metalRatesRoutes'));

try {
  app.use('/api/manufactoring', require('./backend/routes/manufactoringRoutes'));
} catch (err) {
  console.error('Manufactoring route error:', err.message);
}

app.use('*', (req, res) => error(res, 404, 'Route not found'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  error(res, 500, process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
