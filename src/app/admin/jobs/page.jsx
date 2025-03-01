import { Suspense } from 'react';
import AdminJobsPageContent from './AdminJobsPageContent';

export default function AdminJobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <AdminJobsPageContent />
    </Suspense>
  );
}