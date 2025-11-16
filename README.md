# 🐷 Sow Tracker - Farm Management PWA

A modern, cloud-based Progressive Web App for tracking sow farrowing, vaccinations, piglets, breeding cycles, and reminders.

## 🚀 Features

- **Sow Management** - Track individual sows, breeding history, and status
- **Farrowing Tracking** - Monitor expected vs actual dates, litter sizes
- **Vaccination Schedules** - Automated reminders and compliance tracking
- **Breeding Cycles** - 21-day cycle tracking with predictions
- **Piglet Records** - Birth, weaning, and health tracking
- **Smart Reminders** - Push notifications for important events
- **Offline Support** - Works without internet, syncs when online
- **Analytics Dashboard** - Visualize farm performance metrics
- **PWA** - Install on any device like a native app

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js** (v18 or higher) - Already installed ✅
- **npm** (v10 or higher) - Already installed ✅
- A **Supabase account** (free tier works great)

## 🛠️ Setup Instructions

### Step 1: Install Dependencies

Open your terminal in the sow-tracker directory and run:

\`\`\`bash
npm install
\`\`\`

This will install all the required packages (Next.js, Supabase, Tailwind, etc.)

### Step 2: Set Up Supabase

1. **Create a Supabase Account**
   - Go to https://supabase.com
   - Sign up for a free account

2. **Create a New Project**
   - Click "New Project"
   - Choose a name (e.g., "sow-tracker")
   - Set a database password (save this!)
   - Choose a region close to you
   - Wait ~2 minutes for project to be ready

3. **Get Your API Credentials**
   - In your Supabase dashboard, go to: **Settings** > **API**
   - Copy the **Project URL** (looks like: https://xxxxx.supabase.co)
   - Copy the **anon/public** key (the long string under "Project API keys")

4. **Create the Database Tables**
   - In Supabase dashboard, go to: **SQL Editor**
   - Click "New Query"
   - Open the file `database/schema.sql` from this project
   - Copy ALL the SQL code
   - Paste it into the Supabase SQL editor
   - Click "Run" (bottom right)
   - You should see "Success. No rows returned" - that's perfect!

5. **Configure Your App**
   - In the sow-tracker folder, copy `.env.local.example` to `.env.local`:
     \`\`\`bash
     # On Windows:
     copy .env.local.example .env.local
     
     # On Mac/Linux:
     cp .env.local.example .env.local
     \`\`\`
   - Open `.env.local` in VS Code
   - Replace `your_supabase_project_url` with your Project URL
   - Replace `your_supabase_anon_key` with your anon key
   - Save the file

### Step 3: Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open your browser and go to: http://localhost:3000

You should see the Sow Tracker dashboard! 🎉

### Step 4: Install as PWA (Optional)

**On Mobile (iPhone/Android):**
1. Open http://localhost:3000 in your mobile browser
2. For iPhone: Tap Share → Add to Home Screen
3. For Android: Tap Menu (⋮) → Install App

**On Desktop:**
1. Look for the install icon in your browser's address bar
2. Click it to install as a desktop app

## 📁 Project Structure

\`\`\`
sow-tracker/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout with PWA config
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/               # Reusable UI components (buttons, cards, etc.)
├── lib/                   # Utility functions
│   ├── supabase.ts       # Supabase client & types
│   └── utils.ts          # Helper functions
├── database/             # Database schema
│   └── schema.sql        # Complete database setup
├── public/               # Static files
│   └── manifest.json     # PWA manifest
├── .env.local            # Your Supabase credentials (create this!)
└── package.json          # Dependencies
\`\`\`

## 🔧 Key Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Supabase** - PostgreSQL database + real-time + auth
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **next-pwa** - Progressive Web App features
- **Recharts** - Data visualization (for analytics)

## 📝 Next Steps

Now that everything is set up, you can:

1. **Add Your First Sow**
   - Click "Add New Sow" button
   - (Feature coming soon - you'll build this next!)

2. **Explore the Codebase**
   - Check out `app/page.tsx` to see the dashboard
   - Look at `lib/supabase.ts` for database types
   - Review `components/ui/` for reusable components

3. **Build Features**
   - Create pages for adding/editing sows
   - Build the farrowing tracker
   - Add vaccination management
   - Implement reminders system

## 🎯 Building Your First Feature

Let's add a simple "Sows List" page:

1. Create a new file: `app/sows/page.tsx`
2. Use the Supabase client to fetch data:

\`\`\`typescript
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SowsPage() {
  const [sows, setSows] = useState([]);

  useEffect(() => {
    async function fetchSows() {
      const { data } = await supabase
        .from('sows')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setSows(data);
    }
    fetchSows();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">All Sows</h1>
      <div className="grid gap-4">
        {sows.map((sow: any) => (
          <div key={sow.id} className="border p-4 rounded">
            <h2>{sow.ear_tag}</h2>
            <p>Breed: {sow.breed}</p>
            <p>Status: {sow.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
\`\`\`

3. Navigate to http://localhost:3000/sows to see your sows!

## 🐛 Troubleshooting

**"Module not found" errors:**
- Make sure you ran `npm install`
- Restart the dev server (`npm run dev`)

**Database connection issues:**
- Check that `.env.local` has the correct Supabase credentials
- Make sure your Supabase project is active
- Verify you ran the schema.sql in Supabase

**PWA not installing:**
- PWA features are disabled in development mode (this is normal)
- To test PWA: run `npm run build` then `npm start`
- Or deploy to Vercel/Netlify for full PWA features

**Data not showing:**
- Check the browser console (F12) for errors
- Make sure you ran the schema.sql (includes sample data)
- Verify RLS policies in Supabase (see schema.sql comments)

## 🚢 Deployment

When you're ready to deploy:

**Option 1: Vercel (Recommended)**
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (.env.local values)
4. Deploy!

**Option 2: Netlify**
1. Push code to GitHub
2. Import project in Netlify
3. Add environment variables
4. Deploy!

## 📚 Learning Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **PWA Guide**: https://web.dev/progressive-web-apps/

## 🤝 Need Help?

- Check the console for errors (F12 in browser)
- Review the database schema in `database/schema.sql`
- Look at the TypeScript types in `lib/supabase.ts`

## 📄 License

This project is open source and available for your farm management needs!

---

**Happy Tracking! 🐷📊**
