# Quick Start Guide

Get Kingdom Marketplace running in 5 minutes!

## TL;DR (For the impatient)

```bash
# 1. Install deps
npm install

# 2. Create .env.local with your Supabase keys
cp .env.local.example .env.local
# Edit .env.local with your actual keys

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000
```

## Slightly Longer Version

### 1. Prerequisites Setup (5 min)

**If you don't have accounts yet:**
- Create [Supabase](https://supabase.com) account (free)
- Create [Google Cloud](https://console.cloud.google.com) project for OAuth

### 2. Supabase Configuration (3 min)

In your Supabase project:

1. Go to **SQL Editor**
2. Create new query
3. Follow the fresh install order in `SUPABASE_SQL_RUN_ORDER.md`
4. Run one SQL file at a time and stop if any file errors
5. Go to **Settings → API**
6. Copy Project URL and anon key
7. Add to your `.env.local`

### 3. Google OAuth Setup (3 min)

In Google Cloud Console:

1. Create Web OAuth credentials
2. Add redirect: `http://localhost:3000/auth/callback`
3. Copy Client ID
4. Add to your `.env.local`

### 4. Run Locally (2 min)

```bash
npm install
npm run dev
```

Visit: `http://localhost:3000`

## Features to Try

### As a Buyer
1. Browse marketplace
2. Search by category
3. Sign up
4. Check dashboard

### As a Seller
1. Sign up with "creator" role
2. Go to seller dashboard
3. (Create listing - coming soon in UI)

## Common First-Time Issues

### "Unauthorized" on marketplace
→ Your Supabase keys are wrong. Double-check `.env.local`

### Google login redirects to blank page
→ Add localhost redirect URI in Google Cloud Console

### Database tables don't exist
→ Make sure you followed `SUPABASE_SQL_RUN_ORDER.md` and ran the canonical SQL files in order

### Nothing loads, blank page
→ Check browser console (F12) for errors

## Next Steps

1. **Explore the code** - Start in `app/page.tsx` (home page)
2. **Read the README** - Full documentation in `README.md`
3. **Check SETUP_CHECKLIST.md** - Complete setup guide
4. **Review DEPLOYMENT.md** - When ready to go live

## File Structure Highlights

```
app/                   ← Pages & routes
  page.tsx            ← Home page
  marketplace/        ← Marketplace page
  (auth)/             ← Login/signup pages
  (dashboard)/        ← User dashboards

components/
  ui/                 ← Reusable UI components
  shared/             ← Header, Footer

lib/
  supabase-client.ts  ← Supabase setup
  utils.ts            ← Helper functions

types/                ← TypeScript types
```

## Pro Tips

- **Hot reload works** - Edit files and see changes instantly
- **Environment variables** - Add new vars to `.env.local` and restart `npm run dev`
- **Database changes** - Use Supabase SQL Editor for queries
- **Components** - Look at `components/ui` for building blocks

## Ready to Deploy?

When you're satisfied locally:

1. Read `DEPLOYMENT.md`
2. Push to GitHub
3. Connect to Vercel
4. Add environment variables
5. Deploy!

---

**Questions?**
- Check [README.md](./README.md)
- Check [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
- Check [DEPLOYMENT.md](./DEPLOYMENT.md)

**Happy coding! 🚀**
