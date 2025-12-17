# MSME Platform - Eswatini

A comprehensive platform for managing and showcasing Micro, Small, and Medium Enterprises (MSMEs) in Eswatini.

## 🏗️ Project Structure

This is a **monorepo** with three interconnected applications:

| Application | Tech Stack | Port | Purpose |
|-------------|-----------|------|---------|
| `MSME-Backend/` | Node.js + Express + Sequelize + MySQL | 3001 | REST API |
| `MSME-Website-Frontend/` | Next.js 15 (App Router) + Tailwind | 3000 | Public website |
| `MSME-CMS-Frontend/` | React 19 + Vite + Tailwind | 5173 | Admin panel |

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **MySQL** v5.7 or higher
- **npm** v9 or higher

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd MSME_Site

# Install dependencies for all applications
cd MSME-Backend && npm install && cd ..
cd MSME-Website-Frontend && npm install && cd ..
cd MSME-CMS-Frontend && npm install && cd ..
```

### 2. Configure Environment Variables

#### Backend (.env)
```bash
cd MSME-Backend
cp .env.example .env
# Edit .env with your database and email configuration
```

Required variables:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - MySQL credentials
- `JWT_SECRET` - Secret key for JWT tokens
- `MAIL_AUTH_USER`, `MAIL_AUTH_PW` - SMTP credentials for app emails

Optional variables (for error notifications):
- `ADMIN_ERROR_EMAILS` - Comma-separated list of admin emails to receive error alerts (e.g., `admin@example.com,dev@example.com`)
- `ADMIN_MAIL_AUTH_USER`, `ADMIN_MAIL_AUTH_PW` - SMTP credentials for sending error notifications
- `ERROR_NOTIFICATION_RATE_LIMIT_MINUTES` - Rate limit for error emails (default: 15)

> **Note**: Error notifications are disabled if `ADMIN_ERROR_EMAILS` is not set.

#### Website Frontend (.env.local)
```bash
cd MSME-Website-Frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
echo "NEXT_PUBLIC_API_IMG_BASE_URL=http://localhost:3001" >> .env.local
```

#### CMS Frontend (.env.local)
```bash
cd MSME-CMS-Frontend
echo "VITE_API_URL=http://localhost:3001/api" > .env.local
echo "VITE_DOCS_URL=http://localhost:3001" >> .env.local
```

### 3. Set Up Database

```bash
# Connect to MySQL and create database
mysql -u root -p
```

```sql
CREATE DATABASE msme_db;
EXIT;
```

```bash
# Run migrations (from MSME-Backend directory)
cd MSME-Backend
npm run db:migrate

# Seed initial admin user (optional)
npm run seed:admin
```

### 4. Start All Applications

You have two options to start the applications:

#### Option A: Start Each Application Separately (3 terminals)

**Terminal 1 - Backend:**
```bash
cd MSME-Backend
npm run dev
# Or: npx nodemon server.js
```

**Terminal 2 - Website Frontend:**
```bash
cd MSME-Website-Frontend
npm run dev
```

**Terminal 3 - CMS Frontend:**
```bash
cd MSME-CMS-Frontend
npm run dev
```

#### Option B: Start All at Once (Single command)

```bash
# From the root MSME_Site directory

# macOS/Linux:
(cd MSME-Backend && npx nodemon server.js) & \
(cd MSME-Website-Frontend && npm run dev) & \
(cd MSME-CMS-Frontend && npm run dev) &

# To stop all:
pkill -f "nodemon server.js"; pkill -f "next dev"; pkill -f "vite"
```

### 5. Access the Applications

Once running, access the applications at:

| Application | URL |
|------------|-----|
| **Website** | http://localhost:3000 |
| **CMS Admin Panel** | http://localhost:5173 |
| **Backend API** | http://localhost:3001/api |

## 📁 Directory Structure

```
MSME_Site/
├── MSME-Backend/              # Backend API
│   ├── controllers/           # Request handlers
│   ├── models/                # Sequelize models
│   ├── routers/               # API routes
│   ├── services/              # Business logic
│   ├── middelware/            # Auth & error handling
│   ├── migrations/            # Database migrations
│   └── mailer/                # Email templates
│
├── MSME-Website-Frontend/     # Public Next.js website
│   └── src/
│       ├── app/               # Next.js App Router pages
│       ├── components/        # React components
│       ├── apis/              # API client functions
│       └── context/           # React contexts
│
├── MSME-CMS-Frontend/         # Admin React + Vite CMS
│   └── src/
│       ├── pages/             # Admin pages
│       ├── components/        # Reusable components
│       └── api/               # API client functions
│
└── .github/
    ├── workflows/             # CI/CD pipelines
    └── copilot-instructions.md
```

## 🛠️ Available Scripts

### Backend (MSME-Backend)

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm test` | Run test suite |
| `npm run seed:admin` | Create initial admin user |
| `npm run db:migrate` | Run database migrations |
| `npm run db:migrate:undo` | Rollback last migration |

### Website Frontend (MSME-Website-Frontend)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

### CMS Frontend (MSME-CMS-Frontend)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## � Production Deployment (Single Server)

Use PM2 to manage all three apps on one cloud machine:

### Setup

```bash
# Install PM2 globally
npm install -g pm2

# From root MSME_Site directory, install root package
npm install

# Install all app dependencies
npm run install:all

# Build frontend apps (required before starting)
npm run build:all
```

### Management Commands

| Command | Description |
|---------|-------------|
| `npm run start:prod` | Start all apps |
| `npm run stop:prod` | Stop all apps |
| `npm run restart:prod` | Restart all apps |
| `npm run status` | View status of all apps |
| `npm run logs` | View combined logs |
| `npm run logs:backend` | View backend logs only |
| `npm run logs:website` | View website logs only |
| `npm run logs:cms` | View CMS logs only |
| `npm run monit` | Real-time monitoring dashboard |

### Auto-Start on Server Reboot

```bash
pm2 startup    # Generate startup script
pm2 save       # Save current process list
```

### Production Ports

| App | Port/Path | Process |
|-----|-----------|---------|
| Backend | 3001 | `node server.js` (PM2) |
| Website | 3000 | `npm start` (Next.js via PM2) |
| CMS | `/admin` | Static files served by Nginx |

> **Important**: Run `npm run build:all` before `npm run start:prod` to build the frontend apps.

### Nginx Setup (HTTPS + Reverse Proxy)

The complete nginx configuration is in `nginx/msme.conf`. Setup on your production server:

```bash
# 1. Copy project to server
scp -r MSME_Site root@your-server:/var/www/msme

# 2. Copy nginx config
sudo cp /var/www/msme/nginx/msme.conf /etc/nginx/sites-available/msme
sudo ln -s /etc/nginx/sites-available/msme /etc/nginx/sites-enabled/

# 3. Install SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ceec-msme.com -d www.ceec-msme.com

# 4. Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

**URL Structure:**
| URL | Service |
|-----|---------|
| `https://ceec-msme.com` | Public Website |
| `https://ceec-msme.com/admin` | CMS Admin Panel |
| `https://ceec-msme.com/api/*` | Backend API |

## 🔐 Security Features

- **Rate Limiting**: 100 requests/15min (global), 5 requests/15min (auth endpoints), 10 requests/15min (email check)
- **Security Headers**: Helmet.js for XSS, CSP protection
- **XSS Sanitization**: Backend `xss-clean` middleware + Frontend DOMPurify on all HTML renders
- **JWT Authentication**: Configurable expiry times
- **OTP Protection**: Brute-force protection with 5 attempts, 30-min lockout
- **Protected Routes**: Admin routes require authentication
- **SQL Injection Prevention**: Sequelize ORM with parameterized queries
- **Error Notification**: Configurable admin email alerts (requires `ADMIN_ERROR_EMAILS` env var)

## 🧪 Testing

```bash
cd MSME-Backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ci       # CI mode with coverage
```

## 📝 API Documentation

Key API endpoints:

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/msme-business/login` - Business user login
- `POST /api/msme-business/register` - Business registration

### Password Reset (Secure Flow)
1. `POST /api/msme-business/forget-password/request-otp` - Request OTP
2. `POST /api/msme-business/forget-password/verify-otp` - Verify OTP, get reset token
3. `POST /api/msme-business/forget-password/reset` - Reset password with token

### Business Management
- `GET /api/business-category/list` - List categories
- `GET /api/msme-business/list` - List businesses
- `GET /api/msme-business/details/:id` - Get business details

### Content
- `GET /api/blog/list` - List blog posts
- `GET /api/faq/list` - List FAQs
- `GET /api/home-banner/list` - List banners

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm test`
4. Create a pull request

## 📄 License

This project is proprietary software for the Eswatini MSME Platform.

---

For detailed technical documentation, see [copilot-instructions](.github/copilot-instructions.md).
