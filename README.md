# ☕ Digital QR Menu for Cafés

A free, view-only digital menu system. Customers scan a QR code and see the
café's categories, items, photos, descriptions and prices — nothing else.
No ordering, no cart, no checkout, no accounts. Admins manage everything
from a separate, authenticated dashboard.

> **کورتە بە کوردی:** ئەم پڕۆژەیە سیستەمێکی تەواوی Digital QR Menu ـە بۆ
> کافێ. Customer تەنیا بە سکانکردنی QR Code مێنیو دەبینێت (وێنە، ناو،
> نرخ) و هیچ داواکارییەک ناتوانێت بکات. Admin لە دووای login بوونی، لە
> Dashboard ـەوە هەموو شتێک بەڕێوە دەبات (Categories, Items, Settings).
> هەنگاوەکانی دامەزراندن لە خوارەوە بە ئینگلیزی ڕوونکراونەتەوە — هەر
> کۆمانداکە copy/paste بکە، پێویست بە داهێنانی زۆر نییە.

---

## 1. Tech stack

| Layer          | Choice                                              |
| -------------- | ---------------------------------------------------- |
| Frontend       | Plain HTML, CSS, JavaScript (no build step, no framework) |
| Hosting        | GitHub Pages (or any static host — Netlify, Vercel, Cloudflare Pages) |
| Backend / DB   | Supabase (Postgres)                                  |
| Auth           | Supabase Auth (email + password) — admin only        |
| Image storage  | Supabase Storage (public bucket `menu-images`)        |
| Languages      | Kurdish (Sorani, RTL, default) · Arabic (RTL) · English (LTR) |

Everything runs on free tiers. See [§10 Free-first architecture](#10-free-first-architecture--limits).

---

## 2. Project structure

```
qr-menu-cafe/
├── index.html                  # Public menu (view-only)
├── admin/
│   ├── index.html               # Admin login
│   ├── dashboard.html           # Overview (counts)
│   ├── categories.html          # Manage categories
│   ├── items.html                # Manage menu items
│   └── settings.html             # Café name, logo, background, theme, currency
├── assets/
│   ├── css/
│   │   ├── style.css             # Public menu styles
│   │   └── admin.css             # Dashboard styles
│   └── js/
│       ├── config.example.js     # Copy → config.js, add your Supabase keys
│       ├── supabaseClient.js     # Shared Supabase client
│       ├── i18n.js                # UI translations (ku/ar/en) + RTL/LTR
│       ├── menu.js                # Public menu logic (fetch + render)
│       ├── admin-common.js        # Auth guard, sidebar, toasts, image upload
│       ├── admin-auth.js          # Login page logic
│       ├── admin-dashboard.js     # Overview stats
│       ├── admin-categories.js    # Category CRUD + reordering
│       ├── admin-items.js         # Item CRUD + photo upload + availability
│       └── admin-settings.js      # Branding/theme/currency form
├── supabase/
│   ├── schema.sql                 # Tables + triggers
│   ├── rls_policies.sql           # Row Level Security policies
│   ├── storage_setup.sql          # Storage bucket + policies
│   └── seed.sql                   # OPTIONAL demo data
├── docs/
│   └── QR_CODE.md                 # How to generate the QR code
├── .gitignore
└── README.md
```

No `.env` file is used because this is a static site with no build/server
step — configuration lives in `assets/js/config.js` instead (see step 5
below). That file holds only the **public** anon key, which is safe to
expose (see the security note in step 5).

---

## 3. What the customer sees (public menu)

- Café name, logo, background photo (with a dark overlay so text stays readable)
- Categories, each with its items
- Per item: photo, name, description, price, available/unavailable
- Language switch (KU/AR/EN), search box, sticky category tabs
- Loading, empty, and error states
- **No** order button, cart, checkout, payment, reservation, or account — by design.

## 4. What the admin can do (dashboard)

- Log in with Supabase Auth (only whitelisted accounts get in — see step 6)
- **Overview:** category count, total items, available/unavailable counts
- **Categories:** add, edit, delete, reorder, show/hide
- **Items:** add, edit, delete, set name/description/price/photo/category/availability, reorder within a category
- **Settings:** café name (per language), logo, background image, theme colors, currency

All writes are protected by Supabase Row Level Security — only accounts
listed in the `admins` table can insert/update/delete anything. Everyone
else (including anonymous visitors) gets read-only access to the menu data.

---

## 5. Step-by-step setup

### Step 1 — Create the Supabase project

1. Go to https://supabase.com → sign up / log in (free).
2. **New project** → pick an organization, name it (e.g. `cafe-menu`), set a
   database password (save it somewhere safe), pick the region closest to
   your customers → **Create new project**. Wait ~2 minutes for provisioning.

### Step 2 — Create the database schema, security rules, and storage bucket

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the contents of `supabase/schema.sql`, click **Run**.
3. New query → paste `supabase/rls_policies.sql` → **Run**.
4. New query → paste `supabase/storage_setup.sql` → **Run**.
5. *(Optional)* New query → paste `supabase/seed.sql` → **Run**, if you want
   a couple of sample categories/items to look at before adding real content.

At this point: tables exist, RLS is on, and a public `menu-images` bucket exists.

### Step 3 — Create the admin account

1. In Supabase, go to **Authentication → Users → Add user → Create new user**.
2. Enter the café owner/manager's email and a strong password. Leave
   "Auto Confirm User" checked (or confirm via the emailed link).
3. Copy the new user's **UID** (shown in the users table).
4. Go to **SQL Editor → New query** and run (replace the UID and name):

   ```sql
   insert into public.admins (id, full_name)
   values ('PASTE-THE-USER-UID-HERE', 'Café Owner');
   ```

5. That account can now log in to `/admin/`. Repeat steps 1–4 for any
   additional staff who need dashboard access. To revoke access later,
   delete their row from `admins` (or delete the user in Authentication).

### Step 4 — Get your API keys

1. In Supabase: **Project Settings → API**.
2. Copy the **Project URL** and the **anon / public** key.
   Do **not** copy the `service_role` key anywhere in this project — it
   must never appear in frontend code.

### Step 5 — Configure the frontend

1. Copy `assets/js/config.example.js` to `assets/js/config.js`.
2. Fill in your values:

   ```js
   window.SUPABASE_CONFIG = {
     url: 'https://YOUR-PROJECT-REF.supabase.co',
     anonKey: 'YOUR-PUBLIC-ANON-KEY',
   };
   ```

3. `config.js` is listed in `.gitignore` by default. This is optional
   caution, not a strict requirement — the anon key is meant to be public
   and your data stays protected by RLS either way. If you'd rather have
   it committed (e.g. so GitHub Pages "just works" after a clone with zero
   extra steps), remove the `assets/js/config.js` line from `.gitignore`
   before committing.

### Step 6 — Create the GitHub repository

1. Create a new, empty repository on GitHub (e.g. `qr-menu-cafe`). Do not
   initialize it with a README (you already have one).
2. From this project folder:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: digital QR menu"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/qr-menu-cafe.git
   git push -u origin main
   ```

### Step 7 — Deploy (GitHub Pages)

1. On GitHub: repo → **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)` → **Save**.
4. Wait a minute, then your site is live at:
   `https://YOUR-USERNAME.github.io/qr-menu-cafe/`
   (the public menu is `index.html` at that root URL; the dashboard is at
   `.../admin/`).

Any static host works the same way — Netlify/Vercel/Cloudflare Pages: just
point them at this repo with no build command and publish directory `/`.

### Step 8 — Get the menu URL and generate the QR code

1. Your public menu URL is the Pages URL from Step 7, e.g.
   `https://your-username.github.io/qr-menu-cafe/`.
2. Follow `docs/QR_CODE.md` to turn that URL into a QR code and print it.
   This URL — and therefore the QR code — never needs to change again,
   no matter how much menu content you edit later.

### Step 9 — Log in and manage the menu

1. Visit `.../admin/` and sign in with the account you created in Step 3.
2. Go to **Categories** → add your real categories.
3. Go to **Menu Items** → add items with photos, prices, descriptions.
4. Go to **Settings** → set the café name, logo, background photo, theme
   colors, and currency.
5. Open the public menu URL (or rescan the QR code) — changes appear
   immediately, no redeploy needed, because the page reads live from
   Supabase on every load.

---

## 6. Database design

```
categories
├── id (uuid, pk)
├── name_ku / name_ar / name_en
├── sort_order
├── is_active
└── timestamps

menu_items
├── id (uuid, pk)
├── category_id → categories.id (on delete cascade)
├── name_ku / name_ar / name_en
├── description_ku / description_ar / description_en
├── price (numeric, >= 0)
├── image_url
├── is_available
├── sort_order
└── timestamps

settings   (single row, id = 1)
├── cafe_name_ku / cafe_name_ar / cafe_name_en
├── logo_url / background_url
├── theme_primary / theme_secondary
├── currency_code / currency_symbol
└── default_language

admins     (whitelist of auth.users allowed to write)
├── id (uuid, pk, references auth.users)
├── full_name
```

Relationships: `menu_items.category_id → categories.id`. Deleting a
category cascades and deletes its items (the dashboard warns about this
before you confirm).

## 7. Security model (RLS)

- `categories`, `menu_items`, `settings` → **SELECT** is open to everyone
  (`anon` + `authenticated`) so the public menu works with no login.
- **INSERT / UPDATE / DELETE** on those tables requires the caller to be
  `authenticated` **and** present in the `admins` table (checked via a
  `security definer` helper function `public.is_admin()`), enforced at
  the database level — not just hidden in the UI.
- `admins` itself is never readable by the public and has no public
  write path at all; new admins are only ever added manually via SQL by
  someone with dashboard access to the Supabase project (Step 3).
- Storage (`menu-images` bucket): public read, admin-only write, same
  `is_admin()` check.
- The **service_role** key is never used anywhere in this codebase — only
  the public anon key, which RLS makes safe to expose.

## 8. Real-time updates

The public menu fetches fresh data from Supabase on every page load — so
any admin change (price, item, category, background, etc.) is visible the
next time a customer opens or refreshes the menu, with **no redeploy and
no QR code change** required. It also opens a lightweight Supabase
Realtime subscription so a menu that's already open in someone's browser
refreshes automatically if the admin saves a change while they're
looking at it.

## 9. Performance, SEO & accessibility

- Every uploaded image is client-side cropped + resized to a **fixed
  size per kind** before upload (not just visually via CSS — the actual
  stored file is uniform): item photos → 800×800 square, logo → 500×500
  square, background → 1600×900 (16:9) — see `Admin.IMAGE_PRESETS` in
  `assets/js/admin-common.js`. Output is JPEG at quality 0.8, served with
  `loading="lazy"` + `decoding="async"` on the public menu.
- Mobile-first CSS, sticky search/category bar, skeleton/spinner loading
  state, and empty/error states with a retry button.
- Basic SEO: descriptive `<title>`, meta description, Open Graph tags,
  semantic HTML (`<header>`, `<main>`, `<nav>`, `<article>`), `lang`/`dir`
  set dynamically per language.
- Accessibility: skip-link, `aria-pressed` on toggle buttons, alt text on
  images, focus-visible outlines, `prefers-reduced-motion` respected.

## 10. Free-first architecture & limits

Everything here fits comfortably in:

- **GitHub Pages** — free static hosting, no bandwidth billing surprises for a small/medium café site.
- **Supabase free tier** — free Postgres database, free Auth, 1GB free Storage, generous free API request allowance — more than enough for a small-to-medium café.

If you ever outgrow the free tier: the frontend is plain static
HTML/CSS/JS with zero vendor lock-in (swap hosting to any static host in
minutes), and the backend is standard Postgres (Supabase's own
pgdump/migration tools, or any Postgres-compatible host, work if you ever
need to migrate off Supabase).

## 11. Code quality notes

- Modular JS: one small file per page/concern, no framework, no build step.
- Comments are kept to the spots that need explaining (RLS rationale,
  image compression, i18n fallback order) rather than restating obvious code.
- Every write action (save/delete) has a loading state, error toast, and
  destructive actions (delete category/item) require an explicit confirm
  dialog first.
- Form validation on required fields (names, price, category) with inline
  error messages.
- Empty states are handled everywhere data can legitimately be empty
  (no categories yet, no items in a category, search with no results).

---

## Local development / testing

No build step needed. From the project root:

```bash
python3 -m http.server 8080
# or: npx serve .
```

Then open `http://localhost:8080/` for the public menu and
`http://localhost:8080/admin/` for the dashboard. Make sure
`assets/js/config.js` exists (Step 5) before testing.

## Troubleshooting

- **Menu shows the loading spinner forever / console shows a fetch error:**
  check `assets/js/config.js` has the right `url` and `anonKey`, and that
  `supabase/rls_policies.sql` was run (public SELECT policies missing is
  the most common cause).
- **Login works but redirects back with "not authorized":** the
  Supabase Auth user exists but has no matching row in `public.admins` —
  redo Step 3.4.
- **Image upload fails:** confirm `supabase/storage_setup.sql` ran
  successfully and the `menu-images` bucket exists under Storage.
