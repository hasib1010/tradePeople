// src/app/api/webhooks/stripe/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import Transaction from "@/models/Transaction";
import Subscription from "@/models/Subscription";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");
    
    console.log('Webhook received. Verifying signature...');
    
    let event;
    
    try {
      // Verify the event came from Stripe
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret
      );
      console.log('Webhook signature verified. Event type:', event.type);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Handle payment events
    switch (event.type) {
      // One-time payment events
      case 'payment_intent.succeeded':
        console.log('Processing payment_intent.succeeded event');
        await handleSuccessfulPayment(event.data.object);
        console.log('Payment successfully processed');
        break;
        
      case 'payment_intent.payment_failed':
        console.log('Processing payment_intent.payment_failed event');
        await handleFailedPayment(event.data.object);
        console.log('Failed payment recorded');
        break;
        
      // Subscription events
      case 'customer.subscription.created':
        console.log('Processing subscription created event');
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        console.log('Processing subscription updated event');
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        console.log('Processing subscription deleted event');
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        console.log('Processing invoice payment succeeded event');
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        console.log('Processing invoice payment failed event');
        await handleInvoicePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`Ignoring unhandled event type: ${event.type}`);
    }
    
    // Return success to prevent retries
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Return success to avoid retries
    return NextResponse.json({ received: true, warning: 'Processed with errors' });
  }
}

// Function to handle successful one-time payments
async function handleSuccessfulPayment(paymentIntent) {
  try {
    console.log('Processing successful payment:', paymentIntent.id);
    
    // Get the metadata from the payment intent
    const { userId, packageId, credits } = paymentIntent.metadata;
    
    if (!userId || !credits) {
      console.error('Missing required metadata:', { userId, packageId, credits });
      throw new Error('Missing required metadata for payment processing');
    }
    
    // Check if payment was already processed
    const existingTransaction = await Transaction.findOne({
      'metadata.stripePaymentIntentId': paymentIntent.id
    });
    
    if (existingTransaction) {
      console.log('Payment already processed:', existingTransaction._id);
      return;
    }
    
    // Create a new transaction record
    const transaction = new Transaction({
      userId: userId,
      amount: parseInt(credits),
      price: paymentIntent.amount / 100, // Convert cents back to dollars
      type: 'purchase',
      description: `Purchased ${credits} credits`,
      status: 'completed',
      paymentMethodId: paymentIntent.payment_method,
      metadata: {
        stripePaymentIntentId: paymentIntent.id,
        packageId: packageId
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save the transaction
    await transaction.save();
    console.log('Transaction saved successfully:', transaction._id);
    
    // Update the user's credits
    const tradesperson = await Tradesperson.findById(userId);
    
    if (!tradesperson) {
      console.error('User not found:', userId);
      throw new Error('User not found');
    }
    
    // Initialize credits object if it doesn't exist
    if (!tradesperson.credits) {
      tradesperson.credits = {
        available: 0,
        spent: 0,
        history: []
      };
    }
    
    // Update credits
    const creditsAmount = parseInt(credits);
    const updatedTradesperson = await Tradesperson.findByIdAndUpdate(
      userId,
      {
        $inc: {
          "credits.available": creditsAmount
        },
        $push: {
          "credits.history": {
            amount: creditsAmount,
            transactionType: "purchase",
            relatedTo: transaction._id,
            relatedModel: "Transaction",
            date: new Date(),
            notes: `Purchased ${creditsAmount} credits (Stripe payment ${paymentIntent.id})`
          }
        }
      },
      { new: true }
    );
    
    console.log(`Successfully processed payment ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error in handleSuccessfulPayment:', error);
  }
}

// Function to handle failed payments
async function handleFailedPayment(paymentIntent) {
  try {
    console.log('Processing failed payment:', paymentIntent.id);
    
    // Check if this failed payment was already recorded
    const existingTransaction = await Transaction.findOne({
      'metadata.stripePaymentIntentId': paymentIntent.id
    });
    
    if (existingTransaction) {
      console.log('Failed payment already recorded:', existingTransaction._id);
      return;
    }
    
    // Create a failed transaction record
    const transaction = new Transaction({
      userId: paymentIntent.metadata.userId,
      amount: parseInt(paymentIntent.metadata.credits || 0),
      price: paymentIntent.amount / 100,
      type: 'purchase',
      description: `Failed purchase of ${paymentIntent.metadata.credits || 0} credits`,
      status: 'failed',
      paymentMethodId: paymentIntent.payment_method,
      metadata: {
        stripePaymentIntentId: paymentIntent.id,
        packageId: paymentIntent.metadata.packageId,
        error: paymentIntent.last_payment_error?.message || 'Payment failed'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save the transaction
    await transaction.save();
    
    console.log(`Recorded failed payment for user ${paymentIntent.metadata.userId}`);
  } catch (error) {
    console.error('Error in handleFailedPayment:', error);
  }
}

// Subscription event handlers
async function handleSubscriptionCreated(subscription) {
  console.log('Processing subscription created event:', subscription.id);
  
  try {
    // Get user ID from metadata
    const userId = subscription.metadata.userId;
    
    if (!userId) {
      console.error('No user ID found in subscription metadata:', subscription.id);
      return;
    }
    
    // Find the user
    const user = await Tradesperson.findById(userId);
    
    if (!user) {
      console.error('User not found:', userId);
      return;
    }
    
    console.log(`Subscription ${subscription.id} created for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Processing subscription updated event:', subscription.id);
  
  try {
    // Get user by stripeSubscriptionId
    const user = await Tradesperson.findOne({
      'subscription.stripeSubscriptionId': subscription.id
    });
    
    if (!user) {
      console.error('User with subscription not found:', subscription.id);
      return;
    }
    
    // Update subscription status
    let status = user.subscription.status;
    
    switch(subscription.status) {
      case 'active':
        status = 'active';
        break;
      case 'canceled':
        status = 'canceled';
        break;
      case 'unpaid':
        status = 'unpaid';
        break;
      case 'past_due':
        status = 'past_due';
        break;
      default:
        // Keep existing status
        break;
    }
    
    // Update auto-renew based on cancel_at_period_end
    const autoRenew = !subscription.cancel_at_period_end;
    
    // Update subscription data
    user.subscription.status = status;
    user.subscription.autoRenew = autoRenew;
    
    await user.save();
    
    console.log(`Subscription ${subscription.id} updated for user ${user._id.toString()}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Processing subscription deleted event:', subscription.id);
  
  try {
    // Get user by stripeSubscriptionId
    const user = await Tradesperson.findOne({
      'subscription.stripeSubscriptionId': subscription.id
    });
    
    if (!user) {
      console.error('User with subscription not found:', subscription.id);
      return;
    }
    
    // Update subscription status to expired
    user.subscription.status = 'expired';
    user.subscription.autoRenew = false;
    
    await user.save();
    
    console.log(`Subscription ${subscription.id} marked as expired for user ${user._id.toString()}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Processing invoice payment succeeded event:', invoice.id);
  
  // Only handle subscription invoices
  if (!invoice.subscription) {
    console.log('Not a subscription invoice, skipping');
    return;
  }
  
  try {
    const subscriptionId = invoice.subscription;
    
    // Get user by stripeSubscriptionId
    const user = await Tradesperson.findOne({
      'subscription.stripeSubscriptionId': subscriptionId
    }).populate('subscription.plan');
    
    if (!user) {
      console.error('User with subscription not found:', subscriptionId);
      return;
    }
    
    // Only add credits for renewal payments
    if (invoice.billing_reason === 'subscription_cycle') {
      // Add the subscription credits
      if (!user.credits) {
        user.credits = { available: 0, spent: 0, history: [] };
      }
      
      const creditsToAdd = user.subscription.plan.creditsPerPeriod;
      user.credits.available += creditsToAdd;
      
      // Add transaction record
      const transaction = new Transaction({
        userId: user._id,
        amount: creditsToAdd,
        type: 'subscription',
        description: `${creditsToAdd} credits from ${user.subscription.plan.name} subscription renewal`,
        status: 'completed',
        metadata: {
          subscriptionId: subscriptionId,
          invoiceId: invoice.id
        }
      });
      
      await transaction.save();
      
      // Add to credit history
      user.credits.history.push({
        amount: creditsToAdd,
        transactionType: 'subscription',
        relatedTo: transaction._id,
        relatedModel: 'Transaction',
        date: new Date(),
        notes: `${creditsToAdd} credits from ${user.subscription.plan.name} subscription renewal`
      });
      
      // Update subscription end date
      const newEndDate = new Date(invoice.lines.data[0].period.end * 1000);
      user.subscription.endDate = newEndDate;
      
      await user.save();
      
      console.log(`Added ${creditsToAdd} credits to user ${user._id.toString()} for subscription renewal`);
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('Processing invoice payment failed event:', invoice.id);
  
  // Only handle subscription invoices
  if (!invoice.subscription) {
    console.log('Not a subscription invoice, skipping');
    return;
  }
  
  try {
    const subscriptionId = invoice.subscription;
    
    // Get user by stripeSubscriptionId
    const user = await Tradesperson.findOne({
      'subscription.stripeSubscriptionId': subscriptionId
    });
    
    if (!user) {
      console.error('User with subscription not found:', subscriptionId);
      return;
    }
    
    // Update subscription status to past_due
    user.subscription.status = 'past_due';
    
    await user.save();
    
    console.log(`Subscription ${subscriptionId} marked as past_due for user ${user._id.toString()}`);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

// Configure to accept raw body
export const config = {
  api: {
    bodyParser: false,
  },
};