// src/models/Subscription.js
import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subscription name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  planCode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true  // Allow null/undefined values to avoid unique constraint errors
  },
  features: [String],
  nonFeatures: [String],
  featured: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    required: [true, 'Subscription price is required'],
    min: 0,
  },
  billingPeriod: {
    type: String,
    enum: ['month', 'year'],
    default: 'month',
  },
  creditsPerPeriod: {
    type: Number,
    required: [true, 'Credits per period is required'],
    min: 0,
  },
  features: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
  stripePriceId: String,
  stripeProductId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

});

// Add index for faster queries
subscriptionSchema.index({ isActive: 1 });
subscriptionSchema.index({ price: 1 });

// Auto-update the updatedAt field
subscriptionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

export default Subscription;