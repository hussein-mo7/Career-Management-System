# Career OS

A personal career operating system for one developer. It keeps the long-term direction, target companies, conversations, applications, interviews, and the learning that follows in one private place.

The point is not to collect records. The loop is **capture → learn → improve → move forward**.

## Features

- Career vision, current direction, and a simple skill progress list
- Ideal company criteria, with priority and ordering
- Target companies, manual fit, concerns, and criteria evaluation
- People, coffee chats, and optional communication reflections
- Job applications and follow-ups
- Lightweight next actions on the dashboard
- Interview records, questions, and learning status
- A learning board from questions, topics, and career skills
- Notes
- Weekly reflection and simple progress counts
- Search across companies, people, applications, interviews, questions, and notes
- Light, dark, and system themes

## Tech stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- MongoDB
- Mongoose
- Zod
- React Hook Form
- TanStack Query
- Radix UI
- Lucide icons
- bcryptjs
- jose (access tokens)

## Architecture

The interface is a Next.js App Router application. Private pages talk to route handlers. Those handlers validate input with Zod, call a service, and return a consistent JSON shape:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "message": "Something went wrong" } }
```

Services own database access. Mongoose models stay on the server. The browser never receives password hashes. Dashboard insights are computed from stored records.

## Project structure

```text
src/app/                routes, pages, and API handlers
src/components/         shell and reusable UI
src/features/           page-level interface for each module
src/lib/                shared constants, formatting, and the API client
src/schemas/            Zod schemas shared by the API
src/server/auth/        password hashing, access tokens, session cookie
src/server/domain/      career defaults and pure business rules
src/server/models/      Mongoose models
src/server/services/    application logic
scripts/seed.ts         optional example data
```

## Authentication

The app is for one personal account. The first visit can create that account at `/setup`. After that, setup is closed.

Login issues a signed access token in an httpOnly cookie. There is no refresh token. The token lasts 7 days. Passwords are hashed with bcrypt. Routes and API handlers reject missing or invalid tokens. Secrets live in environment variables.

## Environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

```env
MONGODB_URI=mongodb://127.0.0.1:27017/hussein-career-os
JWT_SECRET=replace-with-a-random-string-at-least-32-characters
NEXT_PUBLIC_APP_URL=http://localhost:3000
SEED_USER_NAME=Hussein
SEED_USER_EMAIL=hussein@example.com
SEED_USER_PASSWORD=change-this-password
```

`JWT_SECRET` must be at least 32 characters. Do not commit `.env`.

## Installation

```bash
git clone <repository-url>
cd hussein-career-os
npm install
```

Create `.env` as shown above. MongoDB must be running at the URI you set.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If no account exists, create one from the login page.

## Production

```bash
npm run build
npm start
```

Set the same environment variables in the host. `JWT_SECRET` and `MONGODB_URI` are required. Use a strong password and change any seed password after the first login.

## Database

Use MongoDB locally or a hosted database such as MongoDB Atlas. Put the connection string in `MONGODB_URI`. The default database name in the example URI is `hussein-career-os`.

You can override it with `MONGODB_DB` when the URI should stay the same and the database name should change.

## Seed data

Example companies, people, conversations, applications, interviews, questions, notes, and actions are optional. They are marked as demo data and can be removed from Settings without deleting your account, criteria, or career direction.

```bash
npm run seed
```

The command creates the account from `SEED_USER_EMAIL` and `SEED_USER_PASSWORD` when that email does not exist yet. If the account already exists, the password is not changed.

## Screenshots

Screenshots of the dashboard, companies, interviews, and learning board will go here.

## Tests

```bash
npm run test
```

Tests cover authentication, validation, company and application creation, learning-status changes, and dashboard insight text.

## Future improvements

These are not implemented:

- Refresh token authentication
- AI career insights
- Resume version tracking
- LinkedIn integration
- Job-board integrations
- Email reminders
- Advanced analytics
- Calendar integration
