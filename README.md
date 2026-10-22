# The Begum Beauty

Online makeup store for Pakistan: storefront and admin dashboard built with Next.js 15 (App Router, TypeScript) and Supabase (Postgres, Auth, Storage).

## Run it locally

1. Install Node.js 22 (20 works, but Supabase is dropping support for it).
2. `npm install`
3. Copy `.env.example` to `.env.local` and add your Supabase **Project URL** and **Publishable key**.
4. `npm run dev`, then open http://localhost:3000 (admin: http://localhost:3000/admin).

Without `.env.local` the storefront still runs on the starter data in `src/data/seed.json`, but orders and the admin need Supabase.

## Supabase setup (once)

1. In the Supabase SQL Editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
2. Authentication > Users > Add user (tick "Auto Confirm User"), then make that user an admin:
   `insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';`
3. Authentication > Sign In / Providers: turn off "Allow new users to sign up".

## How it fits together

| Area | Where |
|---|---|
| Storefront pages | `src/app/(store)/` (home, shop, product/[id], cart, checkout, policies) |
| Storefront components | `src/components/store`, `home`, `shop`, `product`, `cart` |
| Admin | `src/app/admin/`, `src/components/admin/`, `src/lib/admin/` |
| Data access | `src/lib/data.ts` (storefront reads), `src/lib/admin/db.ts` (admin reads and writes) |
| Bag maths | `src/lib/pricing.ts`, mirrored by `place_order` in `supabase/schema.sql` |
| Styles | `src/app/globals.css` (storefront), `src/styles/admin.css` |
| Database | `supabase/schema.sql` (tables, security rules, order function, storage bucket) |

- **Orders** go through the `place_order` database function. It recalculates prices, the Make Your Own Deal discount and stock on the server, so customers can't change what they pay. Cancelling an order in the admin puts the stock back.
- **Security:** Row Level Security lets shoppers read only published content. Only users in the `admins` table can change anything or see orders.
- **Caching:** storefront pages refresh every 60 seconds, and immediately after any admin save.
- **Images:** starter images live in `public/assets`. Admin uploads go to the Supabase Storage bucket `media`.

`node scripts/generate-seed.mjs` rebuilds `supabase/seed.sql` and `src/data/seed.json` from the HTML prototype in `../hanis-mart`.

## Deploy

Push to GitHub, import the repo in Vercel, add the two `NEXT_PUBLIC_SUPABASE_*` variables (plus `NEXT_PUBLIC_SITE_URL`, for example `https://www.thebegumbeauty.pk`) and deploy.
