# Generating the QR Code

The QR code should point to **one fixed URL** — your deployed public menu
(for example `https://your-cafe.github.io/qr-menu-cafe/`). It must **never**
be regenerated when you change prices, items, categories, or the
background — the page at that URL always reads live data from Supabase, so
the same QR code keeps working forever.

## Option A — Free online generator (fastest)

1. Deploy the site first (see the main README) and confirm the menu URL
   works in a browser.
2. Go to a QR generator such as:
   - https://www.qr-code-generator.com/
   - https://qrcode.tec-it.com/
3. Paste your menu URL, generate, and download the QR as PNG or SVG (SVG
   prints more crisply on table tents/stickers).
4. Print it and place it on tables, the counter, or the entrance.

## Option B — Generate it yourself with Node (no third-party service)

```bash
npm install -g qrcode
qrcode -o menu-qr.png "https://your-cafe.github.io/qr-menu-cafe/"
```

## Option C — Generate it with Python

```bash
pip install qrcode[pil] --break-system-packages
python3 -c "
import qrcode
img = qrcode.make('https://your-cafe.github.io/qr-menu-cafe/')
img.save('menu-qr.png')
"
```

## Important

- Always encode the **root menu URL**, not a URL with query strings or IDs
  tied to specific data.
- If you ever change hosting providers/domains, you'll need a **new** QR
  code (the old one keeps pointing at the old URL) — but you will never
  need a new QR code just because you edited the menu content.
- Test the QR code with an actual phone camera before printing a batch.
