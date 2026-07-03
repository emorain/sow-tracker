import { redirect } from 'next/navigation';

// The standalone breeding list was consolidated into the Breeding Board.
export default function BreedingRedirect() {
  redirect('/breeding-board');
}
