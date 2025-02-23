// src/app/api/subscriptions/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import Subscription from "@/models/Subscription";
import Transaction from "@/models/Transaction";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET current subscription
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Make sure we're dealing with a tradesperson
    if (session.user.role !== "tradesperson") {
      return NextResponse.json(
        { error: "Only tradespeople can have subscriptions" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    // Get user with subscription information
    const user = await Tradesperson.findById(session.user.id)
      .populate('subscription.plan')
      .lean();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // If user has no subscription plan
    if (!user.subscription?.plan) {
      return NextResponse.json({
        currentPlan: null,
        message: "No active subscription found"
      });
    }
    
    // Format subscription data for response
    const subscriptionData = {
      currentPlan: {
        id: user.subscription.plan._id.toString(),
        name: user.subscription.plan.name,
        price: user.subscription.plan.price,
        billingPeriod: user.subscription.plan.billingPeriod,
        credits: user.subscription.plan.creditsPerPeriod,
      },
      status: user.subscription.status,
      startDate: user.subscription.startDate,
      nextBillingDate: user.subscription.endDate,
      autoRenew: user.subscription.autoRenew,
      stripeSubscriptionId: user.subscription.stripeSubscriptionId
    };
    
    return NextResponse.json(subscriptionData);
  } catch (error) {
    console.error("Error fetching subscription data:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription data" },
      { status: 500 }
    );
  }
}

// POST new subscription
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Make sure we're dealing with a tradesperson
    if (session.user.role !== "tradesperson") {
      return NextResponse.json(
        { error: "Only tradespeople can subscribe to plans" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validate the request body
    if (!body.planId) {
      return NextResponse.json(
        { error: "Missing plan ID" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find the subscription plan
    const plan = await Subscription.findById(body.planId);
    
    if (!plan) {
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 }
      );
    }
    
    // Find the user
    const user = await Tradesperson.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if user already has an active subscription
    if (user.subscription?.status === 'active') {
      return NextResponse.json(
        { error: "User already has an active subscription" },
        { status: 400 }
      );
    }
    
    try {
      // Create a Stripe customer if not exists
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user._id.toString()
          }
        });
        
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      }
      
      // Create a subscription in Stripe
      const stripeSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${plan.name} Subscription`,
                description: `${plan.creditsPerPeriod} credits per ${plan.billingPeriod}`,
              },
              unit_amount: Math.round(plan.price * 100), // in cents
              recurring: {
                interval: plan.billingPeriod === 'month' ? 'month' : 'year',
              }
            },
          },
        ],
        metadata: {
          userId: user._id.toString(),
          planId: plan._id.toString()
        }
      });
      
      // Calculate the end date based on billing period
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      if (plan.billingPeriod === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.billingPeriod === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      // Update user's subscription
      user.subscription = {
        plan: plan._id,
        status: 'active',
        startDate: startDate,
        endDate: endDate,
        autoRenew: true,
        stripeSubscriptionId: stripeSubscription.id
      };
      
      await user.save();
      
      // Add the initial credits
      if (!user.credits) {
        user.credits = { available: 0, spent: 0, history: [] };
      }
      
      user.credits.available += plan.creditsPerPeriod;
      
      // Add transaction record for credits
      const transaction = new Transaction({
        userId: user._id,
        amount: plan.creditsPerPeriod,
        type: 'subscription',
        description: `${plan.creditsPerPeriod} credits from ${plan.name} subscription`,
        status: 'completed',
        metadata: {
          subscriptionId: stripeSubscription.id,
          planId: plan._id.toString()
        }
      });
      
      await transaction.save();
      
      // Add to credit history
      user.credits.history.push({
        amount: plan.creditsPerPeriod,
        transactionType: 'subscription',
        relatedTo: transaction._id,
        relatedModel: 'Transaction',
        date: new Date(),
        notes: `${plan.creditsPerPeriod} credits from ${plan.name} subscription`
      });
      
      await user.save();
      
      return NextResponse.json({
        success: true,
        message: `Successfully subscribed to ${plan.name} plan`,
        subscription: {
          id: stripeSubscription.id,
          plan: {
            id: plan._id.toString(),
            name: plan.name,
            price: plan.price,
            billingPeriod: plan.billingPeriod,
            credits: plan.creditsPerPeriod
          },
          startDate: startDate,
          nextBillingDate: endDate,
          autoRenew: true
        },
        credits: {
          available: user.credits.available,
          added: plan.creditsPerPeriod
        }
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return NextResponse.json(
        { error: stripeError.message || "Payment processing error" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

// PUT to update subscription (cancel, reactivate, toggle auto-renew)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Make sure we're dealing with a tradesperson
    if (session.user.role !== "tradesperson") {
      return NextResponse.json(
        { error: "Only tradespeople can manage subscriptions" },
        { status:403 }
    );
  }

  await connectToDatabase();
  
  const body = await request.json();
  
  // Validate the request body
  if (!body.action) {
    return NextResponse.json(
      { error: "Missing action parameter" },
      { status: 400 }
    );
  }
  
  // Find the user
  const user = await Tradesperson.findById(session.user.id)
    .populate('subscription.plan');
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  
  // Check if user has an active subscription
  if (!user.subscription || !user.subscription.plan) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 400 }
    );
  }
  
  const action = body.action;
  
  try {
    // Handle different actions
    switch (action) {
      case 'cancel':
        // Cancel subscription in Stripe
        if (user.subscription.stripeSubscriptionId) {
          await stripe.subscriptions.update(
            user.subscription.stripeSubscriptionId,
            { cancel_at_period_end: true }
          );
        }
        
        // Update user's subscription status
        user.subscription.status = 'canceled';
        user.subscription.autoRenew = false;
        await user.save();
        
        return NextResponse.json({
          success: true,
          message: "Subscription canceled successfully",
          currentPlan: {
            id: user.subscription.plan._id.toString(),
            name: user.subscription.plan.name,
            price: user.subscription.plan.price,
            billingPeriod: user.subscription.plan.billingPeriod,
            credits: user.subscription.plan.creditsPerPeriod,
          },
          status: user.subscription.status,
          nextBillingDate: user.subscription.endDate,
          autoRenew: user.subscription.autoRenew
        });
        
      case 'reactivate':
        // Only allow reactivation if subscription was canceled
        if (user.subscription.status !== 'canceled') {
          return NextResponse.json(
            { error: "Only canceled subscriptions can be reactivated" },
            { status: 400 }
          );
        }
        
        // Reactivate subscription in Stripe
        if (user.subscription.stripeSubscriptionId) {
          await stripe.subscriptions.update(
            user.subscription.stripeSubscriptionId,
            { cancel_at_period_end: false }
          );
        }
        
        // Update user's subscription status
        user.subscription.status = 'active';
        user.subscription.autoRenew = true;
        await user.save();
        
        return NextResponse.json({
          success: true,
          message: "Subscription reactivated successfully",
          currentPlan: {
            id: user.subscription.plan._id.toString(),
            name: user.subscription.plan.name,
            price: user.subscription.plan.price,
            billingPeriod: user.subscription.plan.billingPeriod,
            credits: user.subscription.plan.creditsPerPeriod,
          },
          status: user.subscription.status,
          nextBillingDate: user.subscription.endDate,
          autoRenew: user.subscription.autoRenew
        });
        
      case 'toggle-autorenew':
        // Toggle auto-renew setting
        const newAutoRenewValue = !user.subscription.autoRenew;
        
        // Update in Stripe
        if (user.subscription.stripeSubscriptionId) {
          await stripe.subscriptions.update(
            user.subscription.stripeSubscriptionId,
            { cancel_at_period_end: !newAutoRenewValue }
          );
        }
        
        // Update user's subscription
        user.subscription.autoRenew = newAutoRenewValue;
        
        // If turning auto-renew back on for a canceled subscription, change status to active
        if (newAutoRenewValue && user.subscription.status === 'canceled') {
          user.subscription.status = 'active';
        }
        
        await user.save();
        
        return NextResponse.json({
          success: true,
          message: newAutoRenewValue 
            ? "Auto-renewal enabled successfully" 
            : "Auto-renewal disabled successfully",
          currentPlan: {
            id: user.subscription.plan._id.toString(),
            name: user.subscription.plan.name,
            price: user.subscription.plan.price,
            billingPeriod: user.subscription.plan.billingPeriod,
            credits: user.subscription.plan.creditsPerPeriod,
          },
          status: user.subscription.status,
          nextBillingDate: user.subscription.endDate,
          autoRenew: user.subscription.autoRenew
        });
        
      case 'change-plan':
        // Validate new plan ID
        if (!body.planId) {
          return NextResponse.json(
            { error: "Missing plan ID for plan change" },
            { status: 400 }
          );
        }
        
        // Find the new subscription plan
        const newPlan = await Subscription.findById(body.planId);
        
        if (!newPlan) {
          return NextResponse.json(
            { error: "Invalid subscription plan" },
            { status: 400 }
          );
        }
        
        // Change subscription in Stripe
        if (user.subscription.stripeSubscriptionId) {
          // Get the subscription
          const subscription = await stripe.subscriptions.retrieve(
            user.subscription.stripeSubscriptionId
          );
          
          // Update the subscription with the new price
          await stripe.subscriptions.update(
            user.subscription.stripeSubscriptionId,
            {
              items: [{
                id: subscription.items.data[0].id,
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: `${newPlan.name} Subscription`,
                    description: `${newPlan.creditsPerPeriod} credits per ${newPlan.billingPeriod}`,
                  },
                  unit_amount: Math.round(newPlan.price * 100),
                  recurring: {
                    interval: newPlan.billingPeriod === 'month' ? 'month' : 'year',
                  }
                },
              }],
              metadata: {
                planId: newPlan._id.toString()
              },
              proration_behavior: 'create_prorations'
            }
          );
        }
        
        // Calculate the new end date based on billing period
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        if (newPlan.billingPeriod === 'month') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (newPlan.billingPeriod === 'year') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        
        // Store the old credits amount before updating
        const oldCreditsPerPeriod = user.subscription.plan.creditsPerPeriod;
        
        // Update user's subscription
        user.subscription.plan = newPlan._id;
        user.subscription.status = 'active';
        user.subscription.startDate = startDate;
        user.subscription.endDate = endDate;
        
        // Calculate the credit difference and add if the new plan has more credits
        const creditDifference = newPlan.creditsPerPeriod - oldCreditsPerPeriod;
        
        if (creditDifference > 0) {
          // Initialize credits if needed
          if (!user.credits) {
            user.credits = { available: 0, spent: 0, history: [] };
          }
          
          user.credits.available += creditDifference;
          
          // Add transaction record for additional credits
          const transaction = new Transaction({
            userId: user._id,
            amount: creditDifference,
            type: 'subscription',
            description: `${creditDifference} additional credits from upgrading to ${newPlan.name} subscription`,
            status: 'completed',
            metadata: {
              subscriptionId: user.subscription.stripeSubscriptionId,
              planId: newPlan._id.toString(),
              planUpgrade: true
            }
          });
          
          await transaction.save();
          
          // Add to credit history
          user.credits.history.push({
            amount: creditDifference,
            transactionType: 'subscription',
            relatedTo: transaction._id,
            relatedModel: 'Transaction',
            date: new Date(),
            notes: `${creditDifference} additional credits from upgrading to ${newPlan.name} subscription`
          });
        }
        
        await user.save();
        
        return NextResponse.json({
          success: true,
          message: `Successfully changed to ${newPlan.name} plan`,
          currentPlan: {
            id: newPlan._id.toString(),
            name: newPlan.name,
            price: newPlan.price,
            billingPeriod: newPlan.billingPeriod,
            credits: newPlan.creditsPerPeriod,
          },
          status: user.subscription.status,
          nextBillingDate: endDate,
          autoRenew: user.subscription.autoRenew,
          creditDifference: creditDifference > 0 ? creditDifference : 0
        });
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (stripeError) {
    console.error('Stripe error:', stripeError);
    return NextResponse.json(
      { error: stripeError.message || "Payment processing error" },
      { status: 400 }
    );
  }
} catch (error) {
  console.error("Error updating subscription:", error);
  return NextResponse.json(
    { error: "Failed to update subscription" },
    { status: 500 }
  );
}
}