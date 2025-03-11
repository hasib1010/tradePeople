'use client';
// app/admin/tradespeople/[id]/client.jsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// UI components
import Breadcrumb from '@/components/ui/Breadcrumb';
import Spinner from '@/components/ui/Spinner';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { FormLabel } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalClose,
} from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/use-toast';

export function AdminTradespersonClient({ initialData, id }) {
  const router = useRouter();
  const [tradesperson, setTradesperson] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value,
      },
    }));
  };

  const handleRateChange = (e) => {
    const value = parseFloat(e.target.value);
    setFormData((prev) => ({
      ...prev,
      hourlyRate: isNaN(value) ? 0 : value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/tradespeople/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update tradesperson');
      }

      const updatedTradesperson = await response.json();
      setTradesperson(updatedTradesperson);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Tradesperson information updated successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update tradesperson',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(tradesperson);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/tradespeople/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete tradesperson');
      }

      toast({
        title: 'Success',
        description: 'Tradesperson account deleted successfully',
      });
      router.push('/admin/tradespeople');
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete tradesperson',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setLoading(true);
      const newStatus = tradesperson.isActive ? false : true;

      const response = await fetch(`/api/admin/tradespeople/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      setTradesperson({
        ...tradesperson,
        isActive: newStatus,
      });

      toast({
        title: 'Success',
        description: `Tradesperson account ${newStatus ? 'activated' : 'suspended'} successfully`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setSuspendDialogOpen(false);
    }
  };

  const handleAddCredits = async (amount) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/tradespeople/${id}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          transactionType: 'bonus',
          notes: 'Admin credit adjustment',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add credits');
      }

      const updatedTradesperson = await response.json();
      setTradesperson(updatedTradesperson);

      toast({
        title: 'Success',
        description: `${amount} credits added successfully`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to add credits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tradesperson) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/admin' },
              { label: 'Tradespeople', href: '/admin/tradespeople' },
              { label: `${tradesperson.firstName} ${tradesperson.lastName}`, href: '#' },
            ]}
          />
          <h1 className="text-2xl font-bold mt-2">
            {tradesperson.firstName} {tradesperson.lastName}
            <StatusBadge
              className="ml-3"
              status={tradesperson.isActive ? 'active' : 'suspended'}
            />
          </h1>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
              <Modal>
                <ModalTrigger asChild>
                  <Button variant={tradesperson.isActive ? 'destructive' : 'outline'}>
                    {tradesperson.isActive ? 'Suspend' : 'Activate'}
                  </Button>
                </ModalTrigger>
                <ModalContent>
                  <ModalHeader>
                    <ModalTitle>
                      {tradesperson.isActive
                        ? 'Are you sure you want to suspend this account?'
                        : 'Are you sure you want to activate this account?'}
                    </ModalTitle>
                    <ModalDescription>
                      {tradesperson.isActive
                        ? `This will prevent ${tradesperson.firstName} ${tradesperson.lastName} from logging in or using the platform until the account is activated again.`
                        : `This will allow ${tradesperson.firstName} ${tradesperson.lastName} to login and use the platform again.`}
                    </ModalDescription>
                  </ModalHeader>
                  <ModalFooter>
                    <ModalClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </ModalClose>
                    <Button
                      onClick={handleToggleActive}
                      variant={tradesperson.isActive ? 'destructive' : 'default'}
                    >
                      {tradesperson.isActive ? 'Suspend' : 'Activate'}
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
              <Modal>
                <ModalTrigger asChild>
                  <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                    Delete
                  </Button>
                </ModalTrigger>
                <ModalContent>
                  <ModalHeader>
                    <ModalTitle>Are you sure you want to delete this account?</ModalTitle>
                    <ModalDescription>
                      This action will permanently delete {tradesperson.firstName}{' '}
                      {tradesperson.lastName}'s account and all associated data. This action cannot be
                      undone.
                    </ModalDescription>
                  </ModalHeader>
                  <ModalFooter>
                    <ModalClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </ModalClose>
                    <Button variant="destructive" onClick={handleDelete}>
                      Delete
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </>
          ) : (
            <>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? <Spinner size="sm" className="mr-2" /> : null}
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Profile Image</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative w-48 h-48 rounded-full overflow-hidden mb-4">
                  <Image
                    src={tradesperson.profileImage || '/images/default-profile.jpg'}
                    alt={`${tradesperson.firstName} ${tradesperson.lastName}`}
                    fill
                    className="object-cover"
                  />
                </div>
                {isEditing && (
                  <Button variant="outline" className="mt-2">
                    Change Image
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel htmlFor="firstName">First Name</FormLabel>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{tradesperson.firstName}</p>
                    )}
                  </div>
                  <div>
                    <FormLabel htmlFor="lastName">Last Name</FormLabel>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{tradesperson.lastName}</p>
                    )}
                  </div>
                  <div>
                    <FormLabel htmlFor="email">Email</FormLabel>
                    {isEditing ? (
                      <Input
                        id="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{tradesperson.email}</p>
                    )}
                  </div>
                  <div>
                    <FormLabel htmlFor="phoneNumber">Phone Number</FormLabel>
                    {isEditing ? (
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{tradesperson.phoneNumber}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="font-medium mb-2 mt-4">Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FormLabel htmlFor="address">Address</FormLabel>
                        {isEditing ? (
                          <Input
                            id="address"
                            name="address"
                            value={formData.location?.address || ''}
                            onChange={handleLocationChange}
                            className="mt-1"
                          />
                        ) : (
                          <p className="mt-1">{tradesperson.location?.address || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <FormLabel htmlFor="city">City</FormLabel>
                        {isEditing ? (
                          <Input
                            id="city"
                            name="city"
                            value={formData.location?.city || ''}
                            onChange={handleLocationChange}
                            className="mt-1"
                          />
                        ) : (
                          <p className="mt-1">{tradesperson.location?.city || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <FormLabel htmlFor="state">State</FormLabel>
                        {isEditing ? (
                          <Input
                            id="state"
                            name="state"
                            value={formData.location?.state || ''}
                            onChange={handleLocationChange}
                            className="mt-1"
                          />
                        ) : (
                          <p className="mt-1">{tradesperson.location?.state || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <FormLabel htmlFor="postalCode">Postal Code</FormLabel>
                        {isEditing ? (
                          <Input
                            id="postalCode"
                            name="postalCode"
                            value={formData.location?.postalCode || ''}
                            onChange={handleLocationChange}
                            className="mt-1"
                          />
                        ) : (
                          <p className="mt-1">{tradesperson.location?.postalCode || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <FormLabel htmlFor="country">Country</FormLabel>
                        {isEditing ? (
                          <Input
                            id="country"
                            name="country"
                            value={formData.location?.country || ''}
                            onChange={handleLocationChange}
                            className="mt-1"
                          />
                        ) : (
                          <p className="mt-1">{tradesperson.location?.country || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium">Email Verification</h3>
                    <p className="mt-1">
                      <Badge variant={tradesperson.isVerified ? 'success' : 'warning'}>
                        {tradesperson.isVerified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Account Status</h3>
                    <p className="mt-1">
                      <Badge variant={tradesperson.isActive ? 'success' : 'destructive'}>
                        {tradesperson.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Registered On</h3>
                    <p className="mt-1">{new Date(tradesperson.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Last Login</h3>
                    <p className="mt-1">
                      {tradesperson.lastLogin
                        ? new Date(tradesperson.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FormLabel htmlFor="businessName">Business Name</FormLabel>
                    {isEditing ? (
                      <Input
                        id="businessName"
                        name="businessName"
                        value={formData.businessName || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{tradesperson.businessName || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <FormLabel htmlFor="hourlyRate">Hourly Rate</FormLabel>
                    {isEditing ? (
                      <Input
                        id="hourlyRate"
                        name="hourlyRate"
                        type="number"
                        value={formData.hourlyRate || ''}
                        onChange={handleRateChange}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">${tradesperson.hourlyRate || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <FormLabel htmlFor="yearsOfExperience">Years of Experience</FormLabel>
                    {isEditing ? (
                      <Input
                        id="yearsOfExperience"
                        name="yearsOfExperience"
                        type="number"
                        value={formData.yearsOfExperience || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{tradesperson.yearsOfExperience || 'N/A'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <FormLabel htmlFor="description">Business Description</FormLabel>
                    {isEditing ? (
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                        rows={4}
                      />
                    ) : (
                      <p className="mt-1">{tradesperson.description || 'No description provided.'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tradesperson.skills && tradesperson.skills.length > 0 ? (
                    tradesperson.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p>No skills listed.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Insurance Information</CardTitle>
              </CardHeader>
              <CardContent>
                {tradesperson.insurance && tradesperson.insurance.hasInsurance ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium">Provider</h3>
                      <p>{tradesperson.insurance.insuranceProvider || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Policy Number</h3>
                      <p>{tradesperson.insurance.policyNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Coverage Amount</h3>
                      <p>${tradesperson.insurance.coverageAmount?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Expiration Date</h3>
                      <p>
                        {tradesperson.insurance.expirationDate
                          ? new Date(tradesperson.insurance.expirationDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Verification Status</h3>
                      <Badge variant={tradesperson.insurance.isVerified ? 'success' : 'warning'}>
                        {tradesperson.insurance.isVerified ? 'Verified' : 'Pending Verification'}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-medium">Document</h3>
                      {tradesperson.insurance.documentUrl ? (
                        <Link
                          href={tradesperson.insurance.documentUrl}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          View Document
                        </Link>
                      ) : (
                        <p>No document uploaded</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p>No insurance information provided.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="certifications">
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              {tradesperson.certifications && tradesperson.certifications.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Issuing Organization</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Document</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tradesperson.certifications.map((cert, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{cert.name}</TableCell>
                          <TableCell>{cert.issuingOrganization}</TableCell>
                          <TableCell>
                            {cert.dateIssued
                              ? new Date(cert.dateIssued).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {cert.expirationDate
                              ? new Date(cert.expirationDate).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={cert.isVerified ? 'success' : 'warning'}>
                              {cert.isVerified ? 'Verified' : 'Pending Verification'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {cert.documentUrl ? (
                              <Link
                                href={cert.documentUrl}
                                target="_blank"
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </Link>
                            ) : (
                              'No document'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p>No certifications added.</p>
              )}
            </CardContent>
            {isEditing && (
              <CardFooter>
                <Button variant="outline">Add New Certification</Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {tradesperson.portfolio && tradesperson.portfolio.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tradesperson.portfolio.map((project, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription>
                          {project.projectDate
                            ? new Date(project.projectDate).toLocaleDateString()
                            : 'No date'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative w-full h-48 mb-4 rounded overflow-hidden">
                          {project.imageUrls && project.imageUrls.length > 0 ? (
                            <Image
                              src={project.imageUrls[0]}
                              alt={project.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <p className="text-gray-500">No image</p>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {project.description || 'No description provided.'}
                        </p>
                      </CardContent>
                      {isEditing && (
                        <CardFooter>
                          <Button variant="outline" size="sm">
                            Edit Project
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p>No portfolio projects added.</p>
              )}
            </CardContent>
            {isEditing && (
              <CardFooter>
                <Button variant="outline">Add New Project</Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="credits">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Credit Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {tradesperson.credits?.available || 0}
                  </div>
                  <p className="text-gray-500 mb-6">Available Credits</p>
                  <div className="flex flex-col gap-3">
                    <Button onClick={() => handleAddCredits(5)}>Add 5 Credits</Button>
                    <Button onClick={() => handleAddCredits(10)}>Add 10 Credits</Button>
                    <Button onClick={() => handleAddCredits(20)}>Add 20 Credits</Button>
                    <Button variant="outline" onClick={() => handleAddCredits(50)}>
                      Add 50 Credits
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full">
                  <p className="text-sm text-gray-500 mb-2">
                    Total Credits Spent: {tradesperson.credits?.spent || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    Last Purchase:{' '}
                    {tradesperson.credits?.lastPurchase?.date
                      ? new Date(tradesperson.credits.lastPurchase.date).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </CardFooter>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Credit History</CardTitle>
              </CardHeader>
              <CardContent>
                {tradesperson.credits?.history && tradesperson.credits.history.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tradesperson.credits.history
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .slice(0, 10)
                          .map((transaction, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {new Date(transaction.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell
                                className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}
                              >
                                {transaction.amount > 0 ? '+' : ''}
                                {transaction.amount}
                              </TableCell>
                              <TableCell className="capitalize">{transaction.transactionType}</TableCell>
                              <TableCell>{transaction.notes || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p>No transaction history available.</p>
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                {tradesperson.subscription?.plan ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-medium">Plan</h3>
                      <p>{tradesperson.subscription.plan || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Status</h3>
                      <Badge
                        variant={
                          tradesperson.subscription.status === 'active'
                            ? 'success'
                            : tradesperson.subscription.status === 'pending'
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        {tradesperson.subscription.status}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-medium">Auto-Renew</h3>
                      <p>{tradesperson.subscription.autoRenew ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Start Date</h3>
                      <p>
                        {tradesperson.subscription.startDate
                          ? new Date(tradesperson.subscription.startDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">End Date</h3>
                      <p>
                        {tradesperson.subscription.endDate
                          ? new Date(tradesperson.subscription.endDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Stripe ID</h3>
                      <p className="text-sm">{tradesperson.subscription.stripeSubscriptionId || 'N/A'}</p>
                    </div>
                  </div>
                ) : (
                  <p>No active subscription.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Jobs Applied</CardTitle>
              </CardHeader>
              <CardContent>
                {tradesperson.jobsApplied && tradesperson.jobsApplied.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Date Applied</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tradesperson.jobsApplied.map((job, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">
                              {job._id?.substring(0, 8) || 'N/A'}
                            </TableCell>
                            <TableCell>{job.title || 'N/A'}</TableCell>
                            <TableCell>{job.customerName || 'N/A'}</TableCell>
                            <TableCell>
                              {job.appliedDate
                                ? new Date(job.appliedDate).toLocaleDateString()
                                : 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  job.status === 'awarded'
                                    ? 'success'
                                    : job.status === 'rejected'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {job.status || 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Link href={`/admin/jobs/${job._id}`} className="text-blue-600 hover:underline">
                                View
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p>No jobs applied to.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Jobs Completed</CardTitle>
              </CardHeader>
              <CardContent>
                {tradesperson.jobsCompleted && tradesperson.jobsCompleted.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Completion Date</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tradesperson.jobsCompleted.map((job, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">
                              {job._id?.substring(0, 8) || 'N/A'}
                            </TableCell>
                            <TableCell>{job.title || 'N/A'}</TableCell>
                            <TableCell>{job.customerName || 'N/A'}</TableCell>
                            <TableCell>
                              {job.completionDate
                                ? new Date(job.completionDate).toLocaleDateString()
                                : 'Unknown'}
                            </TableCell>
                            <TableCell>{job.rating ? `${job.rating}/5` : 'No rating'}</TableCell>
                            <TableCell>
                              <Link href={`/admin/jobs/${job._id}`} className="text-blue-600 hover:underline">
                                View
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p>No completed jobs.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default AdminTradespersonClient;