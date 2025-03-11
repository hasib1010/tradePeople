import { connectToDatabase } from '@/lib/db';
import { Tradesperson } from '@/models/User';
import { AdminTradespersonClient } from './client';

// Generate static params for static optimization (optional)
export async function generateStaticParams() {
  try {
    await connectToDatabase();
    return []; // In production, you might want to pre-generate some common IDs
  } catch (error) {
    console.error('Error connecting to database:', error);
    return [];
  }
}

// Server Component to fetch initial data
export default async function AdminTradespersonPage({ params }) {
  const { id } = params;

  try {
    await connectToDatabase();
    const tradesperson = await Tradesperson.findById(id)
      .lean()
      .populate('jobsApplied')
      .populate('jobsCompleted');

    if (!tradesperson) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Not Found</h1>
          <p className="text-gray-600">Tradesperson not found</p>
        </div>
      );
    }

    // Convert Mongoose document to plain JavaScript object
    const tradespersonData = JSON.parse(JSON.stringify(tradesperson));

    return <AdminTradespersonClient initialData={tradespersonData} id={id} />;
  } catch (error) {
    console.error('Error fetching tradesperson:', error);
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600">{error.message || 'Failed to load tradesperson data'}</p>
      </div>
    );
  }
}