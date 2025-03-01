// src/app/dashboard/admin/subscription-plans/page.js
"use client"
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, Check, X, ChevronLeft, AlertTriangle } from "lucide-react";

export default function SubscriptionPlansContent() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/login?callbackUrl=/dashboard/admin/subscription-plans");
        },
    });

    // Check if user is admin
    useEffect(() => {
        if (status === "authenticated" && session?.user?.role !== "admin") {
            redirect(`/dashboard/${session?.user?.role || ""}`);
        }
    }, [status, session]);

    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionStatus, setActionStatus] = useState(null);

    // For edit/create form
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        planCode: '',
        price: 0,
        billingPeriod: 'month',
        credits: 0,
        featured: false,
        features: [''],
        nonFeatures: ['']
    });

    // Fetch subscription plans
    useEffect(() => {
        async function fetchSubscriptionPlans() {
            try {
                const response = await fetch('/api/admin/subscription-plans');

                if (!response.ok) {
                    throw new Error('Failed to fetch subscription plans');
                }

                const data = await response.json();
                setSubscriptionPlans(data);
            } catch (error) {
                console.error('Error fetching subscription plans:', error);
                setActionStatus({
                    success: false,
                    message: 'Failed to load subscription plans'
                });
            } finally {
                setLoading(false);
            }
        }

        if (status === "authenticated" && session?.user?.role === "admin") {
            fetchSubscriptionPlans();
        }
    }, [status, session]);

    // Handle create new plan
    const handleCreatePlan = () => {
        setFormData({
            id: '',
            name: '',
            price: 0,
            billingPeriod: 'month',
            credits: 0,
            featured: false,
            features: [''],
            nonFeatures: ['']
        });
        setEditingPlan(null);
        setIsFormOpen(true);
    };

    // Handle edit plan
    const handleEditPlan = (plan) => {
        setFormData({
            ...plan,
            price: parseFloat(plan.price)
        });
        setEditingPlan(plan.id); 
        setIsFormOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
        });
    };

    // Handle feature list changes
    const handleFeatureChange = (index, value, type = 'features') => {
        const updatedList = [...formData[type]];
        updatedList[index] = value;
        setFormData({
            ...formData,
            [type]: updatedList
        });
    };

    // Add new feature/non-feature field
    const handleAddItem = (type = 'features') => {
        setFormData({
            ...formData,
            [type]: [...formData[type], '']
        });
    };

    // Remove feature/non-feature field
    const handleRemoveItem = (index, type = 'features') => {
        const updatedList = formData[type].filter((_, i) => i !== index);
        setFormData({
            ...formData,
            [type]: updatedList
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clean up empty features and nonFeatures
        const cleanFormData = {
            ...formData,
            features: formData.features.filter(feature => feature.trim() !== ''),
            nonFeatures: formData.nonFeatures.filter(feature => feature.trim() !== '')
        };

        try {
            setActionStatus({
                loading: true
            });

            const method = editingPlan ? 'PUT' : 'POST';
            const url = editingPlan
                ? `/api/admin/subscription-plans/${editingPlan}`
                : '/api/admin/subscription-plans';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cleanFormData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save subscription plan');
            }

            const savedPlan = await response.json();

            // Update the plans list
            if (editingPlan) {
                setSubscriptionPlans(subscriptionPlans.map(plan =>
                    plan.id === savedPlan.id ? savedPlan : plan
                ));
            } else {
                setSubscriptionPlans([...subscriptionPlans, savedPlan]);
            }

            setActionStatus({
                success: true,
                message: `Subscription plan ${editingPlan ? 'updated' : 'created'} successfully`
            });

            // Close the form
            setIsFormOpen(false);
            setEditingPlan(null);

        } catch (error) {
            console.error('Error saving subscription plan:', error);
            setActionStatus({
                success: false,
                message: error.message
            });
        }
    };

    // Handle delete plan
    const handleDeletePlan = async (planId) => {
        if (!confirm('Are you sure you want to delete this subscription plan? This action cannot be undone.')) {
            return;
        }

        try {
            setActionStatus({
                loading: true
            });

            const response = await fetch(`/api/admin/subscription-plans/${planId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete subscription plan');
            }

            // Remove the plan from the list
            setSubscriptionPlans(subscriptionPlans.filter(plan => plan.id !== planId));

            setActionStatus({
                success: true,
                message: 'Subscription plan deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting subscription plan:', error);
            setActionStatus({
                success: false,
                message: error.message
            });
        }
    };

    // Cancel form editing
    const handleCancelForm = () => {
        setIsFormOpen(false);
        setEditingPlan(null);
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center mb-4">
                            <Link href="/dashboard/admin" className="mr-2 text-blue-600 hover:text-blue-800">
                                <ChevronLeft className="h-5 w-5" />
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
                        </div>
                        <p className="text-sm text-gray-600">
                            Manage subscription plans for tradespeople
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <button
                            onClick={handleCreatePlan}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Plan
                        </button>
                    </div>
                </div>

                {/* Status messages */}
                {actionStatus?.success === true && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Check className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">{actionStatus.message}</p>
                            </div>
                        </div>
                    </div>
                )}

                {actionStatus?.success === false && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{actionStatus.message}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form for creating/editing plans */}
                {isFormOpen && (
                    <div className="mb-8 bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                            </h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="planCode" className="block text-sm font-medium text-gray-700">
                                            Plan Code
                                        </label>
                                        <input
                                            type="text"
                                            name="planCode"
                                            id="planCode"
                                            value={formData.planCode || ""}
                                            onChange={handleInputChange}
                                            disabled={!!editingPlan}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Optional code for the plan (e.g. "basic", "premium")
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                            Plan Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                                            Price
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">$</span>
                                            </div>
                                            <input
                                                type="number"
                                                name="price"
                                                id="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                required
                                                className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="billingPeriod" className="block text-sm font-medium text-gray-700">
                                            Billing Period
                                        </label>
                                        <select
                                            id="billingPeriod"
                                            name="billingPeriod"
                                            value={formData.billingPeriod}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="month">Monthly</option>
                                            <option value="year">Yearly</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="credits" className="block text-sm font-medium text-gray-700">
                                            Credits per Period
                                        </label>
                                        <input
                                            type="number"
                                            name="credits"
                                            id="credits"
                                            value={formData.credits}
                                            onChange={handleInputChange}
                                            min="0"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <div className="flex items-center mb-2">
                                            <input
                                                id="featured"
                                                name="featured"
                                                type="checkbox"
                                                checked={formData.featured}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                                                Featured Plan (highlighted in UI)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-2">Features</h4>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Add features that are included in this plan
                                    </p>

                                    {formData.features.map((feature, index) => (
                                        <div key={index} className="flex items-center mb-2">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => handleFeatureChange(index, e.target.value, 'features')}
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(index, 'features')}
                                                className="ml-2 text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => handleAddItem('features')}
                                        className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Feature
                                    </button>
                                </div>

                                {/* Non-Features */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-2">Non-Features</h4>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Add features that are NOT included in this plan
                                    </p>

                                    {formData.nonFeatures.map((feature, index) => (
                                        <div key={index} className="flex items-center mb-2">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => handleFeatureChange(index, e.target.value, 'nonFeatures')}
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(index, 'nonFeatures')}
                                                className="ml-2 text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => handleAddItem('nonFeatures')}
                                        className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Non-Feature
                                    </button>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={handleCancelForm}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionStatus?.loading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        {actionStatus?.loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Plan'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Display current subscription plans */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {subscriptionPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-white overflow-hidden shadow rounded-lg border ${plan.featured ? 'border-blue-500' : 'border-gray-200'
                                } relative`}
                        >
                            {plan.featured && (
                                <div className="absolute top-0 inset-x-0 h-1 bg-blue-500"></div>
                            )}
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                        <div className="mt-1">
                                            <span className="text-2xl font-bold text-gray-900">${parseFloat(plan.price).toFixed(2)}</span>
                                            <span className="text-sm text-gray-500">/{plan.billingPeriod}</span>
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEditPlan(plan)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePlan(plan.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center">
                                    <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <p className="text-sm font-medium">{plan.credits} credits per {plan.billingPeriod}</p>
                                </div>

                                <hr className="my-4 border-gray-200" />

                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                                    <ul className="space-y-2">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                                <span className="text-sm text-gray-600">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {plan.nonFeatures && plan.nonFeatures.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Not Included:</h4>
                                        <ul className="space-y-2">
                                            {plan.nonFeatures.map((feature, idx) => (
                                                <li key={idx} className="flex items-start text-gray-400">
                                                    <X className="h-5 w-5 text-gray-300 mr-2 flex-shrink-0" />
                                                    <span className="text-sm">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="mt-4 text-sm text-gray-500">
                                    <strong>ID: </strong>{plan.id}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}