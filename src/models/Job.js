import mongoose from 'mongoose';

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
  category: {
    type: String,
    required: [true, 'Job category is required'],
    enum: [
      'Plumbing', 'Electrical', 'Carpentry', 'Painting',
      'Roofing', 'HVAC', 'Landscaping', 'Masonry',
      'Flooring', 'Tiling', 'General Contracting', 'Drywall',
      'Cabinetry', 'Fencing', 'Decking', 'Concrete',
      'Window Installation', 'Door Installation', 'Appliance Repair',
      'Handyman Services', 'Cleaning Services', 'Moving Services',
      'Other'
    ],
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
      type: { type: String, default: 'Point' },
      coordinates: [Number], // [longitude, latitude]
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
    name: String,
    url: String,
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
jobSchema.index({ 'location.coordinates': '2dsphere' });
jobSchema.index({ category: 1, 'location.city': 1, status: 1 });
jobSchema.index({ customer: 1 });
jobSchema.index({ selectedTradesperson: 1 });
jobSchema.index({ status: 1, timeline: 1 });

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

export default Job;