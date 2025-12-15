# MSME Platform - Website Frontend

Public-facing website for the Eswatini MSME (Micro, Small, and Medium Enterprises) Platform.

## Features

- Browse MSME businesses and service providers
- Search and filter by categories
- View business details
- Contact forms
- Blog and news articles
- FAQ section
- Newsletter subscription
- Responsive design

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS
- **HTTP Client:** Axios
- **Image Optimization:** Next.js Image
- **Routing:** Next.js App Router

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Bakhombisile02/MSME-Website-Frontend.git
cd MSME-Website-Frontend
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

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_IMG_BASE_URL=http://localhost:3001
```

## Available Scripts

```bash
# Development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## Project Structure

```
src/
├── app/              # Next.js app directory
│   ├── page.js      # Home page
│   ├── layout.js    # Root layout
│   └── ...          # Other pages
├── components/       # Reusable React components
│   ├── layout/      # Layout components (Header, Footer)
│   └── ...          # Other components
├── apis/            # API service layer
├── utils/           # Utility functions
└── styles/          # Global styles
```

## Pages

- **/** - Home page with hero, featured businesses
- **/about** - About the platform
- **/categories** - Browse by categories
- **/service-providers** - Service providers directory
- **/blog** - News and articles
- **/faq** - Frequently asked questions
- **/contact** - Contact form
- **/feedback** - User feedback form

## Features

### Business Directory
- Browse all registered MSME businesses
- Filter by category, location, ownership
- Search functionality
- Detailed business profiles

### Service Providers
- Directory of certified service providers
- Filter by category
- Contact information
- Service descriptions

### Content
- Blog articles and news
- FAQ section
- Team member profiles
- Partner logos

## Build & Deploy

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Performance

- ✅ Next.js Image optimization
- ✅ Turbopack for faster builds
- ✅ Server-side rendering (SSR)
- ✅ Static generation where applicable
- ✅ Code splitting

## SEO

- ✅ Meta tags for all pages
- ✅ Open Graph support
- ✅ Sitemap generation
- ✅ Semantic HTML

## Responsive Design

- ✅ Mobile-first approach
- ✅ Tablet optimization
- ✅ Desktop optimization
- ✅ Tailwind CSS breakpoints

## Support

- Email: siyamukeladlamini1@icloud.com
- GitHub Issues: Create an issue in this repository

---

**Part of:** MSME Platform  
**Owner:** Bakhombisile02
