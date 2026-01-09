# Repository Guidelines

## Project Structure & Module Organization
This repository is a monorepo with three apps and shared infrastructure:
- `MSME-Backend/`: Express + Sequelize REST API. Source in `controllers/`, `routers/`, `services/`, and `models/`. Uploads and static assets live in `MSME-Backend/public/`.
- `MSME-Website-Frontend/`: Next.js App Router site. Pages follow `src/app/**/page.js` and shared UI sits in `src/components/`.
- `MSME-CMS-Frontend/`: React + Vite admin panel. Screens live in `src/pages/` (kebab-case folders/files) and shared UI in `src/components/`.
- `nginx/` and `ecosystem.config.js` hold production reverse-proxy and PM2 configuration.

## Build, Test, and Development Commands
Run commands from the relevant app directory unless noted:
- Backend dev: `cd MSME-Backend && npm run dev` (nodemon server).
- Backend tests: `cd MSME-Backend && npm test` (Jest with coverage).
- Website dev: `cd MSME-Website-Frontend && npm run dev` (Next.js + Turbopack).
- CMS dev: `cd MSME-CMS-Frontend && npm run dev` (Vite).
- Production (root): `npm run install:all`, `npm run build:all`, `npm run start:prod` (PM2 using `ecosystem.config.js`).
- Database migrations: `cd MSME-Backend && npm run db:migrate`.

## Coding Style & Naming Conventions
- JavaScript/JSX with 2-space indentation; follow existing file formatting and semicolon usage.
- React components use PascalCase filenames in `src/components/` (e.g., `Header.js`, `CustomInputField.jsx`).
- Next.js routes follow `page.js` and `layout.js` conventions in `MSME-Website-Frontend/src/app/`.
- Run linting before PRs: `npm run lint` in each app (ESLint configs in `MSME-CMS-Frontend/eslint.config.js` and `MSME-Website-Frontend/eslint.config.mjs`).

## Testing Guidelines
- Backend tests live in `MSME-Backend/tests/*.test.js` and run with Jest.
- Coverage is enabled by default via `npm test`; keep or improve coverage for new API routes and services.
- No dedicated frontend test runner is configured; add tests only if you also add the framework and scripts.

## Commit & Pull Request Guidelines
- Recent history shows Conventional Commit prefixes (`feat:`, `fix:`); prefer that format with short, imperative summaries.
- PRs should describe the change, list affected apps, and link related issues.
- Include screenshots or short clips for UI changes (Website or CMS).
- Call out any new env vars, migrations, or data backfills in the PR description.

## Security & Configuration Tips
- Do not commit `.env` or `.env.local` files; use the `.env.example` templates in each app.
- Backend uses MySQL; keep credentials and SMTP settings in environment variables.
