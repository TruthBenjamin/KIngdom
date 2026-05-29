# Setup Checklist

Complete this checklist to properly set up Kingdom Marketplace.

## Local Development Setup

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm or yarn available
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

### Project Installation
- [ ] Clone or download the project
- [ ] Run `npm install` to install dependencies
- [ ] Copy `.env.local.example` to `.env.local`

## Supabase Setup

### Create Supabase Project
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Click "New Project"
- [ ] Choose organization
- [ ] Set project name: "kingdom"
- [ ] Set a strong database password
- [ ] Select region closest to you
- [ ] Click "Create new project"
- [ ] Wait for project initialization (5-10 minutes)

### Get API Keys
- [ ] Go to Project Settings → API
- [ ] Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- [ ] Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

### Import Database Schema
- [ ] Go to SQL Editor
- [ ] Click "New query"
- [ ] Open `SUPABASE_SQL_RUN_ORDER.md`
- [ ] Run the fresh/current SQL files in the documented order
- [ ] Run one file at a time and stop if any file errors
- [ ] Verify tables are created (check in "Table Editor")

### Verify Database
- [ ] Check these tables exist:
  - [ ] users
  - [ ] profiles
  - [ ] listings
  - [ ] categories
  - [ ] conversations
  - [ ] messages
  - [ ] reviews
- [ ] Check categories are populated with 8 default categories
- [ ] Verify RLS policies are active

## Google OAuth Setup

### Create Google Cloud Project
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Click "Select a Project" at top
- [ ] Click "New Project"
- [ ] Set name: "kingdom-marketplace"
- [ ] Click "Create"
- [ ] Wait for project creation

### Enable Google+ API
- [ ] Go to "APIs & Services" → "Library"
- [ ] Search for "Google+ API"
- [ ] Click on it
- [ ] Click "Enable"

### Create OAuth Credentials
- [ ] Go to "APIs & Services" → "Credentials"
- [ ] Click "Create Credentials" → "OAuth 2.0 Client ID"
- [ ] Select "Web application"
- [ ] Set name: "Kingdom Marketplace"
- [ ] Add Authorized redirect URIs:
  - [ ] `http://localhost:3000/auth/callback`
  - [ ] `http://127.0.0.1:3000/auth/callback`
- [ ] Click "Create"
- [ ] Copy Client ID
- [ ] Paste into `.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Environment Variables

Edit `.env.local` and verify all are set:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

## Test Local Development

- [ ] Run `npm run dev`
- [ ] Visit `http://localhost:3000`
- [ ] Verify home page loads
- [ ] Test email signup
- [ ] Test Google login
- [ ] Verify user is created in Supabase
- [ ] Check dashboard redirects work
- [ ] Test marketplace browsing

## Prepare for Deployment

### GitHub Setup
- [ ] Initialize git: `git init`
- [ ] Add files: `git add .`
- [ ] Commit: `git commit -m "Initial Kingdom Marketplace setup"`
- [ ] Create GitHub repository
- [ ] Add remote: `git remote add origin <url>`
- [ ] Push: `git push -u origin main`

### Code Review
- [ ] All environment variables are in `.env.local`
- [ ] No secrets are hardcoded in files
- [ ] `.env.local` is in `.gitignore`
- [ ] All dependencies are in `package.json`
- [ ] No console.log statements left (clean up if needed)

## Vercel Deployment

### Connect to Vercel
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up with GitHub
- [ ] Import your repository
- [ ] Set Project Name: "kingdom"

### Add Environment Variables to Vercel
- [ ] In Vercel project settings
- [ ] Go to "Environment Variables"
- [ ] Add each variable:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Verify deployment was successful
- [ ] Get your Vercel domain (e.g., kingdom.vercel.app)

## Post-Deployment

### Update Google OAuth
- [ ] Go back to Google Cloud Console
- [ ] Go to OAuth Client settings
- [ ] Add authorized redirect URI:
  - [ ] `https://your-vercel-domain.vercel.app/auth/callback`
- [ ] Save

### Test Production
- [ ] Visit your Vercel domain
- [ ] Test email signup
- [ ] Test Google login
- [ ] Verify database connections work
- [ ] Test marketplace filtering
- [ ] Check messaging system

### Optional: Custom Domain
- [ ] (Optional) Purchase domain from registrar (Namecheap, GoDaddy, etc.)
- [ ] Add domain to Vercel
- [ ] Update DNS records per Vercel instructions
- [ ] Update Google OAuth with custom domain
- [ ] Wait for DNS propagation

## Monitoring & Maintenance

### Weekly
- [ ] Check Vercel deployment logs
- [ ] Monitor error rates
- [ ] Review user feedback

### Monthly
- [ ] Check Supabase database size
- [ ] Review bandwidth usage
- [ ] Update dependencies if needed

### As Needed
- [ ] Add new categories if requested
- [ ] Moderate user content (ban inappropriate users)
- [ ] Fix reported bugs
- [ ] Improve UI/UX based on feedback

## Security Checklist

- [ ] All API keys are environment variables
- [ ] Supabase RLS policies are enabled
- [ ] Database connections use HTTPS
- [ ] CORS is properly configured
- [ ] No sensitive data in git history
- [ ] Admin routes are protected
- [ ] User authentication is required for protected pages

## Performance Optimization

- [ ] Enable image optimization in Next.js
- [ ] Set up proper caching headers
- [ ] Optimize bundle size
- [ ] Monitor Core Web Vitals in Vercel Analytics
- [ ] Test on mobile devices
- [ ] Load test with expected traffic

## Documentation

- [ ] README.md is complete and clear
- [ ] DEPLOYMENT.md is ready for future reference
- [ ] Comments in code are clear where needed
- [ ] Architecture is documented

## Launch Ready!

- [ ] All checklist items completed
- [ ] Project is live and accessible
- [ ] Team/stakeholders have been notified
- [ ] Support process is in place
- [ ] Backup plan is documented

---

**Congratulations! Kingdom Marketplace is ready to serve the faith community! 🎉**

If you get stuck on any step, refer to:
- [README.md](./README.md) for general info
- [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment details
- Official docs for [Supabase](https://supabase.com/docs), [Next.js](https://nextjs.org/docs), [Vercel](https://vercel.com/docs)
