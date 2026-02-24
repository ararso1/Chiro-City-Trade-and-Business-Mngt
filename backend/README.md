# Chiro City Trade Management — Backend

NestJS + Prisma + PostgreSQL backend for the Chiro City Trader & Business Management system. Integrates with MESOB (mesob.ciroocity.com).

## Setup

1. **Prerequisites**: Node.js 18+, PostgreSQL 14+

2. **Environment**
   ```bash
   cp .env.example .env
   # Edit .env: set DATABASE_URL and optionally JWT_SECRET
   ```

3. **Install and generate**
   ```bash
   npm install
   npx prisma generate
   ```

4. **Database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Run**
   ```bash
   npm run start:dev
   ```
   API: http://localhost:3001  
   Swagger: http://localhost:3001/api/docs

## Demo users (after seed)

| Email                 | Password    | Role    |
|-----------------------|------------|---------|
| admin@chirocity.com   | password123| admin   |
| officer@chirocity.com | password123| officer |
| finance@chirocity.com | password123| finance |

## Roles & permissions

- **admin**: Full access.
- **officer**: Traders, businesses, licenses, inspections, documents, complaints.
- **finance**: Dashboard, traders/businesses/licenses read, payments, reports, documents read.
- **trader**: Dashboard, own profile/status, submit complaints.

## Modules

- **Auth**: JWT login, profile.
- **Users**: List users, roles, permissions (RBAC).
- **Traders / Businesses / Licenses**: CRUD and listing.
- **Finance**: Tax types, payments, revenue summary.
- **Inspections**: Schedule, result, violations.
- **Documents**: Trader/business document storage and search (archive).
- **Complaints**: Submit and manage complaints.
- **Notifications**: Create and list (SMS/Email integration placeholder).
- **Reports**: Dashboard stats, export summary.
- **Mesob**: Sync log and push placeholder for MESOB integration.

## MESOB integration

Use `MesobService` and `POST /mesob/sync/trader/:id`, `POST /mesob/sync/business/:id` to push entities to MESOB once the external API spec is available. Set `MESOB_BASE_URL` in `.env` and implement the HTTP client in `mesob.service.ts`.
