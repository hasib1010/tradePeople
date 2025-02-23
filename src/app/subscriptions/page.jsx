"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { CheckCircle, AlertTriangle, Clock, CreditCard, Shield, Star, Zap, Check, X } from 'lucide-react';
import StripeSubscriptionCheckout from '@/components/StripeSubscriptionCheckout';


export default function SubscriptionsPage() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            redirect('/login?callbackUrl=/subscriptions');
        },
    });

    const [subscriptionData, setSubscriptionData] = useState({
        currentPlan: null,
        loading: true,
        error: null,
    });

    const [subscriptionPlans, setSubscriptionPlans] = useState([]); // Store plans from API
    const [plansLoading, setPlansLoading] = useState(true); // Track plans loading state
    const [plansError, setPlansError] = useState(null); // Track plans loading errors

    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [actionStatus, setActionStatus] = useState(null);

    // Fetch subscription plans from API
    useEffect(() => {
        const fetchSubscriptionPlans = async () => {
            try {
                setPlansLoading(true);
                setPlansError(null);
                
                const response = await fetch('/api/subscriptions/plans');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch subscription plans');
                }
                
                const data = await response.json();
                setSubscriptionPlans(data);
            } catch (error) {
                console.error("Error fetching subscription plans:", error);
                setPlansError("Failed to load subscription plans");
            } finally {
                setPlansLoading(false);
            }
        };
        
        fetchSubscriptionPlans();
    }, []);

    // Fetch user's current subscription
    useEffect(() => {
        const fetchSubscriptionData = async () => {
            if (status !== "authenticated") return;

            try {
                const response = await fetch('/api/subscriptions');

                if (!response.ok) {
                    throw new Error('Failed to fetch subscription data');
                }

                const data = await response.json();

                setSubscriptionData({
                    currentPlan: data.currentPlan,
                    nextBillingDate: data.nextBillingDate,
                    autoRenew: data.autoRenew,
                    loading: false,
                    error: null,
                });
            } catch (error) {
                console.error("Error fetching subscription data:", error);
                setSubscriptionData(prev => ({
                    ...prev,
                    loading: false,
                    error: "Failed to load subscription data",
                }));
            }
        };

        if (status === "authenticated") {
            fetchSubscriptionData();
        }
    }, [status]);

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
    };

    const handleSubscribeClick = () => {
        if (!selectedPlan) {
            setActionStatus({ success: false, message: 'Please select a subscription plan' });
            return;
        }

        // Show checkout instead of handling subscription directly
        setShowCheckout(true);
    };

    const handleManageSubscription = async (action) => {
        try {
            setActionStatus({ loading: true });

            const response = await fetch('/api/subscriptions', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action, // 'cancel', 'reactivate', 'toggle-autorenew'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update subscription');
            }

            // Update local state
            setSubscriptionData(prev => ({
                ...prev,
                currentPlan: data.currentPlan,
                nextBillingDate: data.nextBillingDate,
                autoRenew: data.autoRenew,
            }));

            setActionStatus({
                success: true,
                message: action === 'cancel'
                    ? 'Your subscription has been canceled'
                    : action === 'reactivate'
                        ? 'Your subscription has been reactivated'
                        : 'Auto-renewal settings updated'
            });

        } catch (error) {
            console.error("Error updating subscription:", error);
            setActionStatus({
                success: false,
                message: error.message || 'Failed to update subscription'
            });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Combined loading state for both subscriptions and plans
    if (status === "loading" || subscriptionData.loading || plansLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const handlePaymentSuccess = async (paymentIntent) => {
        // Payment was successful
        setActionStatus({
            success: true,
            message: `Successfully subscribed to ${selectedPlan.name} plan!`
        });

        // Close the Stripe checkout
        setShowCheckout(false);

        // Reset selected plan
        setSelectedPlan(null);

        // Refresh subscription data
        const fetchSubscriptionData = async () => {
            try {
                const response = await fetch('/api/subscriptions');
                if (response.ok) {
                    const data = await response.json();
                    setSubscriptionData({
                        currentPlan: data.currentPlan,
                        nextBillingDate: data.nextBillingDate,
                        autoRenew: data.autoRenew,
                        loading: false,
                        error: null,
                    });
                }
            } catch (error) {
                console.error("Error refreshing subscription data:", error);
            }
        };
        
        await fetchSubscriptionData();
    };

    const handlePaymentCancel = () => {
        setShowCheckout(false);
        setActionStatus(null);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Choose a subscription plan to boost your profile and get monthly credits
                    </p>
                </div>

                {subscriptionData.error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{subscriptionData.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {plansError && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{plansError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {actionStatus?.success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-400" />
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

                {/* Current Subscription Card */}
                {subscriptionData.currentPlan && (
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg mb-8">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-medium text-gray-900">Your Current Subscription</h2>
                                    <p className="text-sm text-gray-500">Manage your current subscription plan</p>
                                </div>
                                <div className="bg-blue-100 rounded-full p-3">
                                    <CreditCard className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="flex items-center">
                                            <h3 className="text-xl font-bold text-gray-900">{subscriptionData.currentPlan.name} Plan</h3>
                                            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">${subscriptionData.currentPlan.price}/{subscriptionData.currentPlan.billingPeriod}</p>
                                        <div className="mt-2 flex items-center text-sm text-gray-500">
                                            <Clock className="mr-1 h-4 w-4" />
                                            Next billing date: {formatDate(subscriptionData.nextBillingDate)}
                                        </div>
                                        <div className="mt-1 flex items-center text-sm text-gray-500">
                                            <Zap className="mr-1 h-4 w-4" />
                                            {subscriptionData.currentPlan.credits} credits per {subscriptionData.currentPlan.billingPeriod}
                                        </div>
                                        <div className="mt-1 flex items-center text-sm text-gray-500">
                                            <CreditCard className="mr-1 h-4 w-4" />
                                            Auto-renew: {subscriptionData.autoRenew ? (
                                                <span className="text-green-600 ml-1">Enabled</span>
                                            ) : (
                                                <span className="text-red-600 ml-1">Disabled</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 md:mt-0 space-y-2">
                                        <button
                                            onClick={() => handleManageSubscription('toggle-autorenew')}
                                            className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            {subscriptionData.autoRenew ? 'Disable Auto-renew' : 'Enable Auto-renew'}
                                        </button>
                                        <button
                                            onClick={() => handleManageSubscription('cancel')}
                                            className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            Cancel Subscription
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Select Subscription Plan */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {subscriptionData.currentPlan ? 'Change Subscription Plan' : 'Select a Subscription Plan'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {subscriptionPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`border rounded-lg overflow-hidden relative ${selectedPlan?.id === plan.id
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                    } ${plan.featured ? 'shadow-md' : ''}`}
                                onClick={() => handlePlanSelect(plan)}
                            >
                                {plan.featured && (
                                    <div className="absolute top-0 inset-x-0 h-2 bg-blue-500"></div>
                                )}
                                <div className={`p-6 ${plan.featured ? 'bg-blue-50' : 'bg-white'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                            <div className="mt-1">
                                                <span className="text-2xl font-bold text-gray-900">${parseFloat(plan.price).toFixed(2)}</span>
                                                <span className="text-sm text-gray-500">/{plan.billingPeriod}</span>
                                            </div>
                                        </div>
                                        {plan.featured && (
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full uppercase font-medium">
                                                Popular
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            <Zap className="h-5 w-5 text-blue-500 mr-2" />
                                            <p className="text-sm font-medium">{plan.credits} credits per {plan.billingPeriod}</p>
                                        </div>
                                    </div>

                                    <hr className="my-4 border-gray-200" />

                                    <ul className="space-y-3">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                                <span className="text-sm text-gray-600">{feature}</span>
                                            </li>
                                        ))}
                                        {plan.nonFeatures && plan.nonFeatures.map((feature, idx) => (
                                            <li key={`non-${idx}`} className="flex items-start text-gray-400">
                                                <X className="h-5 w-5 text-gray-300 mr-2 flex-shrink-0" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        type="button"
                                        onClick={() => handlePlanSelect(plan)}
                                        className={`mt-6 w-full py-2 px-4 rounded-md font-medium ${selectedPlan?.id === plan.id
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                    >
                                        {selectedPlan?.id === plan.id ? 'Selected' : 'Select'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {showCheckout ? (
                        <div className="mt-4 mb-8">
                            <StripeSubscriptionCheckout
                                planId={selectedPlan?.id}
                                onSuccess={handlePaymentSuccess}
                                onCancel={handlePaymentCancel}
                            />
                        </div>
                    ) : (
                        <div>
                            {/* Your existing plan selection UI */}
                        </div>
                    )}
                </div>

                {/* Subscription Action Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleSubscribeClick}
                        disabled={!selectedPlan || actionStatus?.loading}
                        className={`px-8 py-3 rounded-md font-medium ${!selectedPlan || actionStatus?.loading
                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                        {actionStatus?.loading ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                Processing...
                            </div>
                        ) : subscriptionData.currentPlan ? (
                            'Change Subscription'
                        ) : (
                            'Subscribe Now'
                        )}
                    </button>
                </div>

                {/* Subscription Benefits */}
                <div className="mt-16">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                        Benefits of a Subscription
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <CreditCard className="h-8 w-8 text-blue-600" />
                                </div>
                            </div>
                            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
                                Monthly Credits
                            </h3>
                            <p className="text-gray-600 text-center">
                                Get a fixed amount of credits every month to apply for jobs without additional purchases.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <Star className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
                                Enhanced Visibility
                            </h3>
                            <p className="text-gray-600 text-center">
                                Get featured in search results and recommended tradespeople lists to attract more customers.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Shield className="h-8 w-8 text-purple-600" />
                                </div>
                            </div>
                            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
                                Priority Status
                            </h3>
                            <p className="text-gray-600 text-center">
                                Your applications get priority consideration from customers looking for quality tradespeople.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-16">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Frequently Asked Questions
                    </h2>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900">
                                What happens to my unused credits?
                            </h3>
                            <p className="mt-2 text-gray-600">
                                Unused credits roll over to the next month as long as your subscription remains active. If you cancel your subscription, you'll have 30 days to use any remaining credits.
                            </p>
                        </div>

                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900">
                                Can I change my plan?
                            </h3>
                            <p className="mt-2 text-gray-600">
                                Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
                            </p>
                        </div>

                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900">
                                How do I cancel my subscription?
                            </h3>
                            <p className="mt-2 text-gray-600">
                                You can cancel your subscription at any time from this page. Your subscription benefits will continue until the end of your current billing period.
                            </p>
                        </div>

                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900">
                                Do I need a subscription to use the platform?
                            </h3>
                            <p className="mt-2 text-gray-600">
                                No, a subscription is optional. You can still purchase credits individually and use the platform without a subscription, but subscriptions provide the best value and additional benefits.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}