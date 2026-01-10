/**
 * Express API Application
 * 
 * Sets up Express with all middleware and routes.
 * Similar structure to MSME-Backend/app.js
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { sanitizeBody, sanitizeQuery } from './middleware/validation.middleware';

// Create Express app
export const app = express();

// =============================================================================
// MIDDLEWARE
// =============================================================================

// CORS - Allow Firebase Hosting domains and localhost for development
const allowedOrigins = [
  'https://msmesite-53367.web.app',
  'https://msmesite-53367.firebaseapp.com',
  'https://msmesite-53367-d3611.web.app',
  'https://msmesite-53367-d3611.firebaseapp.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow any Firebase hosting preview URLs
    if (origin.includes('.web.app') || origin.includes('.firebaseapp.com')) {
      return callback(null, true);
    }
    // Block disallowed origins - log for diagnostics and deny without error
    console.warn(`CORS: Denied request from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// XSS Sanitization
app.use(sanitizeBody);
app.use(sanitizeQuery);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MSME Platform API (Firebase)',
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// ROUTES
// =============================================================================

import adminRouter from './routes/admin.routes';
import msmeBusinessRouter from './routes/msmeBusiness.routes';
import businessCategoryRouter from './routes/businessCategory.routes';
import serviceProviderRouter from './routes/serviceProvider.routes';
import contentRouter from './routes/content.routes';
import helpdeskRouter from './routes/helpdesk.routes';
import dashboardRouter from './routes/dashboard.routes';
import uploadRouter from './routes/upload.routes';

// Mount routes (no /api prefix - the Cloud Function URL already includes /api)
app.use('/admin', adminRouter);
app.use('/msme-business', msmeBusinessRouter);
app.use('/business-category', businessCategoryRouter);
app.use('/business-sub-category', businessCategoryRouter); // Same router handles subcategories
app.use('/service-providers', serviceProviderRouter);
app.use('/service-provider-category', serviceProviderRouter);
app.use('/faq', contentRouter);
app.use('/blog', contentRouter);
app.use('/home-banner', contentRouter);
app.use('/downloads', contentRouter);
app.use('/partners-logo', contentRouter);
app.use('/team', contentRouter);
app.use('/subscribe', contentRouter);
app.use('/feedback', contentRouter);
app.use('/contact', helpdeskRouter);
app.use('/helpdesk', helpdeskRouter);
app.use('/dashboard', dashboardRouter);
app.use('/upload', uploadRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(500).json({ error: message });
});
