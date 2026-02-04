'use client';

import { StorybookDetail } from '@/components/StorybookDetail';

export default function StorybookPage({ params }: { params: { id: string } }) {
  return <StorybookDetail storybookId={params.id} />;
}
