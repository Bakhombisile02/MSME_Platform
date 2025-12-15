# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for the Eswatini MSME (Micro, Small, and Medium Enterprises) Platform - a comprehensive solution for managing and showcasing MSME businesses in Eswatini. The platform consists of three main applications:

1. **MSME-Backend**: REST API backend (Node.js/Express/Sequelize/MySQL)
2. **MSME-Website-Frontend**: Public-facing website (Next.js 14 App Router)
3. **MSME-CMS-Frontend**: Admin panel (React + Vite)

## Repository Structure

```
MSME_Site/
├── MSME-Backend/              # Backend API server
├── MSME-Website-Frontend/     # Public website
└── MSME-CMS-Frontend/         # Admin CMS panel
```

## Development Commands

### Backend (MSME-Backend)

```bash
cd MSME-Backend

# Initial setup
npm install
cp .env.example .env
# Edit .env with your configuration

# Create database
mysql -u root -p
CREATE DATABASE msme_db;

# Development
npm start           # Start server (port 3001)
npm run dev        # Start with nodemon (auto-restart)

# Database migrations
npx sequelize-cli db:migrate
```

### Website Frontend (MSME-Website-Frontend)

```bash
cd MSME-Website-Frontend

# Initial setup
npm install
cp .env.example .env
# Edit .env with API URL

# Development
npm run dev        # Start dev server with Turbopack (port 3000)

# Production
npm run build      # Build for production
npm run start      # Start production server

# Linting
npm run lint
```

### CMS Frontend (MSME-CMS-Frontend)

```bash
cd MSME-CMS-Frontend

# Initial setup
npm install
cp .env.example .env
# Edit .env with API URL

# Development
npm run dev        # Start Vite dev server

# Production
npm run build      # Build for production (outputs to dist/)
npm run preview    # Preview production build

# Linting
npm run lint
```

## Architecture & Key Patterns

### Backend Architecture (MSME-Backend)

The backend follows a layered MVC-style architecture:

- **Entry Point**: `server.js` creates HTTP server → `app.js` configures Express app
- **Routing Layer**: `routers/` - Express route definitions (admin.js, blog.js, msmeBusiness.js, etc.)
- **Controller Layer**: `controllers/` - Request/response handling and validation
- **Service Layer**: `services/BaseRepository.js` - Reusable CRUD operations abstracted from Sequelize
- **Model Layer**: `models/` - Sequelize ORM models (AdminModel.js, MSMEBusinessModel.js, etc.)
- **Middleware**: `middelware/` - Authentication (`auth.middelware.js`) and error handling (`errorHandler.middelware.js`)
- **Email System**: `mailer/` - Nodemailer templates and sender
- **File Uploads**: `public/` - Static file serving and upload directory

**Key Backend Features**:
- **BaseRepository Pattern**: All models use `services/BaseRepository.js` for consistent CRUD operations (baseCreate, baseList, baseUpdate, baseDelete, etc.)
- **Error Monitoring**: Global error handler in `middelware/errorHandler.middelware.js` automatically sends detailed error emails to admins (configurable via `ADMIN_ERROR_EMAILS`)
- **Rate-Limited Notifications**: Error emails are rate-limited (default: 15 minutes) to prevent spam
- **CORS Configuration**: Development allows localhost:5173 (CMS) and localhost:3000 (Website); production handled by Nginx
- **JWT Authentication**: Used for admin authentication
- **File Upload Handling**: Multer for file uploads, served from `public/` directory

### Website Frontend Architecture (MSME-Website-Frontend)

Next.js 14 App Router architecture:

- **App Directory**: `src/app/` - File-based routing with Next.js App Router
  - `layout.js` - Root layout with Header, Footer, and AuthProvider
  - `page.js` - Home page
  - Route folders: `/about`, `/categories`, `/service-providers`, `/blog`, `/faq`, `/contact`, `/feedback`, `/add-business`, `/login`, `/admin-login`, `/forget-password`
- **Components**: `src/components/` - Reusable React components
  - `layout/` - Header, Footer components
  - `home/` - Homepage-specific components
  - `auth/` - Authentication components
  - `addBusiness/` - Business registration form components
  - `detailsPage/` - Business detail view components
- **API Layer**: `src/apis/` - Axios-based API service modules
  - `auth-api.js`, `admin-auth-api.js` - Authentication
  - `article-api.js`, `lists-api.js` - Content fetching
  - `business-category-api.js`, `service-provider-api.js` - Business data
  - `add-business-api.js` - Business registration
  - `contact-api.js`, `subscribe-api.js` - User interactions
  - `forget-password-api.js` - Password reset
- **Context**: `src/context/AuthContext.js` - Global authentication state (userId, userType, isLoggedIn)
- **Utils**: `src/utils/` - Shared utilities including axios instance configuration
- **Styling**: Tailwind CSS 4 with Montserrat font (Google Fonts)

**Key Frontend Features**:
- **App Router**: Uses Next.js 14 App Router (not Pages Router)
- **AuthContext**: Manages user authentication state (token, userId, userType) via localStorage
- **Turbopack**: Fast development builds
- **Image Optimization**: Next.js Image component for optimized images
- **Toast Notifications**: react-hot-toast for user feedback
- **Framer Motion**: Animation library
- **Google Maps Integration**: @react-google-maps/api for location features
- **Social Sharing**: react-share for blog/article sharing

### CMS Frontend Architecture (MSME-CMS-Frontend)

React + Vite SPA with protected routes:

- **Entry Point**: `src/App.jsx` - React Router setup with ProtectedLayout
- **Pages**: `src/pages/` - Page components for each admin section
  - `dashboard/` - Analytics dashboard
  - `login/` - Admin authentication
  - `register-users/` - Registered users management
  - `msme-business/` - MSME business approval/management
  - `business-categories/`, `business-sub-categories/` - Category management
  - `service-provider/`, `service-provider-categories/` - Service provider management
  - `article/` - Blog post management
  - `faq/`, `banners/`, `team-member/`, `partners/` - Content management
  - `contact-us/`, `feedback-received/`, `subscribers/` - User interactions
  - `download-new/` - Downloadable documents management
- **Components**: `src/components/` - Organized by feature
  - `layout/` - Protected layout with auth guard
  - Feature-specific folders: `msme-business/`, `article/`, `faq/`, etc.
- **API Layer**: `src/api/` - Axios-based service modules matching backend routes
  - `auth-user.js` - Admin authentication
  - `msme-business.js`, `business-category.js`, `business-sub-category.js`
  - `service-provider.js`, `service-category.js`
  - `article.js`, `banner.js`, `faq.js`, `team-member.js`, `partners.js`
  - `dashboard.js` - Dashboard statistics
  - `download-new.js`, `user-lists.js`, `incident-reported.js`
- **Utils**: `src/utils/` - Shared utilities
  - `axios.js` - Axios instance with auth interceptors
  - `exports/` - Excel export utilities (using xlsx library)
- **Styling**: Tailwind CSS 3 with custom components

**Key CMS Features**:
- **Protected Routes**: ProtectedLayout component guards all admin routes
- **Token-Based Auth**: JWT stored in localStorage, auto-attached to requests via axios interceptors
- **Rich Text Editor**: react-quill-new for blog post editing
- **Charts**: chart.js + react-chartjs-2 for dashboard analytics
- **Excel Export**: file-saver + xlsx for data exports
- **SweetAlert2**: Modal dialogs for confirmations and alerts
- **SVG Support**: vite-plugin-svgr for importing SVGs as React components

## Data Flow Architecture

### Authentication Flow
1. **User Login** (Website): POST `/api/msme-business/login` → stores token/userId/userType in localStorage → AuthContext updates
2. **Admin Login** (CMS): POST `/api/admin/login` → stores authToken in localStorage → axios default header set
3. **Backend Validation**: `middelware/auth.middelware.js` validates JWT tokens on protected routes

### Business Registration Flow
1. User fills form on Website (`/add-business`)
2. POST to `/api/msme-business/add` with business details, owner info, directors info
3. Backend creates MSMEBusiness, BusinessOwner, and DirectorsInfo records
4. Admin reviews in CMS (`/msme-business`)
5. Admin approves/rejects → updates business status
6. Approved businesses appear in public listings

### Content Management Flow
1. Admin creates/edits content in CMS (blog posts, FAQs, team members, etc.)
2. CMS sends POST/PUT requests to backend API
3. Backend stores in MySQL via Sequelize models
4. Website fetches content via GET requests
5. Next.js renders content with SSR/SSG where applicable

### Error Notification Flow
1. Unhandled error occurs in backend
2. `middelware/errorHandler.middelware.js` catches error
3. `services/errorNotificationService.js` prepares email with error details, stack trace, request info
4. Email sent to admins listed in `ADMIN_ERROR_EMAILS` (rate-limited to prevent spam)
5. Error response sent to client

## Environment Variables

### Backend (.env)
```env
APP=dev
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001

DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=msme_db
DB_USER=root
DB_PASSWORD=

# Normal app emails
MAIL_HOST=gmail
MAIL_PORT=465
MAIL_SECURE=true
MAIL_AUTH_USER=your_email@gmail.com
MAIL_AUTH_PW=your_gmail_app_password
MAIL_FROM_STRING="MSME Platform <your_email@gmail.com>"

# Admin error notifications
ADMIN_MAIL_AUTH_USER=your_email@gmail.com
ADMIN_MAIL_AUTH_PW=your_gmail_app_password
ADMIN_ERROR_EMAILS=admin1@example.com,admin2@example.com
ERROR_NOTIFICATION_RATE_LIMIT_MINUTES=15

EMAIL_SECRET=your_email_secret_here
```

### Website Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_IMG_BASE_URL=http://localhost:3001
```

### CMS Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_DOCS_URL=http://localhost:3001/docs
```

## Database Schema Key Models

- **AdminModel**: Admin users with JWT authentication
- **MSMEBusinessModel**: Core business records with approval status
- **BusinessOwnersModel**: Business owner information (linked to MSME)
- **DirectorsInfoModel**: Directors/stakeholders (linked to MSME)
- **BusinessCategoriesModel** + **BusinessSubCategoriesModel**: Hierarchical categorization
- **ServiceProviderCategoriesModel** + **ServiceProvidersModel**: Service providers directory
- **BlogModel**: Blog posts and articles
- **FAQModel**: Frequently asked questions
- **TeamModel**: Team member profiles
- **PartnersLogoModel**: Partner logos for display
- **HomeBannerModel**: Homepage banner carousel
- **DownloadModel**: Downloadable documents
- **ContactUsModel**: Contact form submissions
- **FeedbackModel**: User feedback submissions
- **SubscribeModel**: Newsletter subscriptions

Models use Sequelize associations (belongsTo, hasMany) to define relationships.

## Key Implementation Details

### Backend BaseRepository Pattern
All controllers use `services/BaseRepository.js` functions for database operations:
- `baseCreate(model, data)` - Create new record
- `baseList(model, searchParams, options)` - List with filtering/pagination
- `baseUpdate(model, data, condition)` - Update records
- `baseDelete(model, condition)` - Soft delete
- `baseFindById(model, id)` - Find by ID
- Custom functions: `getMSMEDataAccordingToCategory`, `getServiceProviderDataAccordingToCategory`, etc.

### Error Handler Middleware
Located at `middelware/errorHandler.middelware.js`:
- Catches all errors via `app.use(errorHandler)`
- Automatically redacts sensitive data (passwords, tokens)
- Sends detailed email to `ADMIN_ERROR_EMAILS`
- Rate-limited to prevent email spam (configurable via `ERROR_NOTIFICATION_RATE_LIMIT_MINUTES`)
- Provides different responses for production vs development

### Website Axios Instance
Located at `src/utils/axios-instanse.js`:
- Configured with `NEXT_PUBLIC_API_URL` base URL
- Automatically attaches auth token from localStorage
- Used by all API service modules in `src/apis/`

### CMS Axios Instance
Located at `src/utils/axios.js`:
- Configured with `VITE_API_URL` base URL
- Interceptors attach authToken from localStorage
- Request interceptor: adds Authorization header
- Response interceptor: handles token expiration (redirects to /login)

## Deployment Notes

### Backend Deployment
- Set `NODE_ENV=production`
- Configure production database credentials
- Use process manager (PM2 recommended): `pm2 start server.js --name msme-backend`
- Nginx handles CORS in production (CORS middleware disabled in production mode)
- Gmail has 500 emails/day limit - consider SendGrid/AWS SES for production error notifications

### Website Frontend Deployment
- Deploy to Vercel (recommended): `vercel`
- Set production environment variables in Vercel dashboard
- Automatic SSR/SSG optimization by Next.js

### CMS Frontend Deployment
- Build: `npm run build` (outputs to `dist/`)
- Deploy `dist/` folder to static hosting (Vercel, Netlify, etc.)
- Configure environment variables in hosting platform

## Common Workflows

### Adding a New API Endpoint
1. Create model in `MSME-Backend/models/` (if needed)
2. Create router in `MSME-Backend/routers/`
3. Create controller in `MSME-Backend/controllers/`
4. Register router in `app.js`
5. Add API function in frontend API layer (`MSME-Website-Frontend/src/apis/` or `MSME-CMS-Frontend/src/api/`)
6. Use API function in components

### Adding a New CMS Page
1. Create page component in `MSME-CMS-Frontend/src/pages/[feature-name]/`
2. Create child components in `MSME-CMS-Frontend/src/components/[feature-name]/`
3. Add API service in `MSME-CMS-Frontend/src/api/`
4. Add route in `MSME-CMS-Frontend/src/App.jsx` within ProtectedLayout
5. Add navigation link in layout component (if needed)

### Adding a New Website Page
1. Create folder in `MSME-Website-Frontend/src/app/[page-name]/`
2. Add `page.js` (route component) and optional `layout.js`
3. Create components in `MSME-Website-Frontend/src/components/`
4. Add API calls in `MSME-Website-Frontend/src/apis/`
5. Update navigation in `src/components/layout/Header.js` (if needed)

## Development Tips

### Backend
- Use `npm run dev` with nodemon for auto-restart during development
- Check `ERROR_NOTIFICATION_GUIDE.md` for error monitoring setup details
- Use BaseRepository functions consistently instead of raw Sequelize queries
- File uploads are stored in `public/` and served as static files

### Website Frontend
- Next.js App Router uses `"use client"` directive for client components
- AuthContext must be accessed inside client components only
- Use `NEXT_PUBLIC_` prefix for environment variables accessible in browser
- Images should use Next.js Image component for optimization
- API calls in `src/apis/` modules handle axios instance configuration

### CMS Frontend
- All routes except `/login` require authentication via ProtectedLayout
- Axios interceptors automatically handle token attachment and expiration
- Use SweetAlert2 for confirmations: `Swal.fire({...})`
- Excel exports use xlsx + file-saver: see `src/utils/exports/`
- Vite environment variables use `VITE_` prefix

## Troubleshooting

### Database Connection Errors
```bash
# Check MySQL is running
systemctl status mysql  # Linux
brew services list       # macOS

# Verify database exists
mysql -u root -p
SHOW DATABASES;
```

### Port Already in Use
```bash
# Find and kill process on port 3001 (backend)
lsof -i :3001
kill -9 <PID>

# Find and kill process on port 3000 (website)
lsof -i :3000
kill -9 <PID>
```

### Email Not Sending
- Check Gmail app password is correct (not regular password)
- Verify 2-Step Verification is enabled on Gmail account
- Gmail has 500 emails/day limit
- See `MSME-Backend/EMAIL_ACCOUNTS_SUMMARY.md` for details

### CORS Issues
- Development: Ensure backend CORS allows localhost:3000 and localhost:5173
- Production: CORS should be handled by Nginx, Express CORS is disabled

### Authentication Issues
- Check token exists in localStorage (key: `token` for Website, `authToken` for CMS)
- Verify JWT_SECRET matches between backend and client
- Check token expiration
- Ensure Authorization header is being sent: `Bearer <token>`
