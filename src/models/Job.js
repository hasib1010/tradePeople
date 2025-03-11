// src/models/Job.js
import mongoose from 'mongoose';

// Define the Job Schema
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
  },
  // Replace the category enum with ObjectId reference
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeCategory',
    required: [true, 'Job category is required']
  },
  // To this:
  legacyCategory: {
    type: String,
    required: false
    // Removed the enum restriction
  },

  subCategories: [String],
  requiredSkills: [String],
  budget: {
    type: {
      type: String,
      enum: ['fixed', 'hourly', 'negotiable'],
      default: 'negotiable',
    },
    minAmount: Number,
    maxAmount: Number,
    currency: {
      type: String,
      default: 'USD',
    },
  },
  location: {
    address: String,
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
    },
    country: {
      type: String,
      default: 'United States',
    },
    coordinates: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: {
        type: [Number],  // [longitude, latitude] - Correct order is [longitude, latitude]
        required: true,
      },
    },
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'in-progress', 'completed', 'canceled', 'expired'],
    default: 'open',
  },
  timeline: {
    postedDate: {
      type: Date,
      default: Date.now,
    },
    startDate: Date,
    endDate: Date,
    expectedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['hours', 'days', 'weeks', 'months'],
      },
    },
  },
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
  }],
  selectedTradesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isUrgent: {
    type: Boolean,
    default: false,
  },
  visibility: {
    type: String,
    enum: ['public', 'invite-only', 'private'],
    default: 'public',
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  applicationCount: {
    type: Number,
    default: 0,
  },
  creditCost: {
    type: Number,
    default: 1,
  },
  completionDetails: {
    completedAt: Date,
    finalAmount: Number,
    customerFeedback: String,
    tradespersonFeedback: String,
    dispute: {
      exists: {
        type: Boolean,
        default: false,
      },
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'resolved', 'rejected'],
      },
      resolvedAt: Date,
    },
  },
}, {
  timestamps: true,
});

// Add indexes for efficient querying
jobSchema.index({ 'location.coordinates': '2dsphere' });  // Geospatial index for location
jobSchema.index({ category: 1, 'location.city': 1, status: 1 });  // Index for filtering jobs
jobSchema.index({ customer: 1 });  // Index for customer
jobSchema.index({ selectedTradesperson: 1 });  // Index for selected tradesperson
jobSchema.index({ status: 1, 'timeline.postedDate': 1 });  // Index for status and timeline

// Create and export Job model
const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

export default Job;