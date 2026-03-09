# Fork Guide — Deploy MassFinder for Your Diocese

MassFinder is designed to be forked and customized for any Catholic diocese or region. This guide walks you through deploying your own instance.

## Quick Start

### 1. Fork the Repository

Fork `github.com/monsballoon-hue/MassFinderApp` on GitHub.

### 2. Configure Your Region

Edit `src/config.js` and update the `REGION` object:

```javascript
var REGION = {
  name: 'Diocese of Your City',
  shortName: 'Your Diocese',
  mapCenter: [YOUR_LAT, YOUR_LNG],
  mapZoom: 10,
  gaId: 'G-XXXXXXXXXX',           // Your Google Analytics ID (or null)
  web3formsKey: 'your-key-here',   // Your Web3Forms key (or null)
  diocese: 'Your Diocese Name',
  states: ['ST'],                  // State abbreviations covered
};
```

You may also want to update:
- `SERVICE_TYPES` — add or remove service types relevant to your region
- `DAY_TYPES` — adjust if needed
- `LANGUAGES` — add languages used in your region
- `CLERGY_ROLES` — adjust roles if needed

### 3. Replace Parish Data

Replace `parish_data.json` with your diocese's data. The file must conform to the schema — run `npm run validate` to check.

See `DATA_STANDARDS.md` for the data format specification.

Replace `events.json` with your events (or set it to `{"events": []}` to start empty).

### 4. Update Assets

Replace the icons in `assets/`:
- `icon-180.png` (180x180, Apple touch icon)
- `icon-192.png` (192x192, Android icon)
- `icon-512.png` (512x512, splash screen)

Update `manifest.json` with your app name and colors.

### 5. Build and Test Locally

```bash
npm install
npm run build
npm run schema
npm run validate
```

Open `index.html` in a browser (or use a local server) to verify.

### 6. Deploy to Vercel

1. Push to your GitHub fork
2. Go to [vercel.com](https://vercel.com) → New Project → Import your fork
3. Settings:
   - Framework: **Other**
   - Build Command: `npm run build`
   - Output Directory: `.`
4. Deploy

Your app is live at `your-project.vercel.app`.

### 7. Custom Domain (Optional)

In Vercel project settings → Domains, add your custom domain.

### 8. Supabase Editorial Pipeline (Optional)

If you want to use the bulletin parsing pipeline:

1. Create a [Supabase](https://supabase.com) project
2. Run `supabase link --project-ref YOUR_REF`
3. Push the schema: `supabase db push`
4. Create `.env.local` with your Supabase credentials:
   ```
   SUPABASE_URL=https://YOUR_REF.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. Use `scripts/apply-changes.js` to apply approved changes to `parish_data.json`

## Location Bounds

Update the schema template (`parish_data.schema.template.json`) to match your region's latitude/longitude bounds in the `location` definition. The default is set for Western New England (lat 40.5–46.0, lng -74.5 to -70.5).

Also update the `state` enum in the `location` and `parish` definitions to match your states.
