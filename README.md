# Kingdom Marketplace

A modern, faith-centered marketplace platform where Christian creatives, freelancers, artisans, and professionals can showcase and offer their services.

**Tagline:** "Kingdom talent, trusted solutions."

## Features

### Core MVP Features
- ✅ Email & Google OAuth authentication
- ✅ Landing page with hero, categories, featured creators, testimonials
- ✅ Seller profiles with portfolio, skills, and social links
- ✅ Marketplace with search and category filtering
- ✅ Realtime messaging using Supabase Realtime
- ✅ Simple hire flow (messaging-based negotiation)
- ✅ Seller & buyer dashboards
- ✅ Admin moderation (remove listings, ban users)

### Tech Stack
- **Frontend:** Next.js 15, TypeScript, TailwindCSS, Shadcn UI
- **Animations:** Framer Motion
- **Backend:** Supabase (Auth, Database, Realtime, Storage)
- **Hosting:** Vercel (free tier)

### Zero Infrastructure Cost
- Vercel free tier hosting
- Supabase free tier database & auth
- No paid APIs or external services

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free)
- Vercel account (free)

### 1. Clone & Setup Local Project

```bash
# Navigate to project
cd kingdom

# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (select a region closest to you)
3. Wait for project initialization
4. Go to **Project Settings → API**
5. Copy your:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

6. Go to **SQL Editor** and run the entire `supabase-schema.sql` file:
   - Copy all content from `supabase-schema.sql`
   - Paste into SQL Editor
   - Click "Run"

7. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable "Google+ API"
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `https://yourdomain.vercel.app/auth/callback`
   - Copy Client ID → `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### 3. Update Environment Variables

Edit `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
kingdom/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Auth routes (login, signup)
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Dashboard routes
│   │   └── dashboard/
│   │       ├── seller/
│   │       └── buyer/
│   ├── marketplace/              # Marketplace page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── ui/                       # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   └── avatar.tsx
│   └── shared/                   # Shared components
│       ├── header.tsx
│       └── footer.tsx
├── lib/
│   ├── supabase-client.ts        # Supabase client
│   └── utils.ts                  # Utility functions
├── types/
│   ├── index.ts                  # Type definitions
│   └── database.ts               # Database types
├── public/                       # Static assets
├── supabase-schema.sql           # Database schema
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── .env.local                    # Environment variables
```

## Database Schema

### Key Tables

**users** - Authentication & user info
**profiles** - Extended seller/buyer profiles
**listings** - Service listings
**categories** - Service categories
**conversations** - Direct messages between buyer & seller
**messages** - Individual messages with Realtime support
**reviews** - Service reviews

All tables have Row Level Security (RLS) enabled for security.

## Key Pages

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Landing page with hero, categories, featured creators |
| Marketplace | `/marketplace` | Browse and search all listings |
| Login | `/login` | Email & Google auth |
| Sign Up | `/signup` | Create account (buyer or seller) |
| Seller Dashboard | `/dashboard/seller` | Manage listings, messages |
| Buyer Dashboard | `/dashboard/buyer` | Saved creators, conversations |

## Authentication Flow

1. User signs up with email or Google
2. Email signup requires confirmation email
3. Google OAuth redirects to `/auth/callback`
4. User profile is created automatically
5. Redirects to appropriate dashboard based on role

## Messaging Flow

1. Buyer browses listings
2. Clicks "Hire Seller" or messages creator
3. Opens conversation with realtime messaging
4. Negotiates terms via messages
5. Marks as "hired" when agreement reached

## Deployment to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-github-repo
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repo
4. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
5. Click "Deploy"

### 3. Update Google OAuth
Go back to Google Cloud Console and add your Vercel domain to authorized redirect URIs:
```
https://yourproject.vercel.app/auth/callback
```

## Admin Features

### Remove Listings
- Go to admin panel
- Click delete on any listing

### Ban Users
- Go to admin panel  
- Click ban on user

*Note: Admin routes should be protected and only accessible to admin users*

## Design Inspiration

- Linear
- Vercel
- Airbnb
- Upwork

The design focuses on:
- Clean, minimal aesthetic
- Professional typography
- Smooth animations
- Excellent mobile experience
- Trustworthy, premium feel

## Performance Optimization

- Next.js server components where beneficial
- Image optimization with next/image
- CSS-in-JS with TailwindCSS
- Lazy loading components
- Optimized bundle size

## Future Enhancements

- Payment integration (Stripe, PayPal)
- Advanced search with filters
- Seller reputation system
- Portfolio showcase
- Contract templates
- Escrow payments
- Automated invoicing
- Calendar & scheduling
- Multi-language support

## Free Tier Limits

### Vercel Free
- 100GB bandwidth/month
- Serverless Functions
- GitHub integration

### Supabase Free
- 500MB database size
- Up to 2 concurrent connections
- Realtime included
- 5GB file storage

## Support & Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)

## License

MIT - Feel free to use this template for your projects!

## Contributing

Contributions welcome! Please feel free to submit PRs or open issues.

---

**Built with ❤️ for the Kingdom**
