# Zahra's: Women's Suits Store

An online store for women's suits in Pakistan. Customers browse, add to cart and order with **cash on delivery**. The shop owner manages everything from an admin panel: articles, categories, homepage banners, orders, customers, reviews and coupons. Prices are in PKR (Rs.).

- **Suits only.** The shop sells suits (lawn, khaddar, three piece and similar). There are no tops, trousers, shawls or accessories.
- **Cash on delivery only.** There are no card payments. The Stripe code is still in the project but switched off (see "Card payments").
- **No email confirmation.** A new account works straight away. Nobody has to verify an email.

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Folder structure](#folder-structure)
4. [Run it on your computer](#run-it-on-your-computer)
5. [Environment variables](#environment-variables)
6. [Seed the database (sample data and admin)](#seed-the-database)
7. [Using the admin panel](#using-the-admin-panel)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [API reference](#api-reference)
11. [Security](#security)
12. [Before you launch](#before-you-launch)

## Features

**Shop (customers)**
- Home page with a banner slider, New arrivals, Featured collection, Best sellers, Trending now, customer reviews and newsletter signup.
- Categories, search, filters (price, size, sale), sorting, and a product page with size choice, stock, reviews and related articles.
- Every article has a **front picture and a back picture**. The card shows the front, and the back appears on hover.
- Cart (kept for guests and saved for signed-in users), wishlist, coupon codes, delivery options and checkout with cash on delivery.
- Accounts: register, sign in, forgot password, profile, address book, order history, order cancelling (only while the order is still pending).
- Reviews, only from customers who received the article.
- Mobile-friendly header with a side menu, and a footer with shop links, policies and contact details.

**Admin panel (`/admin`)**
- **Dashboard and analytics** with sales, orders and best-selling articles.
- **Articles**: add or edit with several pictures (the first is the front, the next is the back), sizes with stock per size, price and discount price, and status. Stock reaching zero marks the article "Out of stock" by itself, and restocking brings it back.
- **Archive and delete** (see [Archive, restore and delete](#archive-restore-and-delete)).
- **Categories**: add, edit, picture, show or hide, archive.
- **Homepage banners**: add, replace the picture, edit the text and button, reorder, show or hide (up to 8). The banner keeps one fixed size, however big the uploaded picture is.
- **Orders**: filter and search, open an order to see what to pack and where it goes, and change its status from a **dropdown**.
- **Customers**, **reviews** (remove any), **coupons**.
- Action buttons use icons (view, edit, archive, restore, delete, reorder) with a tooltip.

## Tech stack

| Part | Technology |
| --- | --- |
| Client (`client/`) | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Redux Toolkit + RTK Query, React Hook Form + Zod, lucide-react icons |
| Server (`server/`) | Node.js, Express, TypeScript, Zod validation |
| Database | MongoDB (Atlas) with Mongoose |
| Login | JWT in an HTTP-only cookie |
| Pictures | Cloudinary |
| Email | Nodemailer (optional, any SMTP service) |

## Folder structure

```
women-clothing-store/
├── client/                 Next.js website and admin panel
│   ├── app/                Pages: (shop), account, checkout, auth, admin
│   ├── components/         UI parts: layout, home, shop, admin, ...
│   ├── services/           RTK Query API calls
│   ├── lib/                Helpers, validation schemas, site details (lib/site.ts)
│   └── public/seed/        Sample article pictures
├── server/                 Express API
│   ├── routes/ controllers/ services/ models/ validations/ middleware/
│   ├── config/             Environment and database
│   ├── seed/               Sample data and the admin account
│   ├── api/index.ts        Entry used when the API runs on Vercel
│   ├── server.ts           Entry used everywhere else (Render, your computer, a VPS)
│   └── vercel.json         Vercel settings for the API
└── deploy/                 Optional scripts for hosting on a Linux server (EC2 and nginx)
```

## Run it on your computer

You need **Node.js 20.9 or newer** and a MongoDB database (a free MongoDB Atlas cluster is fine).

**1. Install**

```bash
cd server && npm install
cd ../client && npm install
```

**2. Set up the server.** Copy `server/.env.example` to `server/.env` and fill in the values (see [Environment variables](#environment-variables)). For development, use:

```dotenv
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=<your MongoDB string, with the database name, for example .../women-clothing-store?...>
JWT_SECRET=<any random text of 32 or more characters>
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<a strong password>
```

**3. Set up the client.** Create `client/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**4. Load the data (once)**

```bash
cd server
npm run seed
```

**5. Start both** (in two terminals):

```bash
cd server && npm run dev      # API on http://localhost:8000
cd client && npm run dev      # Website on http://localhost:3000
```

Open `http://localhost:3000`. The admin panel is at `http://localhost:3000/admin` (sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`).

The server prints `MongoDB connected: ...` and `API running ... (development)`. A line saying "SMTP is not configured" is only a warning: the shop works, it just does not send emails.

### MongoDB Atlas checklist

1. **Database Access**: create a user and note the password. Use letters and numbers, or URL-encode special characters (`@` becomes `%40`).
2. **Network Access**: allow your IP. For Vercel or Render, allow `0.0.0.0/0`.
3. **Connection string**: **Connect → Drivers → Node.js**. Put the **database name** after the host, for example `.../women-clothing-store?...`. Without a name MongoDB uses an empty database called `test`, and the shop shows no articles.
4. If the `mongodb+srv://` string fails on your network with `queryTxt ETIMEOUT` or `querySrv ECONNREFUSED`, switch on **Legacy URI String** (Node.js driver 2.2.12 or later) in the connect dialog and use the longer `mongodb://` string with three hosts. It does not need the DNS lookups that some networks block.

## Environment variables

### Server (`server/.env`)

| Variable | Needed | What it is |
| --- | --- | --- |
| `NODE_ENV` | yes | `development` on your computer, `production` when live |
| `PORT` | no | API port, default `8000` |
| `MONGODB_URI` | **yes** | MongoDB connection string, including the database name |
| `JWT_SECRET` | **yes** | At least 32 random characters. Production refuses the placeholder |
| `JWT_EXPIRES_IN` | no | Login length, default `7d` |
| `CLIENT_URL` | **yes** | The website's address. Local: `http://localhost:3000`. Live: your `https://` address. A trailing `/` is removed. Several can be separated by commas |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | for pictures | Needed to upload article, category and banner pictures from the admin panel |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | no | Order and password-reset emails. For Gmail: host `smtp.gmail.com`, port `587`, and an **app password** (not your normal password) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for the seed | The first admin account. Remove the password afterwards |
| `SEED_DEMO_PASSWORD` | no | Password of the sample customers (development only), default `Demo@12345` |
| `MONGODB_DNS_SERVERS` | no | Only for `mongodb+srv://` problems on your own computer. Do not set it on a host |
| `STRIPE_*`, `REDIS_URL` | no | Not used. Leave empty |

### Client (`client/.env.local`, or the hosting dashboard)

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API address. Local: `http://localhost:8000/api/v1`. On Vercel with the proxy: `/api/v1` |
| `API_PROXY_TARGET` | Vercel only: the address of your API, with no `/api/v1` and no trailing `/` (for example `https://your-api.onrender.com`) |
| `NEXT_PUBLIC_APP_URL` | The shop's own address, used for links, the sitemap and share previews |

Everything starting with `NEXT_PUBLIC_` is visible to every visitor, so never put a secret there. Never commit `.env` files (they are in `.gitignore`). Next.js reads these only when it starts, so restart it after a change.

## Seed the database

```bash
cd server
npm run seed
```

Safe to run again.

| What | When |
| --- | --- |
| Admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD` | always (skipped if empty) |
| Categories (suits only) | always |
| **Sample shop**: sample customers, articles with front and back placeholder pictures, orders in every status, reviews, coupons | development only, once |

Sample customers sign in as `firstname.lastname@demo.example` (for example `ayesha.khan@demo.example`) with the password `Demo@12345`. Try the coupons `WELCOME10` and `FLAT500`. The pictures are drawings labelled "SAMPLE IMAGE"; replace them from the admin panel.

| Command | What it does |
| --- | --- |
| `npm run seed:reset` | Removes only the sample data |
| `npm run seed:fresh` | Resets, then creates the sample data again. Use this on an old database to also get the back pictures and drop the retired categories |
| `npm run seed:prod` | After `npm run build`: creates the admin and categories only, no sample data. Use it for the live database |
| `npm run make-admin` | Turns an existing account into an admin |

The sample data is never created when `NODE_ENV=production`.

## Using the admin panel

Sign in with the admin account and open `/admin`.

### Add an article
**Articles → Add Article.** Fill in the name, category, price, sizes and stock. Upload the pictures: **the first picture is the front and the second is the back**. The back picture appears when a customer hovers over the card. Set the status to **Active** to show it in the store.

### Archive, restore and delete

Each row in **Articles** has these icons:

| Icon | What it does |
| --- | --- |
| Eye | Opens the article in the store (only for active articles) |
| Pencil | Edit |
| Archive box | **Archive**: hides the article everywhere (home page, categories, search, wishlists). Nobody can order it. Use this when an article is out of stock or you stop selling it for now |
| Circular arrow (on archived rows) | **Restore**: puts the article back in the store, in its categories and on the home page, and customers can order it again. If it has no stock it shows as "Out of stock" until you add stock |
| Red bin | **Delete permanently**: removes the article, its pictures and its reviews for good. This cannot be undone |

Notes:
- Old orders are not affected by deleting an article. Each order keeps its own copy of the name, price and picture.
- An article that is in an order not yet delivered or cancelled cannot be deleted. Finish or cancel those orders first, or archive it.
- Archived articles are still listed in the admin panel. Filter by **Status → Archived** to find them.

### Change an order's status
**Orders.** In the list, use the **Status** dropdown in a row, or open the order and use **Move this order to** (with an optional note) and press **Update status**. The dropdown offers only the moves that are allowed:

`pending → confirmed or cancelled`, `confirmed → processing, shipped or cancelled`, `processing → shipped or cancelled`, `shipped → delivered`.

Cancelling asks for a confirmation and puts the stock back. Delivered and cancelled orders cannot change again. Customers can cancel only their own orders that are still pending.

### Homepage banners
**Homepage banners.** Add a banner with a picture, headline, short text and button. Reorder with the arrow icons, show or hide with the eye icon. The picture is shown at one fixed size on the right of the banner. With no banners, the home page shows a plain welcome section instead.

### How the home page sections fill
- **New arrivals**: articles marked "New arrival".
- **Featured collection**: articles marked "Featured".
- **Best sellers**: articles marked "Best seller".
- **Trending now**: the 4 most sold articles. It fills itself from orders (cancelling an order takes the sales back), and with no sales yet it shows the newest articles.

## Deployment

The website (client) and the API (server) are deployed separately. The simplest setup with no custom domain is **Vercel for the website** and **Render for the API**.

### 1. Database
Use MongoDB Atlas. Allow `0.0.0.0/0` in **Network Access** and include the database name in `MONGODB_URI`.

### 2. API on Render
- New **Web Service** from your GitHub repository, **Root Directory** `server`.
- **Build command**: `npm install --include=dev && npm run build`. **Start command**: `npm start`. **Health check path**: `/api/v1/health`.
- Environment variables: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL=https://<your-site>.vercel.app`, the three `CLOUDINARY_*` values, and optionally `SMTP_*`.
- A free Render service sleeps after about 15 minutes idle, so the first visit after a quiet period takes 30 to 60 seconds.

### 3. Website on Vercel
- **Root Directory** `client`.
- Environment variables: `NEXT_PUBLIC_API_URL=/api/v1` and `API_PROXY_TARGET=https://<your-api>.onrender.com` (no `/api/v1`, no trailing `/`).
- **Redeploy** after changing variables, because Vercel reads them at build time.

The website forwards `/api/v1/*` to your API, so the login cookie belongs to the website's own address. This is why login works without a custom domain.

### 4. Check it
Open `https://<your-site>.vercel.app/api/v1/health`. It should show JSON with `"success": true`. Then create the admin and categories on the live database (from your computer, with the production `MONGODB_URI` and the admin variables in `server/.env`):

```bash
cd server
npm run build
npm run seed:prod
```

Remove `ADMIN_PASSWORD` from the environment afterwards.

### API on Vercel instead of Render (optional)
`server/api/index.ts` and `server/vercel.json` let the API run on Vercel as a second project (Root Directory `server`, the same environment variables as for Render). This is not as thoroughly tested as the Render route. On Vercel the API runs as short-lived functions: the first request after a quiet period is slower, each function keeps its own database connection (Atlas needs `0.0.0.0/0`), and a request body over about 4.5 MB is refused, so keep article pictures under 4 MB.

### Linux server (optional)
`deploy/` has scripts and an nginx example for a VPS or EC2 server running the API with PM2.

## Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| Server stays silent after "SMTP is not configured" | It is waiting for MongoDB. Wait about 10 seconds for the error, then see the Atlas checklist |
| `queryTxt ETIMEOUT` or `querySrv ECONNREFUSED` | Your network blocks the DNS lookups for `mongodb+srv://`. Use the Legacy (`mongodb://`) string |
| "Could not connect to any servers ... IP isn't whitelisted" | Add your IP, or `0.0.0.0/0`, in Atlas → Network Access, and wait until it is Active |
| `bad auth : authentication failed` | Wrong database user or password in `MONGODB_URI`. Remove `<` `>` around the password, URL-encode special characters, or reset the password in Database Access |
| Shop shows no articles | The connection string has no database name (it uses `test`), or the database is empty. Add `/women-clothing-store` after the host, then run `npm run seed` |
| CORS error on register or login | `CLIENT_URL` does not match the website's address, or `NODE_ENV` is `production` while testing on `http://localhost`. Local needs `NODE_ENV=development` and `CLIENT_URL=http://localhost:3000` |
| Live site: `500 FUNCTION_INVOCATION_FAILED` on the API project | A missing environment variable, a wrong Root Directory (must be `server`), or Atlas blocking Vercel. Open the project's **Logs** and read the last red line |
| Live site shows no articles | `API_PROXY_TARGET` or `NEXT_PUBLIC_API_URL` is wrong or the site was not redeployed, or the live database is empty (add articles from the admin panel) |
| Pictures cannot be uploaded | The Cloudinary values are missing or wrong |
| No emails are sent | `SMTP_*` is not set. The shop works without it |

## API reference

Base URL: `/api/v1`. Responses look like `{ success, message, data }`, or `{ success: false, message, errors[] }`. Login is a cookie set by `/auth/login`. **Auth** column: *public*, *user* (signed in) or *admin*.

| Area | Endpoints |
| --- | --- |
| Health | `GET /health` |
| Auth `/auth` | `POST /register`, `POST /login`, `POST /logout`, `GET /me`, `POST /forgot-password`, `POST /reset-password`, `PATCH /change-password` (user) |
| Users `/users` (user) | `PATCH /profile`, `PUT\|DELETE /avatar`, `POST /addresses`, `PATCH\|DELETE /addresses/:id` |
| Banners `/banners` | `GET /` (public), admin: `GET /admin/all`, `POST /`, `PATCH /:id`, `PUT /reorder`, `PUT\|DELETE /:id/image`, `DELETE /:id` |
| Categories `/categories` | `GET /`, `GET /:slug` (public), admin: `GET /admin/all`, `POST /`, `PATCH /:id`, `PUT\|DELETE /:id/image`, `DELETE /:id` |
| Products `/products` | Public: `GET /` (with `q`, `category`, `minPrice`, `maxPrice`, `size`, `sort`, `featured`, `newArrival`, `bestSeller`, `onSale`, `page`, `limit`), `GET /filters`, `GET /:slug`, `GET /:slug/related`. Admin: `GET /admin/all`, `GET /admin/:id`, `POST /images`, `DELETE /images`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| Cart `/cart` | `POST /price` (public), `GET /`, `PUT /` (user) |
| Wishlist `/wishlist` (user) | `GET /`, `GET /ids`, `POST /:productId`, `DELETE /:productId` |
| Coupons `/coupons` (admin) | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| Orders `/orders` (user) | `POST /quote`, `POST /`, `GET /`, `GET /:id`, `POST /:id/cancel` |
| Reviews `/reviews` | `GET /latest`, `GET /product/:productId` (public), `GET /product/:productId/mine`, `POST /`, `PATCH\|DELETE /:id` (user), admin: `GET /admin/all`, `DELETE /admin/:id` |
| Newsletter | `POST /newsletter/subscribe` (public) |
| Admin `/admin` | `GET /dashboard`, `GET /analytics`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`, `GET /customers`, `GET /customers/:id`, `PATCH /customers/:id/status` |

**Archive and delete an article:** `DELETE /products/:id` archives it (status `archived`, hidden from the store and not orderable). `DELETE /products/:id?permanent=true` removes it for good, and is refused while the article is in an order that is pending, confirmed, processing or shipped. **Restore:** `PATCH /products/:id` with `{ "status": "active" }`. An article with no stock becomes `out_of_stock` instead.

**Order status:** `PATCH /admin/orders/:id/status` with `{ "status": "...", "note": "..." }`. Allowed moves are listed under "Change an order's status".

The sign-up flow no longer sends a verification email. The old `/auth/verify-email` and `/auth/resend-verification` routes are still in the code but nothing uses them.

## Card payments

The shop is cash on delivery only. The Stripe code (payment page, webhook and `STRIPE_*` settings) is still in the project but switched off, because no Stripe key is set and `CARD_PAYMENTS_ENABLED` hides the card option at checkout. To bring cards back later you would need a Stripe account, the keys, and a webhook.

## Security

- Passwords are hashed. Login is an HTTP-only cookie, so page scripts cannot read it.
- Public sign-up always creates a customer. Only the seed or `make-admin` can create an admin.
- Every admin route checks the admin role on the server. Prices, stock and totals are always calculated on the server, never trusted from the browser.
- Input is checked with Zod, and the API is rate-limited and uses Helmet security headers.
- Never commit `.env` files or share `JWT_SECRET`, the database password or Cloudinary secrets. If one leaks, change it.
- Use a strong admin password, and remove `ADMIN_PASSWORD` from the hosting settings after the first seed.

## Before you launch

- [ ] Put your real contact details, address, social links and shop name in `client/lib/site.ts` and `server/config/store.ts` (they are placeholders).
- [ ] Have the policy pages (Terms, Privacy, Shipping, Returns, About) reviewed. They are generic text and not legal advice.
- [ ] Replace the sample pictures with real photographs: a front picture first, then a back picture for each article.
- [ ] Delete the sample data from a live database (`npm run seed:reset`) and add your real articles.
- [ ] Set `NODE_ENV=production`, a strong `JWT_SECRET`, and an `https://` `CLIENT_URL` on the host.
- [ ] Configure email (`SMTP_*`) if you want customers to get order and password-reset emails.
- [ ] Place a test order on the live site and move it through the statuses from the admin panel.
- [ ] Add a custom domain when you have one, and then update `CLIENT_URL` and `NEXT_PUBLIC_APP_URL`.
