import { redirect } from 'next/navigation';

// The standalone breeding list was consolidated into the Pipeline board.
export default function BreedingRedirect() {
  redirect('/pipeline');
}
