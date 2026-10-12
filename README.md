# Freight Rate Comparison & Logistics CRM

A modern, multi-tenant Logistics CRM and Freight Rate Comparison platform built with **Next.js 16 (App Router)**, **React 19**, **Prisma ORM**, and **Supabase (PostgreSQL & Auth)**.

Designed for freight forwarders, cargo agents, and logistics sales teams to compare carrier buying costs, prepare customer quotes, rank profit margins, and manage shipper accounts side-by-side in real time.

---

## Key Features

### 1. Multi-Carrier Freight Rate Comparison
- **Side-by-Side Carrier Comparison**: Compare carrier costs (Net) vs. customer sell prices (Gross) across multiple ocean, air, and trucking lines (e.g. Maersk, MSC, ONE, Cosco).
- **Automated Profit & Margin Ranking**: Real-time calculation of gross profit and profit margin percentage with automated badges:
  - `Most Profit` (Top profit recommendation)
  - `Lowest Cost` (Most cost-effective carrier)
  - `Top Margin` (Highest profit margin %)
- **Multiple Rate Options**: Support for multiple routing options per shipment (e.g., Direct Service, Transshipment via Singapore, Spot Rate).
- **Direct Carrier / Freight Editing**: Edit provider names and routing labels directly from the directory with instant modal updates.
- **Carrier Rate Selection & Approval**: Workflow for Sales Managers and Admins to formally select and lock in the winning carrier quote for execution.

### 2. Itemized Line-Item Cost Breakdown
- **Itemized Charges**: Ocean Freight, Origin THC, Destination THC, Customs Clearance, Inland Trucking, Documentation fees, Bunker Adjustment (BAF), and Port Security fees.
- **Flexible Units**: Calculate charges by `CONTAINER`, `CBM`, `TON`, `BL`, `SHIPMENT`, or `TRUCK`.
- **Multi-Currency Support**: Supports foreign currency line items (USD, EUR, VND) with organization-level exchange rate conversions into a consolidated base currency.

### 3. Shipment Management & Routing
- **Full Shipment Lifecycle**: Track order reference, direction (`Import` vs. `Export`), and commodity specifications.
- **Port-to-Port Route Tracking**: Dedicated route logging supporting Port of Loading (POL) to Port of Discharge (POD) (e.g. `Cat Lai -> Los Angeles`).
- **Interactive Directory**: Filter and search shipments by customer account, freight direction, route, commodity, or quote status.

### 4. Shipper & Customer CRM
- **Account Profiles**: Manage shipper directories, tax codes, company addresses, industrial zones, and contact points.
- **Linked Shipment Volume**: Instantly review all past and active shipments, configured carrier quotes, and total revenue per shipper account.

### 5. Multi-Tenant Architecture & Role-Based Access Control (RBAC)
- **Tenant Isolation**: Secure multi-organization data isolation. Each organization has its own customers, shipments, providers, exchange rates, and team members.
- **Granular Roles**:
  - `ADMIN`: Full system access, organization billing, currency configuration, member invitations, and cross-team visibility.
  - `SALES_MANAGER`: Rate approval, shipment management, carrier selection, team quote analytics.
  - `SALES`: Customer relationship management, shipment creation, rate quotation, and line-item calculation.
- **Team Management**: Invite team members by email with role assignment and invitation status tracking.

### 6. Performance & Instant UX
- **Next.js 16 Streaming & Suspense**: Critical navigation renders instantly while heavy queries stream in with zero layout jumping.
- **Instant Route Skeletons**: 1:1 layout-matched skeleton loading states for all route segments.
- **Link Status Feedback**: Instant sidebar active highlights and pending spinners powered by Next.js `useLinkStatus`.
- **Connection-Pooled Prisma Client**: Configured with bounded node-postgres connection pooling and Next.js global singletons to prevent connection exhaustion.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Turbopack) |
| **Frontend** | [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/) |
| **Charts & Alerts** | [Recharts](https://recharts.org/), [React Toastify](https://fkhadra.github.io/react-toastify/) |
| **Database** | PostgreSQL (hosted on [Supabase](https://supabase.com/)) |
| **ORM** | [Prisma 7](https://www.prisma.io/) with `@prisma/adapter-pg` & connection pooling |
| **Authentication** | [Supabase Auth](https://supabase.com/docs/guides/auth) (SSR with `@supabase/ssr`, Google OAuth, Email/Password) |

---

## Project Structure

```
├── app/
│   ├── (auth)/                # Public authentication routes (/login, /register)
│   ├── auth/                  # Auth callbacks and OAuth exchange handlers
│   ├── dashboard/             # Core application dashboard
│   │   ├── admin/             # Admin portal (Overview, Customers, Shipments, Rates, Settings)
│   │   ├── sales/             # Sales portal (Overview, Customers, Shipments, Rates, Team, Settings)
│   │   ├── loading.tsx        # Dashboard root skeleton
│   │   └── page.tsx           # Role-based dashboard redirector
│   ├── onboarding/            # Organization setup & onboarding flow
│   └── layout.tsx             # Root HTML layout & toast container
├── components/
│   ├── dashboard/
│   │   ├── layout/            # Sidebar, topbar, mobile drawer navigation
│   │   ├── overview/          # Analytical charts (Profit over time, Cost vs Profit)
│   │   ├── sales/             # Customer, shipment, and freight view components
│   │   └── skeletons/         # 1:1 matched skeleton loaders for every route
│   ├── organization/          # Team member invitations & organization settings
│   ├── rate/                  # Reusable rate calculation & ranking presentation
│   └── ui/                    # Reusable shadcn/ui components (dialog, select, button, skeleton)
├── lib/
│   ├── auth/                  # Session resolution, role guards, Supabase clients
│   ├── db/                    # Prisma client singleton with connection pooling
│   ├── freight/               # Freight line item server actions and types
│   ├── rate/                  # Rate comparison queries, actions, and ranking math
│   ├── shipment/              # Shipment CRUD actions, queries, and type definitions
│   ├── customer/              # Customer CRUD actions and database queries
│   └── proxy.ts               # Next.js middleware token verification & session refresh
├── prisma/
│   ├── schema.prisma          # Database schema models & relationships
│   ├── migrations/            # Migration history
│   └── prisma.config.ts       # Database URL and migration configuration
└── public/                    # Static assets & icons
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm`, `pnpm`, or `yarn`
- **PostgreSQL Database**: A [Supabase](https://supabase.com) project or local PostgreSQL instance

### 1. Clone the Repository
```bash
git clone https://github.com/Thanhbo209/Rate-Comparison-Customer-CRM.git
cd Rate-Comparison-Customer-CRM
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Database Connection (Supabase)
# Transaction pooler (Port 6543) - used by Next.js application runtime
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session pooler / Direct connection (Port 5432) - used for Prisma migrations & db push
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Optional: Google OAuth Client Secret (if using Supabase Google provider)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=your_google_secret
```

### 4. Setup the Database
Push the schema to your database and generate the Prisma Client:
```bash
npx prisma db push
npx prisma generate
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server with Turbopack. |
| `npm run build` | Builds the optimized production application. |
| `npm run start` | Runs the built production server. |
| `npm run lint` | Runs ESLint to check for code quality and hook rules. |
| `npx tsc --noEmit` | Validates TypeScript types across the entire project. |
| `npx prisma db push` | Pushes schema changes in `schema.prisma` directly to the database. |
| `npx prisma studio` | Opens the Prisma visual database browser in your browser. |

---

## Database Architecture

The PostgreSQL schema is structured around a multi-tenant domain model:

- **`Organization`**: Tenant root. Owns users, customers, freight providers, and currency settings.
- **`User`**: Application profile linked to Supabase Auth (`authUserId`), with roles (`ADMIN`, `SALES_MANAGER`, `SALES`).
- **`OrganizationInvitation`**: Pending team email invites with role assignments and token validation.
- **`Customer`**: Shipper account belonging to an organization.
- **`Shipment`**: Forwarding order belonging to a Customer. Tracks route (`POL -> POD`), direction (`IMPORT` / `EXPORT`), and commodity.
- **`Provider`**: Freight carrier or shipping line (e.g., Maersk, MSC, Evergreen).
- **`ShipmentRate`**: A quotation option for a shipment by a carrier with an optional routing note.
- **`FreightItem`**: Itemized cost lines within a rate quote (e.g., Ocean Freight, THC, Trucking, Custom clearance).
- **`OrganizationExchangeRate`**: Currency pairs and multipliers for converting foreign charges into the organization base currency.

---

## Deployment

The application is optimized for deployment on [Vercel](https://vercel.com):

1. Push your repository to GitHub.
2. Import the project in Vercel.
3. Configure the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, and `DIRECT_URL`).
4. Set the build command to `npm run build`.
5. Deploy.

---

## License

This project is licensed under the [MIT License](LICENSE).
