// src/models/Application.js
import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  tradesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'rejected', 'accepted', 'withdrawn'],
    default: 'pending'
  },
  coverLetter: {
    type: String,
    required: [true, 'Please provide a cover letter explaining why you are suitable for this job']
  },
  bid: {
    amount: {
      type: Number,
      required: function() { 
        return this.bid.type !== 'negotiable';
      }
    },
    type: {
      type: String,
      enum: ['fixed', 'hourly', 'negotiable'],
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    estimatedHours: Number,
    estimatedDays: Number
  },
  availability: {
    canStartOn: Date,
    availableDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    preferredHours: {
      start: String, // "09:00"
      end: String    // "17:00"
    }
  },
  additionalDetails: {
    type: String
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  customerViewed: {
    type: Boolean,
    default: false
  },
  proposedTimeline: {
    startDate: Date,
    completionDate: Date,
    estimatedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['hours', 'days', 'weeks', 'months']
      }
    }
  },
  notes: {
    customer: String,
    tradesperson: String,
    internal: String
  },
  withdrawalReason: String,
  
  // Credit tracking fields
  creditDeducted: {
    type: Boolean,
    default: false
  },
  creditTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  // Status history tracking
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected', 'accepted', 'withdrawn']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String
  }]
}, {
  timestamps: true
});

// Add indexes for efficient querying
applicationSchema.index({ job: 1, tradesperson: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ tradesperson: 1, status: 1 });
applicationSchema.index({ submittedAt: -1 });
applicationSchema.index({ creditDeducted: 1 });

// Middleware to track status changes
applicationSchema.pre('save', function(next) {
  // If this is a new document or the status has been modified
  if (this.isNew || this.isModified('status')) {
    // Add to status history
    this.statusHistory = this.statusHistory || [];
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      // changedBy will be set manually in the route handler
    });
    
    // Update lastUpdated timestamp
    this.lastUpdated = new Date();
  }
  next();
});

// Create and export the Application model
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

export default Application;