<!-- Kingdom Marketplace - Custom Development Instructions -->

# Kingdom Marketplace Development Guide

This file provides workspace-specific guidance for continuing development on the Kingdom Marketplace MVP.

## Project Overview

Kingdom Marketplace is a faith-centered MVP platform for connecting Christian creatives with clients. It's built with Next.js 15, TypeScript, TailwindCSS, Supabase, and is deployed on Vercel (free tier).

### Key Characteristics
- **Zero Infrastructure Cost** - Uses Vercel + Supabase free tiers only
- **Production Quality** - Premium UI, smooth animations, professional design
- **Scalable Architecture** - Built to handle growth
- **MVP Scope** - Core features only, no payments yet
- **Faith-Centered** - Designed specifically for Christian professionals

## Project Structure

```
app/                    - Next.js app directory with all routes
├── (auth)/             - Authentication pages (login, signup)
├── (dashboard)/        - User dashboards (seller/buyer)
├── marketplace/        - Listings marketplace
├── how-it-works/       - Information pages
├── about/ contact/ terms/ privacy/ - Static pages
└── page.tsx            - Home/landing page

components/
├── ui/                 - Reusable UI components (button, card, input, etc.)
└── shared/             - Layout components (header, footer)

lib/
├── supabase-client.ts  - Supabase client initialization
├── utils.ts            - Utility functions
└── hooks.ts            - Custom React hooks

types/                  - TypeScript type definitions
supabase-schema.sql     - Database schema (all tables, RLS policies)
```

## Development Workflow

### When Adding New Features

1. **Plan the feature** - What pages/components are needed?
2. **Create types** - Add TypeScript types to `types/`
3. **Build components** - Create reusable components in `components/`
4. **Create pages** - Add new routes in `app/`
5. **Connect to Supabase** - Use `createClient()` from `lib/supabase-client.ts`
6. **Test locally** - Run `npm run dev` and verify
7. **Deploy** - Push to GitHub, Vercel deploys automatically

### Key Libraries

- **Next.js 15** - Framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Shadcn UI** - Component library (pre-built components in `components/ui/`)
- **Framer Motion** - Animations
- **Supabase** - Backend (auth, database, realtime)
- **React Hot Toast** - Notifications

## Important Conventions

### File Structure
- Pages go in `app/` with folder structure matching URL routes
- Reusable components go in `components/`
- Utility functions go in `lib/`
- Types go in `types/`

### Naming
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Functions: camelCase (e.g., `formatDate()`)
- Variables: camelCase (e.g., `userName`)
- Files: kebab-case for folders, matching component name for files

### Database Interactions

All database calls should use the Supabase client:

```typescript
const supabase = createClient()
const { data, error } = await supabase
  .from('table_name')
  .select()
  .eq('id', id)
```

### Authentication

Check user auth with the `useAuth()` hook:

```typescript
const { user, loading } = useAuth()
if (!user) {
  // User not authenticated
}
```

## Database Schema (Quick Reference)

**Main Tables:**
- `users` - User authentication + info (managed by Supabase Auth)
- `profiles` - Extended seller/buyer profiles
- `listings` - Service listings
- `categories` - Service categories (pre-populated with 8 defaults)
- `conversations` - Direct message threads
- `messages` - Individual messages (supports Realtime)
- `reviews` - Service reviews

All tables have RLS (Row Level Security) enabled - users can only see their own data unless explicitly permitted.

## Environment Variables

Always keep sensitive keys in `.env.local` (never committed to git):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
```

Variables starting with `NEXT_PUBLIC_` are available in the browser. Never expose secrets this way.

## Deployment Notes

- **Automatic** - Every push to `main` on GitHub triggers Vercel deployment
- **Environment Variables** - Set in Vercel project settings (not in `.env.local`)
- **Free Tier Limits** - Be mindful of Vercel bandwidth and Supabase database size
- **Custom Domain** - Can be added later in Vercel settings

## Common Tasks

### Add a new page
1. Create folder in `app/` matching desired URL
2. Create `page.tsx` in that folder
3. Export default component
4. Route automatically works!

### Add a new API endpoint
1. Create folder in `app/api/` matching endpoint path
2. Create `route.ts` with handler
3. Endpoint automatically works!

### Add database table
1. Modify `supabase-schema.sql`
2. Run migration in Supabase SQL Editor
3. Update `types/database.ts` with new types

### Connect component to database
```typescript
'use client'
import { createClient } from '@/lib/supabase-client'

export default function MyComponent() {
  const supabase = createClient()
  
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('table_name')
        .select()
    }
    fetchData()
  }, [supabase])
  
  // Render component
}
```

## Testing Locally

```bash
npm run dev
# Open http://localhost:3000

# Test different user scenarios:
# 1. Unauthenticated user (should see home + marketplace)
# 2. Email signup (should create profile)
# 3. Google OAuth (should create profile)
# 4. Seller role (should see seller dashboard)
# 5. Buyer role (should see buyer dashboard)
```

## Performance Tips

- Use Next.js Image component for images
- Lazy load components with dynamic imports when possible
- Avoid N+1 database queries - use `.select()` to fetch only needed fields
- Add indexes to frequently filtered columns
- Cache static pages with `revalidate` in `generateStaticParams`

## Debugging

### Check Supabase logs
- Go to Supabase Dashboard → Logs
- Look for RLS policy errors, connection issues

### Check Vercel logs
- Go to Vercel project → Deployments → select deployment → Logs
- See real-time errors and console logs

### Debug locally
- Use `console.log()` in components
- Use browser DevTools (F12)
- Check network requests in browser Network tab

## Future Feature Ideas

These are out of scope for MVP but good for next phases:

- Payment processing (Stripe/PayPal)
- Advanced search & filtering
- Seller reputation scoring
- Escrow payments
- Calendar/scheduling
- Contract templates
- Invoice generation
- Multi-language support
- Mobile app

## Resources

- [README.md](../README.md) - Full project documentation
- [QUICK_START.md](../QUICK_START.md) - Quick setup guide
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment instructions
- [SETUP_CHECKLIST.md](../SETUP_CHECKLIST.md) - Detailed setup checklist

## Code Quality

- Keep components small and focused (single responsibility)
- Use TypeScript strictly - avoid `any` types
- Add comments for complex logic
- Follow existing code patterns
- Test locally before pushing to GitHub
- Use meaningful variable/function names
- Keep bundle size in mind - prefer smaller libraries

## When Stuck

1. Check the README and relevant documentation
2. Look at similar existing code in the project
3. Check Supabase and Vercel logs for errors
4. Review browser console (F12) for client-side errors
5. Check network requests to see API responses

---

**Happy coding! Remember: Kingdom talent, trusted solutions. 🙏**
