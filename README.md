# Zahra's: Women's Clothing Store

A full-stack online store for women's clothing, built for Pakistan: prices in PKR, `03XX` mobile numbers, Pakistani provinces and cities, cash on delivery and card payments. Shoppers browse, filter, add to cart and check out; the owner runs the shop from an admin panel (articles, categories, orders, customers, reviews, coupons, analytics).

> The brand name is set in `client/lib/site.ts` and `server/config/store.ts`. The logo (the Z with the plumeria flower) is `client/public/brand/zahra-mark.png`, and the header uses it through `client/components/brand/BrandLogo.tsx`.

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Folder structure](#folder-structure)
5. [Installation](#installation)
6. [Environment variables](#environment-variables)
7. [MongoDB setup](#mongodb-setup)
8. [Cloudinary setup](#cloudinary-setup)
9. [Stripe setup](#stripe-setup)
10. [Email setup](#email-setup)
11. [Redis setup](#redis-setup)
12. [Running locally](#running-locally)
13. [Seed the database](#seed-the-database)
14. [Build](#build)
15. [Production](#production)
16. [Deployment](#deployment)
17. [API documentation](#api-documentation)
18. [Security](#security)
19. [Before you launch](#before-you-launch)
20. [Future improvements](#future-improvements)

---

## Features

**Shoppers**
- Home page with featured, new, best-selling and sale articles, latest reviews and a newsletter signup
- Shop page with search, category, price, size and sort filters, with the filters kept in the address bar
- Article pages with the article's photos and a size pick (with live stock). Each article is one design in one colour, so shoppers only choose a size, related articles, ratings and reviews
- Cart that works for guests and is merged into the account on login; wishlist
- Checkout with saved addresses, standard or express delivery, coupon codes, cash on delivery or card (Stripe)
- Account: profile and avatar, address book, order history with a status timeline, cancel an order while it is still pending and unpaid
- Reviews, only after the article was delivered to you (one review per article, editable)
- Email verification, password reset, order emails (placed, shipped, delivered, cancelled)
- Policy pages (about, contact, shipping, returns, privacy, terms), SEO metadata, sitemap, `robots.txt`, structured data

**Admin**
- Dashboard: revenue, orders, customers, low-stock and out-of-stock counts, recent orders, sales chart
- Articles: create, edit, draft, archive, delete (an article that was ordered can only be archived); stock per size (no colour variants: one article is one design in one colour); photos of the article; featured, new-arrival, best-seller and sale flags
- Categories: this store sells suits, so the sample categories are New Arrivals, Winter, Summer, Dresses, Two Piece, Three Piece and Sale. Add or remove them in Admin > Categories. They are dynamic, with images; a category that has articles is archived instead of deleted
- Homepage banners: Admin -> Homepage banners. Upload one tall (4:5) picture, shown on the right of the text, and set title, text and link; up to 8, reorderable, one stays still, several slide. With none, the homepage shows a featured article instead.
- Orders: filters, order detail with what to pack, status moves (pending, confirmed, processing, shipped, delivered, cancelled) with a note that goes into the customer's email, refunds for paid card orders on cancel
- Customers: list, detail with order history, deactivate and reactivate accounts
- Reviews: moderate and delete
- Coupons: percentage or fixed, minimum order, maximum discount, dates, usage limit, on/off
- Analytics: revenue and orders over time, top articles and categories, payment and city breakdowns (Pakistan time)

**Rules the server enforces** (never trusts the browser): prices, stock, coupons, delivery fees and totals are recalculated on the server; stock is reserved atomically when an order is placed and restored on cancel; free standard delivery from Rs. 5,000 after discount, standard fee Rs. 250, express Rs. 600; unpaid card orders are cancelled after 30 minutes and the stock is released.

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Redux Toolkit + RTK Query, React Hook Form + Zod, Lucide icons |
| Backend | Node.js 20+, Express, TypeScript, Zod |
| Database | MongoDB with Mongoose (MongoDB Atlas in production) |
| Auth | JWT in an HTTP-only cookie, bcrypt password hashing |
| Images | Cloudinary |
| Payments | Stripe (cards) and cash on delivery |
| Email | Nodemailer (any SMTP provider) |
| Hosting | Vercel (client), AWS EC2 with nginx and PM2 (server), MongoDB Atlas (database) |

## Architecture

```text
 Browser ──► Vercel: Next.js client (shop + /admin) ──► API calls with the login cookie
                                                           │  https://api.example.com/api/v1
                                                           ▼
                                   AWS EC2: nginx (HTTPS) ─► Express API (PM2, port 8000)
                                                           │
                          ┌────────────────┬───────────────┼──────────────┐
                          ▼                ▼               ▼              ▼
                    MongoDB Atlas      Cloudinary        Stripe       SMTP server
                    (all data)         (pictures)   (card payments)    (emails)
                                                           │
                                  Stripe ──webhook──► /api/v1/payments/webhook
```

- The client talks to the API only through RTK Query (`client/services`). Product pages and the sitemap are rendered on the server for SEO.
- The API is layered: `routes` (URLs and rules) → `controllers` (HTTP in and out) → `services` (business logic) → `models` (Mongoose). Input is checked by Zod schemas in `validations` before a controller runs.
- Every response has the same shape: `{ "success": true, "message": "...", "data": {} }`, or `{ "success": false, "message": "...", "errors": [] }`.
- Emails and the unpaid-order clean-up run inside the API process, so run **one** API instance.

## Folder structure

```text
women-clothing-store/
├── client/                    Next.js app
│   ├── app/                   Pages: (shop), account, admin, auth, sitemap, robots
│   ├── components/            UI by area: home, shop, products, cart, checkout, account, admin, ui
│   ├── services/              RTK Query API slices
│   ├── store/                 Redux store and provider
│   ├── lib/  hooks/  utils/   Helpers, site details, policy text, SEO
│   ├── types/                 Shared TypeScript types
│   └── public/seed/           Sample pictures used by the seed
├── server/
│   ├── app.ts  server.ts      Express setup and start-up
│   ├── config/                env, database, Cloudinary, Stripe, store rules (delivery fees)
│   ├── routes/  controllers/  services/  models/  validations/
│   ├── middleware/            auth, admin, rate limits, CSRF origin guard, sanitising, uploads, errors
│   ├── emails/                Email templates
│   ├── seed/                  Seed: admin, categories, sample shop
│   ├── scripts/               syncIndexes, cleanOrphanImages
│   └── ecosystem.config.cjs   PM2 process file
├── deploy/                    EC2 setup script, deploy script, nginx example
├── .gitignore
├── package.json               Root scripts (install:all, dev, build, seed ...)
└── README.md
```

## Installation

Requirements: **Node.js 20.9 or newer**, npm, and a MongoDB database (local or Atlas).

```bash
npm run install:all

cp server/.env.example server/.env          # then fill it in (see below)
cp client/.env.example client/.env.local
```

On Windows PowerShell use `Copy-Item server\.env.example server\.env` and `Copy-Item client\.env.example client\.env.local`.

The smallest working setup needs only `MONGODB_URI` and `JWT_SECRET` in `server/.env`. Cloudinary, Stripe and email can be added later; without them the shop still runs (cash on delivery only, no picture uploads, no emails).

## Environment variables

### Server (`server/.env`)

| Variable | Needed | What it is |
| --- | --- | --- |
| `PORT` | no | API port. Default `8000` |
| `NODE_ENV` | no | `development` or `production` |
| `MONGODB_URI` | **yes** | MongoDB connection string |
| `JWT_SECRET` | **yes** | At least 32 random characters. Production refuses the placeholder |
| `JWT_EXPIRES_IN` | no | Login length. Default `7d` |
| `CLIENT_URL` | yes in production | Shop address, `https://` in production. Several can be separated by commas |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | for pictures | Admin picture uploads |
| `STRIPE_SECRET_KEY` | for cards | Secret key (`sk_...`) |
| `STRIPE_WEBHOOK_SECRET` | with Stripe | Webhook signing secret (`whsec_...`). Required in production when Stripe is on |
| `STRIPE_CURRENCY` | no | Default `pkr` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | for emails | Any SMTP provider |
| `MONGODB_DNS_SERVERS` | no | Set to `8.8.8.8,1.1.1.1` if an Atlas `mongodb+srv://` address fails with `querySrv ECONNREFUSED` |
| `REDIS_URL` | no | Reserved; not used yet |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for the seed | First admin account. Choose your own |
| `SEED_DEMO_PASSWORD` | no | Password of the sample customers (development only). Default `Demo@12345` |

### Client (`client/.env.local`)

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API address including `/api/v1` |
| `NEXT_PUBLIC_APP_URL` | The shop's own address (links, sitemap, share previews) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_...`) |

Everything starting with `NEXT_PUBLIC_` is visible to every visitor. Never put a secret there. Never commit `.env` files (they are in `.gitignore`).

## MongoDB setup

**Local:** install MongoDB Community Edition and use `MONGODB_URI=mongodb://127.0.0.1:27017/women-clothing-store`.

**Atlas (use this in production):**
1. Create a free cluster at <https://www.mongodb.com/atlas>.
2. *Database Access*: add a user with a strong password and the *readWrite* role on your database.
3. *Network Access*: allow the **Elastic IP of your EC2 server** (not `0.0.0.0/0`). Add your own IP too if you run the seed from your laptop.
4. *Connect → Drivers*: copy the connection string, put the user, password and database name in, and set it as `MONGODB_URI`. Percent-encode special characters in the password (`@` becomes `%40`).

Indexes are created automatically when the server starts. After changing a model, run `npm --prefix server run db:sync` to bring the indexes in line.

## Cloudinary setup

1. Create an account at <https://cloudinary.com>.
2. From the dashboard copy *Cloud name*, *API key* and *API secret* into the three `CLOUDINARY_*` values.
3. Restart the API. Images go into `women-clothing-store/products`, `.../categories` and `.../avatars`. Uploads are limited to 5 MB per image.

To find product images that were uploaded but never saved with an article: `npm --prefix server run images:clean` (lists them) and `npm --prefix server run images:clean -- --delete` (removes them).

## Stripe setup

1. Create an account at <https://stripe.com> and open *Developers → API keys* (use **test mode** first).
2. Set `STRIPE_SECRET_KEY` (server) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client).
3. Webhook, local testing with the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:8000/api/v1/payments/webhook
   ```
   Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.
4. Webhook, production: *Developers → Webhooks → Add endpoint* with the URL `https://api.example.com/api/v1/payments/webhook` and the events `payment_intent.succeeded` and `payment_intent.payment_failed`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Test card: `4242 4242 4242 4242`, any future date, any CVC.

Stripe must support your business country and currency (`STRIPE_CURRENCY`, default `pkr`). If your Stripe account cannot take PKR, use cash on delivery only (leave the Stripe keys empty) or ask Stripe which currency your account supports. Orders are only marked paid by the webhook, never by the browser.

## Email setup

Set `SMTP_HOST`, `SMTP_PORT` (587 for STARTTLS, 465 for SSL), `SMTP_USER`, `SMTP_PASSWORD` and `SMTP_FROM` (for example `"Zahra's <hello@yourdomain.com>"`). Any provider works (Brevo, Mailgun, Amazon SES, Gmail with an app password). For production use a domain you own and set up its SPF and DKIM records with the provider, or the emails land in spam.

Emails are sent in the background; if sending fails, the order or sign-up still succeeds and the error is logged. With `SMTP_HOST` empty no email is sent; the full message (including verification and password-reset links) is printed in the server log instead, which is handy locally.

## Redis setup

Redis is **optional and not used yet**. `REDIS_URL` is accepted in the settings so a cache can be added later (see [Future improvements](#future-improvements)). You do not need Redis to run or deploy this project.

## Running locally

```bash
npm run dev
```

- Site: <http://localhost:3000>
- API: <http://localhost:8000/api/v1> (health check: <http://localhost:8000/api/v1/health>)
- Admin panel: <http://localhost:3000/admin> (log in with the admin account from the seed)

Other useful scripts: `npm run typecheck` (both projects), `npm run build`.

## Seed the database

```bash
npm run seed
```

This is safe to run again and does the following:

| What | When |
| --- | --- |
| Admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` | always (skipped if those are empty) |
| 7 categories (suits only) | always |
| **Sample shop**: 8 customers, 38 articles with placeholder pictures, 60 orders over about 75 days in every status, reviews, 6 coupons, 6 newsletter subscribers | development only, once |

Sample customers sign in with `firstname.lastname@demo.example` (for example `ayesha.khan@demo.example`) and the password `Demo@12345` (or `SEED_DEMO_PASSWORD`). One is deactivated and one is unverified, so you can see those states. Try the coupons `WELCOME10` (10% off Rs. 3,000+) and `FLAT500` (Rs. 500 off Rs. 5,000+). The pictures are generated drawings labelled "SAMPLE IMAGE"; replace them from the admin panel.

```bash
npm run seed:reset    # removes only the sample data (customers @demo.example, DEMO- articles, their orders and reviews, sample coupons)
npm run seed:fresh    # reset, then create the sample data again
```

The sample data is never created when `NODE_ENV=production`, and `seed:reset` is refused there. Your real admin, categories and anything you added yourself are never touched by the reset. On the server, create the admin and categories with `npm run seed:prod` (after `npm run build`).

## Build

```bash
npm run build          # server (TypeScript to server/dist) and client (next build)
```

## Production

```bash
npm --prefix server run start       # node dist/server.js
npm --prefix client run start       # next start
```

The server refuses to start in production if `JWT_SECRET` is still a placeholder, `CLIENT_URL` is not `https://`, or Stripe is on without a webhook secret. In production the client sends strict security headers (content security policy, HSTS).

## Deployment

Target: **Vercel** (client), **AWS EC2** (API), **MongoDB Atlas** (database), **Cloudinary** (pictures), **Stripe** (payments).

> **Use one domain for both.** The shop at `www.example.com` (or `shop.example.com`) and the API at `api.example.com`. The login cookie is then a first-party cookie. With a `vercel.app` address talking to a different domain, Safari and some other browsers block the login cookie and nobody can sign in.

### 1. Database
Set up Atlas as in [MongoDB setup](#mongodb-setup).

### 2. API on EC2
1. Launch an **Ubuntu 22.04/24.04** instance (a `t3.small` is a good start). Security group: allow ports 22 (your IP only), 80 and 443. Do **not** open 8000. Attach an **Elastic IP** and add it to Atlas *Network Access*.
2. In your DNS, point `api.example.com` to the Elastic IP.
3. Connect by SSH, clone the project, run the one-time setup (installs Node 20, nginx, PM2, certbot, firewall):
   ```bash
   git clone <your-repo-url> women-clothing-store && cd women-clothing-store
   bash deploy/ec2-setup.sh
   ```
4. Create `server/.env` with the production values:
   ```env
   NODE_ENV=production
   PORT=8000
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=<48+ random characters>
   CLIENT_URL=https://www.example.com
   CLOUDINARY_...=
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SMTP_...=
   ADMIN_EMAIL=you@yourdomain.com
   ADMIN_PASSWORD=<a strong password>
   ```
   Restrict it: `chmod 600 server/.env`.
5. Build, create the admin and categories, start:
   ```bash
   npm --prefix server ci && npm --prefix server run build
   npm --prefix server run seed:prod
   cd server && pm2 start ecosystem.config.cjs && pm2 save
   ```
6. nginx and HTTPS:
   ```bash
   sudo cp deploy/nginx/api.conf.example /etc/nginx/sites-available/wcs-api
   sudo sed -i 's/api.example.com/api.yourdomain.com/' /etc/nginx/sites-available/wcs-api
   sudo ln -s /etc/nginx/sites-available/wcs-api /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```
7. Check: `curl https://api.yourdomain.com/api/v1/health` returns `"database": "connected"`.
8. Add the Stripe webhook ([Stripe setup](#stripe-setup)).

**Updating later:** `bash deploy/deploy.sh` (pulls, installs, builds, syncs indexes, reloads PM2 without dropping requests). Logs: `pm2 logs wcs-api`. Restart: `pm2 restart wcs-api`.

### 3. Client on Vercel
1. Import the repository at <https://vercel.com/new> and set **Root Directory** to `client`.
2. Add the environment variables: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1`, `NEXT_PUBLIC_APP_URL=https://www.yourdomain.com`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`.
3. Deploy, then add `www.yourdomain.com` under *Settings → Domains* and follow the DNS instructions.
4. Make sure `CLIENT_URL` on the server matches this exact address (add the bare domain too if it redirects: `https://www.yourdomain.com,https://yourdomain.com`), then restart the API (`pm2 restart wcs-api --update-env`).

`NEXT_PUBLIC_*` values are built into the site, so redeploy the client after changing them.

### 4. Go-live check
Run [spec section 66](#before-you-launch) end to end on the live site with a Stripe test card first, then switch Stripe to live keys.

## API documentation

Base URL: `/api/v1`. Responses: `{ success, message, data }` or `{ success: false, message, errors[] }`. Login is a cookie set by `/auth/login`; browsers send it automatically (`credentials: include`). **Auth**: *public*, *user* (signed in), *admin*. Admin routes need an account with the admin role.

### Health
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | public | API and database status |

### Auth `/auth`
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/register` | public | Create an account (and sign in) |
| POST | `/login` | public | Sign in |
| POST | `/logout` | public | Sign out |
| GET | `/me` | user | Current user |
| POST | `/forgot-password` | public | Email a reset link |
| POST | `/reset-password` | public | Set a new password with the link's token |
| POST | `/verify-email` | public | Confirm email with the link's token |
| POST | `/resend-verification` | user | Send the verification email again |
| PATCH | `/change-password` | user | Change password |

### Users `/users` (all user)
| Method | Path | Purpose |
| --- | --- | --- |
| PATCH | `/profile` | Update name and phone |
| PUT / DELETE | `/avatar` | Upload or remove the profile picture |
| POST | `/addresses` | Add an address |
| PATCH / DELETE | `/addresses/:id` | Edit or remove an address |

### Banners `/banners`

`GET /banners` (public, visible banners with a picture), `GET /banners/admin/all`, `POST /banners`, `PATCH /banners/:id`, `PUT /banners/reorder`, `PUT|DELETE /banners/:id/image?kind=desktop|mobile`, `DELETE /banners/:id` (admin).

### Categories `/categories`
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/` | public | Active categories |
| GET | `/:slug` | public | One category |
| GET | `/admin/all` | admin | All, including archived |
| POST | `/` | admin | Create |
| PATCH | `/:id` | admin | Update |
| PUT / DELETE | `/:id/image` | admin | Upload or remove the image |
| DELETE | `/:id` | admin | Delete, or archive when articles use it |

### Products `/products`
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/` | public | List with `q`, `category`, `minPrice`, `maxPrice`, `size`, `sort`, `featured`, `newArrival`, `bestSeller`, `onSale`, `page`, `limit` |
| GET | `/filters` | public | Price range and sizes available |
| GET | `/:slug` | public | One article |
| GET | `/:slug/related` | public | Related articles |
| GET | `/admin/all`, `/admin/:id` | admin | List and read, including drafts and archived |
| POST | `/images` | admin | Upload up to 8 images (5 MB each) |
| DELETE | `/images` | admin | Remove an uploaded image |
| POST | `/` | admin | Create |
| PATCH | `/:id` | admin | Update |
| DELETE | `/:id` | admin | Archive; with `?permanent=true` delete for good (refused if it was ever ordered) |

### Cart `/cart`
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/price` | public | Price a cart on the server (guests too) |
| GET | `/` | user | Saved cart |
| PUT | `/` | user | Save the cart |

### Wishlist `/wishlist` (all user)
`GET /`, `GET /ids`, `POST /:productId`, `DELETE /:productId`.

### Coupons `/coupons`
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET, POST | `/` | admin | List, create |
| PATCH, DELETE | `/:id` | admin | Update, delete |

> Coupons are managed by admins only. Customers apply a code by sending `couponCode` to `/orders/quote` and `/orders`; the server checks it and returns the discount.

### Orders `/orders` (all user)
| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/quote` | Totals for the cart, delivery method and coupon |
| POST | `/` | Place an order (cash on delivery or card) |
| GET | `/` | My orders |
| GET | `/:id` | One of my orders |
| POST | `/:id/cancel` | Cancel while pending and unpaid (later, contact the shop; admins can cancel and refund) |

### Payments `/payments`
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/orders/:id/intent` | user | Start a Stripe payment for my order |
| POST | `/webhook` | Stripe signature | Stripe events (`payment_intent.succeeded`, `payment_intent.payment_failed`) |

### Reviews `/reviews`
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/latest` | public | Latest reviews |
| GET | `/product/:productId` | public | Reviews and rating summary for an article |
| GET | `/product/:productId/mine` | user | Can I review this, and my review |
| POST | `/` | user | Write a review (delivered purchase only) |
| PATCH, DELETE | `/:id` | user | Edit or delete my review |
| GET | `/admin/all` | admin | All reviews |
| DELETE | `/admin/:id` | admin | Remove any review |

### Newsletter `/newsletter`
`POST /subscribe` (public).

### Admin `/admin` (all admin)
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/dashboard` | Dashboard figures |
| GET | `/analytics` | Analytics for a date range |
| GET | `/orders`, `/orders/:id` | Orders with filters, order detail |
| PATCH | `/orders/:id/status` | Move an order to its next status |
| GET | `/customers`, `/customers/:id` | Customers and detail |
| PATCH | `/customers/:id/status` | Activate or deactivate |

Admin status moves: `pending → confirmed | cancelled`, `confirmed → processing | shipped | cancelled`, `processing → shipped | cancelled`, `shipped → delivered`. A card order that is not yet paid can only be cancelled. Cancelling a paid card order refunds it through Stripe.

## Security

- **Passwords**: bcrypt (12 rounds); password rules enforced on server and client.
- **Login**: JWT (HS256 only) in an `HttpOnly`, `Secure` cookie (`SameSite=None` in production, `Lax` locally); a password change signs out other devices; deactivated accounts are blocked on every request.
- **Roles**: every admin route checks the admin role on the server.
- **CSRF**: because the production cookie is cross-site, state-changing requests whose `Origin`/`Referer` is not in `CLIENT_URL` are rejected.
- **Headers**: Helmet on the API; the client sends a content security policy, HSTS, `X-Frame-Options: DENY`, `nosniff`, a referrer policy and a permissions policy in production.
- **CORS**: only `CLIENT_URL` origins, with credentials.
- **Rate limits**: 300 requests per 15 minutes per IP overall; sign-in limited per IP + email and per account; registration, password reset, uploads, order placement and newsletter signups have their own, stricter limits.
- **Input**: every body, query and URL parameter is validated with Zod; keys starting with `$` or containing `.` are removed (NoSQL injection); JSON bodies are capped at 200 KB; only JSON is accepted; uploads must be images up to 5 MB.
- **Money**: prices, stock, discounts and totals come from the database, never from the browser; the Stripe webhook is verified by signature; orders are only marked paid by Stripe's webhook; customers never receive payment IDs.
- **Secrets**: only in `.env` files that are git-ignored; the server refuses unsafe production settings; `NEXT_PUBLIC_*` holds no secrets. The seed takes the admin login from the environment and has no built-in real credentials.
- **Errors**: clients get friendly messages; stack traces and internals stay in the server log.
- Dependencies are checked with `npm audit` (no known vulnerabilities at the time of release). Re-run it regularly.

## Before you launch

1. Put your real shop details in `client/lib/site.ts` and `server/config/store.ts` (email, phone, address, opening hours, delivery fees). They are placeholders now.
2. Have the policy pages (shipping, returns, privacy, terms) reviewed; they are generic text.
3. Test the full journey with Stripe test keys, in this order: sign up, verify email, add an article in the admin (with pictures), see it in the shop, add to cart, apply a coupon, place a cash order and a card order, move the order to delivered in the admin, write a review, check the dashboard.
4. Confirm emails are not landing in spam, and that login works in Safari.
5. Switch Stripe to live keys last.

## Future improvements

- Redis cache for product lists and rate limits (needed before running more than one API instance)
- Automated tests (unit, API and end-to-end) and a CI pipeline
- Order tracking numbers and courier integration, invoices as PDF
- Stock notifications ("tell me when back in stock") and abandoned-cart emails
- Wishlist sharing, size guide per category, product Q&A
- Urdu language support and an RTL layout
- JazzCash / Easypaisa payments
- Admin: staff roles, settings page (delivery fees, store details) and an activity log
- Image uploads straight to Cloudinary from the browser
- Error monitoring (for example Sentry) and uptime alerts

## Deploying without your own domain (Vercel + Render, cash on delivery only)

Use this when the shop is on `something.vercel.app` and the API is on `something.onrender.com`. Those are different sites, so browsers such as Safari block the login cookie. The fix is to let the shop pass API calls through:

1. Deploy the API on Render (root directory `server`, build `npm install --include=dev && npm run build`, start `npm start`) with the values from `server/.env.example`. Leave all `STRIPE_*` empty: card payment is then switched off everywhere.
2. Set `CLIENT_URL` on the API to the exact Vercel address, for example `https://my-shop.vercel.app`.
3. In Vercel, set `NEXT_PUBLIC_API_URL=/api/v1` and `API_PROXY_TARGET=https://your-api.onrender.com`, leave `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` empty, then redeploy.
4. In MongoDB Atlas, Network Access, allow `0.0.0.0/0` (Render's addresses change), and use a strong database password.

When you later buy a domain, put the shop on `www.yourdomain` and the API on `api.yourdomain`, set `NEXT_PUBLIC_API_URL=https://api.yourdomain/api/v1`, and remove `API_PROXY_TARGET`.
