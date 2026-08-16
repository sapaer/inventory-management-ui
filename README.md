# PartNear frontend

React inventory app for spare-parts shops. Matches the seller UI we designed: forest-green sidebar, sage pages, WhatsApp OTP on the same login screen, then dashboard.

Talks to the Java API at `http://localhost:8080` (proxied in dev).

## Screens

| Route | What |
| --- | --- |
| `/login` | Phone + inline WhatsApp OTP |
| `/` | Dashboard after OTP |
| `/inventory` | Catalog, search, filters, `+` / `−` qty |
| `/inventory/new` | Add a part |
| `/low-stocks` | Items at or below minimum |
| `/insights` | Stock health from current catalog |
| `/settings` | Shop profile, language, logout |

Sidebar is only **My Inventory · Low Stocks · Insights · Settings**. Add a Part is a top-bar button.

## Run

API first (from `inventory-management`):

```bash
mvn spring-boot:run
```

Then this app:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Phone must be a 10-digit Indian mobile (`6–9` start). OTP arrives on WhatsApp/SMS from the backend.
