import { redirect } from 'next/navigation';

// Bred sows now live in the Breeding Board's "Bred" column.
export default function BredSowsRedirect() {
  redirect('/breeding-board');
}
