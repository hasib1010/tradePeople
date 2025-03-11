import { connectToDatabase } from '@/lib/db';
import { Tradesperson } from '@/models/User';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Spinner from '@/components/ui/Spinner';

// Server Component to fetch and display all tradespeople
export default async function AdminTradespeoplePage() {
  try {
    await connectToDatabase();
    const tradespeople = await Tradesperson.find()
      .lean()
      .sort({ createdAt: -1 }); // Sort by newest first

    if (!tradespeople || tradespeople.length === 0) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/admin' },
              { label: 'Tradespeople', href: '/admin/tradespeople' },
            ]}
          />
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tradespeople</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">No tradespeople found.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Convert Mongoose documents to plain JavaScript objects
    const tradespeopleData = JSON.parse(JSON.stringify(tradespeople));

    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Tradespeople', href: '/admin/tradespeople' },
          ]}
        />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tradespeople</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradespeopleData.map((tradesperson) => (
                    <TableRow key={tradesperson._id}>
                      <TableCell className="font-medium">
                        {tradesperson.firstName} {tradesperson.lastName}
                      </TableCell>
                      <TableCell>{tradesperson.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={tradesperson.isActive ? 'success' : 'destructive'}
                        >
                          {tradesperson.isActive ? 'Active' : 'Suspended'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(tradesperson.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {tradesperson.credits?.available || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/tradespeople/${tradesperson._id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          {/* Add more actions like Edit/Delete if needed */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error fetching tradespeople:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Tradespeople', href: '/admin/tradespeople' },
          ]}
        />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tradespeople</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
              <p className="text-gray-600">
                {error.message || 'Failed to load tradespeople'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

// Optional: Generate static params for pre-rendering (if you want static generation)
export async function generateStaticParams() {
  try {
    await connectToDatabase();
    const tradespeople = await Tradesperson.find().select('_id').lean();
    return tradespeople.map((tradesperson) => ({
      id: tradesperson._id.toString(),
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}