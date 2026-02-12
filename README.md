# Dashboard 360

A full-stack Customer Success and account management dashboard with role-based access (Admin, CS Owner, Client), built with Next.js, Prisma, and PostgreSQL.

## Tech Stack

- **Framework:** Next.js 16
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth v5
- **UI:** React 19, Tailwind CSS 4, Radix UI, Framer Motion, Recharts
- **Deployment:** Vercel

## Roles & Access

| Role | Path | Description |
|------|------|-------------|
| **Admin** | `/admin` | Full platform control, companies, deliveries, operations, insights, settings |
| **CS Owner** | `/cs` | Customer Success view: assigned companies, deliveries, agenda, squads, tasks |
| **Client** | `/cliente` | Client portal: dashboard, deliveries, surveys, resources, diagnostics |
| **Client Member** | `/cliente` | Limited client access (no documentação/suporte) |
| **Membro** | `/membro` | Member area: settings, resources |

---

## Admin (`/admin`)

### Menu

- **Visão 360** – Main dashboard: portfolio health donut, MRR chart, delivery timeline, CS owner cards, financial bar, alerts, AI insights and action zone
- **Operação** – Operation overview: alerts, CS performance, deliveries, demands
- **Performance** – CS performance metrics, goals, ranking, breakdown
- **Squads** – Squad management and members
- **Empresas** – Company list, create company (incl. contract extraction), company detail (health, workshops, hotseats, deliveries, contacts, onboarding, diagnostics, surveys, comments, transcription manager)
- **Entregas** – Global delivery list with status filters and admin approval
- **Agenda** – Calendar and scheduling
- **Insights IA** – AI-generated insights (recommendations, alerts, opportunities, trends)
- **Tutoriais** – Tutorials (e.g. companies)

### Administration

- **Acessos** – User access and invites
- **Notificações** – Notification center
- **Configurações** – Settings (e.g. email templates)

### Features

- AI assistant bubble (Admin and CS layouts)
- Real-time notifications
- Company creation from contract (extraction), import, logo upload
- Workshops and hotseats with Fathom recording links
- Onboarding steps with drag-and-drop reorder
- Diagnostics: create, assign, token-based public link, responses, analytics
- NPS/CSAT/Adoption surveys and suggestions
- Calendly integration: bookings, webhooks, demand generation, Fathom sync
- Meeting transcription manager
- Storage (R2/S3): presign, upload, download

---

## CS Owner (`/cs`)

### Menu

- **Minha Área** – CS dashboard: companies, deliveries, squads summary
- **Minhas Empresas** – List (Minhas / Todas), company detail with health, workshops, hotseats, deliverables, contacts, resources, onboarding, surveys, comments
- **Entregas** – Delivery list with status filters, delivery detail with comments and dependencies
- **Agenda** – Calendar and agenda by company
- **Squads** – Squads and members
- **Tarefas** – Tasks and checklist
- **Tutoriais** – Tutorials (e.g. companies)
- **Notificações** – Notification center
- **Configurações** – CS settings

### Features

- AI assistant bubble
- Add/edit workshops and hotseats (with Fathom links)
- Add/edit deliverables and upcoming deliverables
- Company onboarding: steps, reorder, progress
- Delivery completion flow and NPS send
- Demands and demand tasks
- CS performance goals and checklist
- Conta (account) view with company context

---

## Client (`/cliente`)

### Menu

- **Dashboard** – Client dashboard
- **Entregas** – Delivery list and detail (approval, comments, dependencies)
- **Agenda** – Calendar
- **Pesquisas** – Surveys (NPS, CSAT, adoption)
- **Notificações** – Notifications
- **Recursos** – Client resources (links/documents)
- **Diagnóstico** – Assigned diagnostics and responses
- **Documentação** – Documentation (hidden for Client Member)
- **Suporte** – Support (hidden for Client Member)
- **Configurações** – Client settings

### Features

- Pending surveys provider and survey responses
- Diagnostic wizard (multiple question types)
- Onboarding timeline view
- Delivery approval and dependency provision
- Notification preferences

---

## Auth & Invites

- Login, forgot password, reset password
- Email verification and resend
- Invite flow: accept invite, set password
- Role-based middleware and layout

---

## API Overview

- **Auth:** NextAuth, forgot/reset password, verify email
- **Companies:** CRUD, contacts, deliveries, workshops, hotseats, logo, files, comments, surveys, from-contract, import
- **Deliveries:** CRUD, comments, complete, dependencies, documents, meetings
- **Diagnostics:** CRUD, token generation, public response by token, responses, stats, analyze
- **Surveys:** CRUD, respond, NPS suggestions
- **Insights:** CRUD, generate
- **Invites:** CRUD, accept, resend, stats
- **Notifications:** CRUD, read-all, send, stream
- **CS:** empresas, checklist, me
- **CS Owners:** checklist, demands
- **CS Performance:** metrics, goals, ranking, breakdown
- **Calendly:** bookings, event types, slots, webhook, create-booking, sync Fathom
- **Dashboard:** 360 data
- **Storage:** presign, upload, download
- **User:** profile, password, notification preferences, integrations (Fathom)
- **Cron:** health-check, calculate-performance
- **AI Assistant:** execute

---

## Getting Started

```bash
npm install
cp .env.example .env
# Configure DATABASE_URL and other env vars
npx prisma generate
npx prisma db push   # or db:migrate
npm run dev
```

- **Build:** `npm run build`
- **Start:** `npm run start`
- **DB:** `npm run db:studio` for Prisma Studio

Requires Node.js >= 20.19.0.
