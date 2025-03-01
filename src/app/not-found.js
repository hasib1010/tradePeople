import { Suspense } from 'react';
import NotFoundContent from './NotFoundContent';

export default function NotFoundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}