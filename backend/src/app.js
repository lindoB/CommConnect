require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

app.use(helmet());
app.use(compression());

const allowedOrigins = (
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173,https://comm-connect.vercel.app'
)
  .split(',')
  .map(origin => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from tools like Postman and server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan(
      process.env.NODE_ENV === 'production'
        ? 'combined'
        : 'dev'
    )
  );
}

app.use(
  '/api/auth/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many sign-in attempts. Please try again later.'
    }
  })
);

app.use(
  '/api/auth/register',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many registration attempts. Please try again later.'
    }
  })
);

app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/audit-logs', require('./routes/auditLogs'));

app.use(notFound);
app.use(errorHandler);

app.getDatabaseReady = () => mongoose.connection.readyState === 1;

module.exports = app;
