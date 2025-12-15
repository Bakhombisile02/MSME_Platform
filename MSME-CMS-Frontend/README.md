# MSME Platform - CMS Frontend (Admin Panel)

Admin panel for managing the Eswatini MSME Platform content and users.

## Features

- Admin authentication and authorization
- Business management (approve/reject)
- Content management (blog posts, FAQs, team)
- Service provider management
- User management
- Analytics dashboard
- File uploads
- Category management

## Tech Stack

- **Framework:** React + Vite
- **UI:** Tailwind CSS
- **State Management:** React Context/Hooks
- **HTTP Client:** Axios
- **Routing:** React Router

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Bakhombisile02/MSME-CMS-Frontend.git
cd MSME-CMS-Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API URL
```

4. Start development server:
```bash
npm run dev
```

## Environment Variables

```env
VITE_API_URL=http://localhost:3001
VITE_DOCS_URL=http://localhost:3001/docs
```

## Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── context/       # React context providers
├── hooks/         # Custom React hooks
├── services/      # API service layer
├── utils/         # Utility functions
├── assets/        # Static assets
└── App.jsx        # Main app component
```

## Admin Features

### Dashboard
- Overview statistics
- Recent activities
- Quick actions

### Business Management
- View all MSME businesses
- Approve/reject applications
- Edit business details
- Export data

### Content Management
- Blog posts (create, edit, delete)
- FAQs management
- Team member profiles
- Home page banners

### User Management
- Admin users
- Service providers
- Permissions management

## Build & Deploy

```bash
# Build for production
npm run build

# The build output will be in /dist directory
# Deploy dist/ folder to your hosting service
```

## Security

- ✅ Environment variables for sensitive data
- ✅ Protected routes for authenticated users
- ✅ Role-based access control
- ✅ Secure API communication

## Support

- Email: siyamukeladlamini1@icloud.com
- GitHub Issues: Create an issue in this repository

---

**Part of:** MSME Platform  
**Owner:** Bakhombisile02
