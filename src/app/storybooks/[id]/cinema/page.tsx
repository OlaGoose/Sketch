'use client';

import { CinemaMode } from '@/components/CinemaMode';

export default function CinemaPage({ params }: { params: { id: string } }) {
  return <CinemaMode storybookId={params.id} />;
}
