import { redirect } from 'next/navigation';

// Bred sows now live in the Pipeline board's "Bred" column.
export default function BredSowsRedirect() {
  redirect('/pipeline');
}
