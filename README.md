# Reservas Chanantes

Online booking platform for small businesses. Owners create their business page, configure services and weekly schedules, and customers book appointments through a public link.

**Live:** [reservas-chanantes.vercel.app](https://reservas-chanantes.vercel.app)

## Features

**For business owners (admin panel):**
- Register and create your business with a unique public URL
- Add, edit, and delete services (name, duration, price)
- Configure weekly availability with multiple time ranges per day
- Dashboard with active services count and daily bookings overview

**For customers (public booking page):**
- Browse available services
- Pick a date and see real-time 30-minute slot availability
- Book an appointment with name and email confirmation
- Booked slots are automatically blocked for other customers

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Database & Auth:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Styling:** Tailwind CSS 4
- **Testing:** Vitest (78 unit tests covering domain and application layers)
- **Deployment:** Vercel

## Architecture

Clean Architecture with four layers:

```
domain/           Pure business logic (entities, value objects, domain services)
application/      Use cases and repository port interfaces
infrastructure/   Supabase repository adapters, auth helpers, clients
app/              Next.js pages, server actions, client components
```

Server Actions act as the bridge between the presentation layer and use cases, instantiating repositories with the current Supabase client per request.

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/Ogires/reservas-chanantes.git
cd reservas-chanantes
npm install
```

2. Create `.env.local` from the template:

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Run the database migration:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or paste the contents of `supabase/schema.sql` into the Supabase SQL Editor.

4. In your Supabase dashboard, go to **Authentication > Providers > Email** and disable "Confirm email" for development.

5. Start the dev server:

```bash
npm run dev
```

### Testing

```bash
npm test
```

## Project Structure

```
src/
  domain/                     Business logic
    entities/                 Tenant, Service, Booking, Customer, WeeklySchedule
    value-objects/            TimeRange, Money, Slug
    services/                 AvailabilityCalculator
    errors/                   Domain-specific errors
  application/                Use cases & ports
    use-cases/                GetAvailability, CreateBooking
    ports/                    Repository interfaces
  infrastructure/supabase/    Supabase adapters
  app/                        Next.js pages
    admin/                    Login, register
    admin/(dashboard)/        Sidebar layout, services CRUD, schedule editor
    [slug]/                   Public tenant booking page
  proxy.ts                    Session refresh & admin route protection
supabase/
  migrations/                 SQL schema
```

## License

MIT
