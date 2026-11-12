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
12. [Planned improvements](#planned-improvements)
13. [Before you launch](#before-you-launch)

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

### Client (`client/.env.local` on your computer, the Vercel dashboard when live)

| Variable | On your computer | On Vercel |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | `/api/v1` (exactly, starting with a slash) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | the website's own address, for example `https://your-site.vercel.app`. It is used for links, the sitemap and share previews |
| `API_PROXY_TARGET` | not needed | the **backend's** address, with no `/api/v1` and no trailing `/` |

Why `/api/v1` and not the backend's full address on Vercel: `localhost` means "this computer", so a visitor's browser could never reach `localhost:8000`. With `/api/v1` the browser asks the website itself, and the website forwards the request to the backend (`API_PROXY_TARGET`). The login cookie then belongs to the website's own address, so login works in every browser.

Rules for these variables:
- A variable must never be left with an **empty value**. Either give it a value or do not add it.
- Everything starting with `NEXT_PUBLIC_` is visible to every visitor, so never put a secret there.
- Never commit `.env` files (they are in `.gitignore`).
- Next.js reads them when it starts or builds, so restart it (or redeploy on Vercel) after any change.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is not used. Leave it out.

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

**Where the button goes.** The form asks "Where should the banner go when clicked?" with four choices:
- **A specific article:** pick the article from a list of your active articles. The button opens that article's page.
- **A category:** pick a category.
- **The whole shop.**
- **Another link (advanced):** a page on your store (starting with `/`) or a full `https://` link.

Incomplete links such as `/category` or `/product` are refused, because those pages need a name after them. If an old banner still has one of those links, it opens the shop instead of "Page not found". Edit the banner and choose the article to fix it properly.

### How the home page sections fill
- **New arrivals**: articles marked "New arrival".
- **Featured collection**: articles marked "Featured".
- **Best sellers**: articles marked "Best seller".
- **Trending now**: the 4 most sold articles. It fills itself from orders (cancelling an order takes the sales back), and with no sales yet it shows the newest articles.

## Deployment

The website (`client/`) and the API (`server/`) are **two separate projects**. The setup used for this shop is **both on Vercel**, from the same GitHub repository, with the database on MongoDB Atlas and pictures on Cloudinary. Render for the API is described as an alternative below.

### How the pieces connect

| Link | Goes into | Variable |
| --- | --- | --- |
| Website address | the **backend** project | `CLIENT_URL` |
| Backend address | the **website** project | `API_PROXY_TARGET` |

Use the project's **domain** address (the short `https://<project>.vercel.app`), never a long per-deployment address, which is tied to one build and changes with every deploy.

### Step 0: Prepare
1. Push the code to GitHub (`git add .`, `git status`, `git commit`, `git push`). `git status` must not list any `.env` file.
2. In MongoDB Atlas, **Network Access** must have `0.0.0.0/0` as Active (Vercel's addresses change). Extra entries for your own IP do no harm.
3. `MONGODB_URI` must contain a **database name** (see the Atlas checklist above). Use the same string and the same name in every place, or two places will read two different databases.
4. Check that `server/api/index.ts` and `server/vercel.json` exist. They let the API run on Vercel.

### Step 1: Deploy the website
1. Vercel → **Add New → Project** → import the repository.
2. **Root Directory** `client`, framework Next.js.
3. Environment variables: `NEXT_PUBLIC_API_URL` = `/api/v1`. Do not add `NEXT_PUBLIC_APP_URL` yet (a missing variable is fine, an empty one breaks the build).
4. **Deploy**. When it is Ready, copy the project's address. This is the **website address**.
5. Add `NEXT_PUBLIC_APP_URL` = the website address, then **Redeploy**.

### Step 2: Deploy the backend
1. Vercel → **Add New → Project** → import the **same** repository again, with a different project name.
2. **Root Directory** `server`, **Framework Preset** `Other`.
3. Environment variables (type in brackets):

   | Variable | Value |
   | --- | --- |
   | `NODE_ENV` (plain) | `production` |
   | `CLIENT_URL` (plain) | the website address, no trailing `/` |
   | `MONGODB_URI` (secret) | the Atlas string with the database name |
   | `JWT_SECRET` (secret) | 32 or more random characters |
   | `CLOUDINARY_CLOUD_NAME` (plain) | from Cloudinary |
   | `CLOUDINARY_API_KEY` (plain) | from Cloudinary |
   | `CLOUDINARY_API_SECRET` (secret) | from Cloudinary |

   Do not add `PORT` (Vercel ignores it), `ADMIN_EMAIL` or `ADMIN_PASSWORD` (they are only for the seed command on your computer), `STRIPE_*`, or `SMTP_*` (optional, see below).

   Create a `JWT_SECRET` with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
4. **Deploy**. Copy the backend's **domain** address.
5. Test `https://<backend>/api/v1/health`. It must show JSON with `"success": true`.

### Step 3: Connect the website to the backend
1. On the **website** project, add `API_PROXY_TARGET` = the backend address (no `/api/v1`, no trailing `/`).
2. **Redeploy** the website. Vercel reads variables only when it builds.
3. Test `https://<website>/api/v1/health`. It must show the same JSON.

### Step 4: Create the admin and categories on the live database
The live database starts empty. From your computer, put the live `MONGODB_URI`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`, then in the `server` folder:

```bash
npm run build
npm run seed:prod
```

Afterwards put your local `.env` back to the development values and remove `ADMIN_PASSWORD`. Sign in at `/admin`, check the categories in the header, and add your articles.

### Step 5: Test the live shop
Register a customer, place a cash-on-delivery order, then change its status from the admin Orders page. Add an article with a front and a back picture (each under 4 MB) and check that it shows on the home page and in its category.

### Email (SMTP) can wait
The shop works without SMTP. Emails (order confirmation, shipped, delivered, cancelled, welcome, password reset) are simply not sent, and customers cannot reset a forgotten password by themselves. To turn emails on later, add the `SMTP_*` variables to the backend project (`SMTP_PASSWORD` as secret) and **Redeploy** the backend. The confirmation email goes out when a customer places an order. Changing an order to Confirmed or Processing sends nothing.

### Things to know about the API on Vercel
- It runs as short-lived functions, so the first request after a quiet period is slower.
- Each function keeps its own database connection (this is why Atlas needs `0.0.0.0/0`).
- A request body over about 4.5 MB is refused, so keep article pictures under 4 MB.
- This route is less tested than a normal always-on server. If you meet problems, Render (below) is the safer home for the API.

### Alternative: the API on Render
- New **Web Service**, **Root Directory** `server`, build command `npm install --include=dev && npm run build`, start command `npm start`, health check path `/api/v1/health`.
- The same environment variables as above (plus `SMTP_*` if wanted).
- A free Render service sleeps after about 15 minutes idle, so the first visit afterwards takes 30 to 60 seconds.
- Use the Render address as `API_PROXY_TARGET` on the website project.

### Linux server (optional)
`deploy/` has scripts and an nginx example for a VPS or EC2 server running the API with PM2.

### When an address changes (for example, a custom domain)
Update the variable on the **other** project and redeploy it: the new website address goes into `CLIENT_URL` (backend) and `NEXT_PUBLIC_APP_URL` (website); a new backend address goes into `API_PROXY_TARGET` (website).

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
| Vercel build fails with `Invalid URL`, `input: ''` in `app/layout.tsx` | `NEXT_PUBLIC_APP_URL` exists with an empty value. Give it the website address or delete it, then redeploy. (The code now also treats an empty value as "not set") |
| Vercel build fails with "No Output Directory named public found" (backend) | In the backend project's Settings → General, set **Output Directory** to `dist` and redeploy |
| The backend address opens a Vercel login page | Settings → Deployment Protection: turn it off for production |
| A banner button shows "Page not found" | The banner link was typed as `/category`. Edit the banner and choose an article or category from the list. Old `/category` links now open the shop |
| Live site shows no categories or articles | The live database is empty (run `npm run seed:prod`, then add articles in the admin panel), or the live `MONGODB_URI` names a different database from the one your articles are in. Check **Browse Collections** in Atlas |
| Registration or login fails on the live site | `CLIENT_URL` on the backend does not match the website address, or `API_PROXY_TARGET` is wrong or the website was not redeployed |
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

## Planned improvements

These are ideas, **not built yet**:
- **Courier booking with PostEx.** A "Book with PostEx" button on the admin order page that sends the order to PostEx's merchant API (it needs a PostEx merchant account, an API token and a pickup address code), saves the tracking number on the order, and shows tracking to the customer. City names at checkout would come from PostEx's list of cities. PostEx's documented endpoints include creating, tracking and listing orders, but the exact field rules should be checked against PostEx's own merchant document before building.
- A phone-number format check and a city dropdown at checkout.
- A notification to the owner for every new order, and an email when the admin confirms an order.
- A "Returned" order status for refused cash-on-delivery parcels, putting the stock back.
- A "show in Trending" option per article, bulk actions in the Articles list, low-stock alerts and an orders export.
- Automatic tests for ordering, stock and the status rules, and error monitoring.

## Before you launch

- [ ] Put your real contact details, address, social links and shop name in `client/lib/site.ts` and `server/config/store.ts` (they are placeholders).
- [ ] Have the policy pages (Terms, Privacy, Shipping, Returns, About) reviewed. They are generic text and not legal advice.
- [ ] Replace the sample pictures with real photographs: a front picture first, then a back picture for each article.
- [ ] Delete the sample data from a live database (`npm run seed:reset`) and add your real articles.
- [ ] Set `NODE_ENV=production`, a strong `JWT_SECRET`, and an `https://` `CLIENT_URL` on the host.
- [ ] Configure email (`SMTP_*`) if you want customers to get order and password-reset emails.
- [ ] Place a test order on the live site and move it through the statuses from the admin panel.
- [ ] Add a custom domain when you have one, and then update `CLIENT_URL` and `NEXT_PUBLIC_APP_URL`.