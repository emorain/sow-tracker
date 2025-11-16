# 🛠️ Development Guide

## Understanding the Stack

### Next.js App Router (Folder = Route)
- `app/page.tsx` → http://localhost:3000/
- `app/sows/page.tsx` → http://localhost:3000/sows
- `app/api/sows/route.ts` → API endpoint at /api/sows

### Supabase Client Pattern

**Fetching Data:**
\`\`\`typescript
import { supabase } from '@/lib/supabase';

// Get all sows
const { data, error } = await supabase
  .from('sows')
  .select('*');

// Get sows with farrowings
const { data } = await supabase
  .from('sows')
  .select(\`
    *,
    farrowings (*)
  \`);

// Filter and sort
const { data } = await supabase
  .from('sows')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });
\`\`\`

**Inserting Data:**
\`\`\`typescript
const { data, error } = await supabase
  .from('sows')
  .insert([
    {
      ear_tag: 'SOW-123',
      birth_date: '2023-01-15',
      breed: 'Yorkshire',
      status: 'active'
    }
  ])
  .select();
\`\`\`

**Updating Data:**
\`\`\`typescript
const { data, error } = await supabase
  .from('sows')
  .update({ status: 'sold' })
  .eq('id', sowId)
  .select();
\`\`\`

**Deleting Data:**
\`\`\`typescript
const { error } = await supabase
  .from('sows')
  .delete()
  .eq('id', sowId);
\`\`\`

### Real-time Subscriptions

\`\`\`typescript
useEffect(() => {
  const channel = supabase
    .channel('sows-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sows' },
      (payload) => {
        console.log('Change received!', payload);
        // Refresh your data here
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
\`\`\`

## Component Patterns

### Server Components (Default)
\`\`\`typescript
// app/sows/page.tsx
import { supabase } from '@/lib/supabase';

export default async function SowsPage() {
  const { data: sows } = await supabase.from('sows').select('*');
  
  return <div>{/* Render sows */}</div>;
}
\`\`\`

### Client Components (For Interactivity)
\`\`\`typescript
'use client'; // Add this at the top

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function SowsPage() {
  const [sows, setSows] = useState([]);
  
  useEffect(() => {
    async function fetchSows() {
      const { data } = await supabase.from('sows').select('*');
      setSows(data || []);
    }
    fetchSows();
  }, []);
  
  return <div>{/* Render sows */}</div>;
}
\`\`\`

## Useful Commands

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
\`\`\`

## Database Tips

### View Your Data
- Go to Supabase Dashboard → Table Editor
- You can manually add/edit/delete rows here for testing

### Testing SQL Queries
- SQL Editor in Supabase lets you test queries
- Example: `SELECT * FROM sows WHERE status = 'active';`

### Common PostgreSQL Functions
- `NOW()` - Current timestamp
- `CURRENT_DATE` - Today's date
- Date math: `CURRENT_DATE + INTERVAL '114 days'`

## Debugging

### Check Supabase Connection
\`\`\`typescript
// Add to any page temporarily
const testConnection = async () => {
  const { data, error } = await supabase.from('sows').select('count');
  console.log('Connection test:', { data, error });
};
\`\`\`

### Console Logging
- Open browser dev tools (F12)
- Console tab shows errors and logs
- Network tab shows Supabase requests

### Common Errors

**"Failed to fetch"**
- Check `.env.local` has correct Supabase URL/key
- Restart dev server after changing .env

**"relation does not exist"**
- Table not created in Supabase
- Run schema.sql again

**"Row Level Security"**
- Check RLS policies in schema.sql
- For development, you can disable RLS temporarily

## Building Features

### Example: Add Sow Form

1. Create form component:
\`\`\`typescript
// components/add-sow-form.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function AddSowForm() {
  const [earTag, setEarTag] = useState('');
  const [breed, setBreed] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('sows')
      .insert([{
        ear_tag: earTag,
        birth_date: new Date().toISOString(),
        breed: breed,
        status: 'active'
      }]);
      
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Sow added!');
      setEarTag('');
      setBreed('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={earTag}
        onChange={(e) => setEarTag(e.target.value)}
        placeholder="Ear Tag"
        className="border p-2 rounded"
      />
      <input
        type="text"
        value={breed}
        onChange={(e) => setBreed(e.target.value)}
        placeholder="Breed"
        className="border p-2 rounded"
      />
      <Button type="submit">Add Sow</Button>
    </form>
  );
}
\`\`\`

2. Use in a page:
\`\`\`typescript
// app/sows/add/page.tsx
import { AddSowForm } from '@/components/add-sow-form';

export default function AddSowPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Add New Sow</h1>
      <AddSowForm />
    </div>
  );
}
\`\`\`

## PWA Testing

### Development
PWA features are disabled in dev mode (normal behavior)

### Testing PWA Features
\`\`\`bash
npm run build
npm start
\`\`\`
Then visit http://localhost:3000

### Install Prompt
- Works on mobile browsers
- Desktop Chrome/Edge have install button in address bar

## TypeScript Tips

Your database types are in `lib/supabase.ts`. Use them!

\`\`\`typescript
import type { Database } from '@/lib/supabase';

type Sow = Database['public']['Tables']['sows']['Row'];
type NewSow = Database['public']['Tables']['sows']['Insert'];
\`\`\`

## Next Steps

1. Build forms for adding/editing sows
2. Create a farrowings tracking page
3. Add vaccination reminder system
4. Build analytics dashboard with charts
5. Implement offline sync

## Resources

- **Supabase Docs**: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- **Next.js App Router**: https://nextjs.org/docs/app
- **Tailwind Classes**: https://tailwindcss.com/docs

---

**Happy coding!** 🚀
