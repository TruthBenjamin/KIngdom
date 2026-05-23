# Deployment Guide

This guide will walk you through deploying Kingdom Marketplace to Vercel.

## Prerequisites

- [ ] GitHub account with the project pushed
- [ ] Vercel account (free)
- [ ] Supabase project set up with database schema
- [ ] Google OAuth credentials created

## Step 1: Prepare Your Code

```bash
# Make sure all changes are committed
git add .
git commit -m "Final changes before deployment"

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select your `kingdom` repository
5. Click "Import"

### Configure Build Settings

The default settings should work, but verify:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### Add Environment Variables

Before deploying, add your environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### Deploy

Click "Deploy" and wait for the build to complete (usually 2-3 minutes).

## Step 3: Update Google OAuth

After Vercel deployment, you'll get a domain like `kingdom.vercel.app`

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **Credentials → OAuth 2.0 Client IDs**
4. Click on your web application
5. Add to **Authorized redirect URIs:**
   ```
   https://yourproject.vercel.app/auth/callback
   ```
6. Save changes

## Step 4: Update Supabase Settings

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Authentication → Providers → Google**
4. Ensure the Callback URL is set correctly (should be auto-set)
5. Add your Vercel domain to allowed origins if needed

## Step 5: Test Deployment

1. Visit your Vercel domain: `https://yourproject.vercel.app`
2. Test sign up with Google
3. Test email sign up
4. Test marketplace browsing
5. Test dashboard access

## Monitoring & Logging

### View Logs
- Go to your Vercel project dashboard
- Click on a deployment
- View logs in real-time

### Monitor Performance
- Check Core Web Vitals in Vercel Analytics
- Use Supabase Dashboard for database metrics
- Monitor bandwidth usage in Vercel

## Common Issues

### "Unauthorized" Errors
- Verify environment variables are set correctly
- Check Supabase API keys haven't been regenerated
- Clear browser cache and try again

### Google Login Not Working
- Verify Google Client ID is correct
- Check redirect URI matches exactly: `https://yourproject.vercel.app/auth/callback`
- Ensure Google OAuth consent screen is configured

### Database Errors
- Check Supabase project is active (not paused)
- Verify RLS policies are correctly set
- Check user has appropriate permissions

### Images Not Loading
- Verify Supabase Storage bucket is public
- Check image URLs are correct

## Performance Optimization

### For Free Tier
- Keep database queries optimized
- Use Supabase indexes for frequently queried fields
- Cache static assets in Vercel

### Database Best Practices
- Avoid N+1 queries
- Use `select` to only get needed fields
- Index commonly filtered/sorted columns

### Image Optimization
- Use Next.js `Image` component
- Optimize images before upload (compress, resize)
- Use WebP format when possible

## Upgrading Tiers

### When to Upgrade Vercel
- App consistently exceeds 100GB bandwidth/month
- Need more serverless function capacity
- Want custom domains and SSL

### When to Upgrade Supabase
- Database size approaching 500MB
- Need more concurrent connections
- Need advanced features like extensions

## Custom Domain (Optional)

### Add Custom Domain to Vercel

1. In Vercel project settings, go to **Domains**
2. Add your domain (e.g., `kingdommarketplace.com`)
3. Follow DNS instructions
4. Wait for DNS propagation (can take 24-48 hours)

### Update Google OAuth
Add your custom domain redirect URI to Google Cloud Console

### Update Supabase
If using custom domain, update Supabase Auth settings accordingly

## Backup & Recovery

### Supabase Backups
Supabase automatically creates daily backups on free tier.

To export data:
1. Go to Supabase Dashboard
2. **Database → Backups**
3. Create manual backup
4. Download CSV exports if needed

### Code Backup
Your code is backed up on GitHub automatically. Never delete your GitHub repo!

## Monitoring Costs

### Vercel
- Free tier: $0
- Bandwidth overage: $0.15/GB (usually minimal)

### Supabase
- Free tier: $0
- Database overage: charged monthly
- Storage overage: $0.10/GB

Total monthly cost for MVP: **$0** (unless you massively scale)

## Troubleshooting Checklist

- [ ] Environment variables are set in Vercel
- [ ] Supabase schema has been imported
- [ ] Google OAuth is configured with correct domain
- [ ] RLS policies are enabled on all tables
- [ ] Categories have been seeded in database
- [ ] Storage bucket is public (if using images)

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

**Your Kingdom Marketplace is now live! 🎉**
