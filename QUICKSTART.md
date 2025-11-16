# 🚀 Quick Start Guide

## Get Running in 5 Minutes

### 1. Install Dependencies (2 minutes)
\`\`\`bash
npm install
\`\`\`

### 2. Set Up Supabase (2 minutes)

**Create Account & Project:**
- Go to https://supabase.com → Sign up
- Click "New Project" → Name it "sow-tracker"
- Wait for it to spin up (~2 min)

**Get Your Keys:**
- Settings → API
- Copy "Project URL" and "anon public" key

**Setup Database:**
- SQL Editor → New Query
- Copy/paste everything from `database/schema.sql`
- Click "Run"

### 3. Configure Environment (30 seconds)

Create `.env.local` file:
\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

### 4. Run It! (10 seconds)
\`\`\`bash
npm run dev
\`\`\`

Open http://localhost:3000 - You're live! 🎉

## What You Get

- ✅ Modern dashboard with stats
- ✅ Database ready for sows, farrowings, vaccinations
- ✅ PWA capabilities (installable)
- ✅ Mobile-responsive design
- ✅ TypeScript + Tailwind configured
- ✅ Sample data to explore

## Next Steps

1. Check the main `README.md` for detailed docs
2. Explore the database in Supabase dashboard
3. Start building features (see README examples)

## Need Help?

- Database not connecting? Check `.env.local` values
- Errors on `npm install`? Make sure Node v18+ installed
- PWA not working? That's normal in dev mode

**Happy building!** 🐷
